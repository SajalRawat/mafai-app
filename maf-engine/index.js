const http = require('http');
const httpProxy = require('http-proxy');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const pino = require('pino');
const crypto = require('crypto');

const logger = pino({ level: 'info' });
const proxy = httpProxy.createProxyServer({});

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maf_db';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

// --- Database Schemas (Inline for simplicity in this microservice) ---
// LOG SCHEMA MATCHING src/lib/models/Log.ts
const LogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    time: { type: String, required: true }, // Keeping string format as per UI requirement, or strict date? UI uses string 'time' usually.
    ip: { type: String, required: true },
    method: { type: String, required: true },
    uri: { type: String, required: true },
    status: { type: Number, required: true },
    size: { type: String, required: true },
    userAgent: { type: String },
    referer: { type: String },
    country: { type: String },
    attackType: { type: String },
    aiAnalysis: { type: String },
    createdAt: { type: Date, default: Date.now },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' } // Optional but good for future filtering
});
const Log = mongoose.model('Log', LogSchema);

const ApplicationSchema = new mongoose.Schema({
    name: String,
    domain: String,
    ports: [{ protocol: String, port: String }],
    upstreams: [String],
    type: String, // 'Reverse Proxy', 'Static', 'Redirect'
    defenseMode: String,
    defenseStatus: Boolean,
    loggingEnabled: { type: Boolean, default: true }
});
const Application = mongoose.model('Application', ApplicationSchema);

// --- Proxy Logic ---
const activeServers = new Map(); // port -> server instance
const appConfigs = new Map(); // port -> latest app config

async function startServer(app, portConfig) {
    const port = parseInt(portConfig.port);

    // Update the config map regardless of whether server exists
    appConfigs.set(port, app);

    if (activeServers.has(port)) {
        logger.info(`Server already running on port ${port} - Updated Config`);
        return;
    }

    const server = http.createServer(async (req, res) => {
        // ALWAYS fetch the latest config for this port
        const currentApp = appConfigs.get(port);
        if (!currentApp) {
            res.writeHead(500);
            res.end('Internal Server Error: App Config Missing');
            return;
        }

        const start = Date.now();
        const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

        // --- DEFENSE MODES CHECK ---
        const mode = currentApp.defenseMode || (currentApp.defenseStatus ? 'Defense' : 'Audited'); // Backwards compat

        if (mode === 'Offline') {
            res.writeHead(403);
            res.end('<h1>Service Offline</h1><p>This service is currently offline.</p>');
            // Logging disabled for Offline mode as per user request
            return;
        }

        // --- AI WAF CHECK ---
        if (mode === 'Defense') {
            const aiResult = await analyzeRequestWithAI(req, currentApp);

            if (aiResult.verdict === 'BLOCK') {
                logger.warn(`AI BLOCKED request from ${clientIp} to ${req.url}. Reason: ${aiResult.reason}`);
                res.writeHead(403);
                res.end(`<h1>403 Forbidden</h1><p>Blocked by MAF AI Defense</p>`);

                if (currentApp.loggingEnabled) {
                    // Pass the AI reason to logs
                    logRequest(req, 403, Date.now() - start, clientIp, currentApp._id, 0, 'AI Block', aiResult.reason);
                }
                return;
            }
        }
        // --------------------

        // Logic for different types
        if (currentApp.type === 'Reverse Proxy') {
            // Simple Round Robin if multiple upstreams (taking first for MVP)
            // Fallback to domain if upstream is missing (User error handling)
            let target = currentApp.upstreams[0];
            if (!target && currentApp.domain && currentApp.domain.startsWith('http')) {
                target = currentApp.domain;
            }

            if (!target) {
                res.writeHead(502);
                res.end('Bad Gateway: No upstream configured');
                return;
            }

            proxy.web(req, res, { target, changeOrigin: true }, (err) => {
                logger.error(`Proxy error for ${currentApp.name} on port ${port}:`, err);
                if (!res.headersSent) {
                    res.writeHead(502);
                    res.end('Bad Gateway');
                }
                // Log Error
                if (currentApp.loggingEnabled) {
                    logRequest(req, 502, Date.now() - start, clientIp, currentApp._id, 0);
                }
            });

        } else if (currentApp.type === 'Redirect') {
            let target = currentApp.upstreams[0];
            // Fallback to domain if upstream is missing
            if (!target && currentApp.domain && currentApp.domain.startsWith('http')) {
                target = currentApp.domain;
            }

            if (target) {
                // FORCE 307 TO PREVENT CACHING AND ENSURE LOGGING
                res.writeHead(307, {
                    'Location': target,
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end();
                if (currentApp.loggingEnabled) {
                    logRequest(req, 307, Date.now() - start, clientIp, currentApp._id, 0);
                }
            } else {
                // Fallback if no upstream is defined for redirection
                res.writeHead(404);
                res.end('Not Found: No redirect target configured');
                if (currentApp.loggingEnabled) {
                    logRequest(req, 404, Date.now() - start, clientIp, currentApp._id, 0);
                }
            }
        } else {
            res.writeHead(200);
            res.end('MAF Static Site (Placeholder)');
            if (currentApp.loggingEnabled) {
                logRequest(req, 200, Date.now() - start, clientIp, currentApp._id, 25);
            }
        }
    });

    // Logging hook
    server.on('request', (req, res) => {
        const start = Date.now();
        let responseSize = 0;

        // Basic size estimation
        const originalWrite = res.write;
        const originalEnd = res.end;

        res.write = function (chunk, ...args) {
            if (chunk) responseSize += chunk.length;
            return originalWrite.apply(res, [chunk, ...args]);
        };

        res.end = function (chunk, ...args) {
            if (chunk) responseSize += chunk.length;

            // Log after response finishes
            res.once('finish', () => {
                const currentApp = appConfigs.get(port); // Dynamic lookup
                if (currentApp && currentApp.loggingEnabled) {
                    const type = req.aiVerdict ? req.aiVerdict.type : 'Normal';
                    const analysis = req.aiVerdict ? req.aiVerdict.analysis : null;
                    logRequest(req, res.statusCode, Date.now() - start, req.socket.remoteAddress || 'unknown', currentApp._id, responseSize, type, analysis);
                }
            });

            return originalEnd.apply(res, [chunk, ...args]);
        };
    });

    server.listen(port, () => {
        logger.info(`MAF Engine listening on port ${port} for app ${app.name}`);
    });

    // Track server (to close later if needed)
    activeServers.set(port, server);
}

// --- AI Analysis Logic ---
async function analyzeRequestWithAI(req, app) {
    try {
        // AI Check forced for ALL requests
        // AI Optimization: Skip analysis for static files
        if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg|eot|mp4|webm|mp3|wav|json|map)$/i)) return { verdict: 'ALLOW', reason: null };
        // Skip OPTIONS requests
        if (req.method === 'OPTIONS') return { verdict: 'ALLOW', reason: null };

        const prompt = `
        You are a Web Application Firewall (WAF) engine. 
        Analyze the following HTTP request for malicious content (SQL Injection, XSS, Path Traversal, Command Injection, etc.).
        
        Request Method: ${req.method}
        Request URL: ${req.url}
        User-Agent: ${req.headers['user-agent']}

        Reply strictly in JSON format with two fields:
        {
            "verdict": "BLOCK" or "ALLOW",
            "reason": "A short summary of why it was blocked and what the attack could do (Max 15 words)"
        }
        `;

        // 3000ms timeout for AI verdict to handle load
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const modelToUse = app?.aiModel || 'mistral';

        const response = await fetch('http://maf-ai:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelToUse,
                prompt: prompt,
                stream: false,
                format: "json" // Force JSON mode if supported by Ollama/Mistral
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) return { verdict: 'ALLOW', reason: null }; // Fail open on API error

        const data = await response.json();
        let result = { verdict: 'ALLOW', reason: null };

        try {
            // Mistral might wrap it or return raw text. Try to parse.
            const rawResponse = data.response.trim();
            // Attempt to find JSON object in response if extra text exists
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;

            const parsed = JSON.parse(jsonStr);
            result.verdict = parsed.verdict?.toUpperCase() || 'ALLOW';
            result.reason = parsed.reason || null;
        } catch (e) {
            // Fallback: Check for BLOCK keyword if JSON parse fails
            if (data.response.toUpperCase().includes('BLOCK')) {
                result.verdict = 'BLOCK';
                result.reason = "AI Triggered (Parse Error)";
            }
        }

        if (result.verdict.includes('BLOCK')) return { verdict: 'BLOCK', reason: result.reason };
        return { verdict: 'ALLOW', reason: null };

    } catch (error) {
        // Fail Open on Timeout or Error
        // logger.error("AI Analysis Failed (Failing Open)", error.name);
        return { verdict: 'ALLOW', reason: null };
    }
}

// --- Redis Client ---
const redisClient = createClient({
    url: REDIS_URI
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Connected to Redis'));

async function logRequest(req, status, duration, ip, appId, size, attackType = null, aiAnalysis = null) {
    try {
        const logEntry = {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            ip: ip,
            method: req.method,
            uri: req.url,
            status: status,
            size: `${size}B`,
            userAgent: req.headers['user-agent'],
            referer: req.headers['referer'],
            country: 'Unknown',
            attackType: attackType,
            aiAnalysis: aiAnalysis,
            createdAt: new Date(),
            applicationId: appId
        };

        await Log.create(logEntry);

        // Publish to Redis for real-time stats
        if (redisClient.isOpen) {
            await redisClient.publish('maf-logs', JSON.stringify(logEntry));
        }

    } catch (e) {
        logger.error('Failed to write log', e);
    }
}

async function loadConfiguration() {
    logger.info('Loading configuration from MongoDB...');
    try {
        const apps = await Application.find({});
        logger.info(`Found ${apps.length} applications.`);

        for (const app of apps) {
            for (const portConfig of (app.ports || [])) {
                try {
                    await startServer(app, portConfig);
                } catch (err) {
                    logger.error(`Failed to start server for ${app.name} on port ${portConfig.port}`, err);
                }
            }
        }
    } catch (err) {
        logger.error('Failed to load apps', err);
    }
}

// --- Initialization ---
async function init() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('Connected to MongoDB');

        await redisClient.connect();

        // Create a separate subscriber client (Redis clients in sub mode can't do other cmds)
        const subscriber = redisClient.duplicate();
        await subscriber.connect();

        await subscriber.subscribe('maf-config-reload', (message) => {
            logger.info(`Received config reload signal: ${message}`);
            loadConfiguration();
        });

        await loadConfiguration();

        // Refresh config every 30 seconds (Simple dynamic config)
        setInterval(loadConfiguration, 30000);

    } catch (err) {
        logger.error('Initialization failed', err);
        process.exit(1);
    }
}

init();

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing servers...');
    for (const server of activeServers.values()) {
        server.close();
    }
    Promise.all([
        mongoose.connection.close(),
        redisClient.quit()
    ]).then(() => {
        process.exit(0);
    });
});
