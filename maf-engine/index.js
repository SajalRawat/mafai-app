const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const pino = require('pino');
const crypto = require('crypto');

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maf_db';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const MAF_API_URL = process.env.MAF_API_URL || 'http://localhost:3000/api'; // Internal link to Next.js API

app.use(cors());
app.use(bodyParser.json());

// --- Database Schemas (Inline for simplicity) ---
// LOG SCHEMA MATCHING src/lib/models/Log.ts
const LogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    time: { type: String, required: true },
    ip: { type: String, required: true },
    method: { type: String, required: true },
    uri: { type: String, required: true },
    status: { type: Number, required: true },
    size: { type: String, required: true },
    userAgent: { type: String },
    referer: { type: String },
    country: { type: String },
    attackType: { type: String }, // 'SQL Injection', 'XSS', 'AI Block'
    aiAnalysis: { type: String },
    createdAt: { type: Date, default: Date.now },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' }
});

const Log = mongoose.model('Log', LogSchema);

// --- Redis Client ---
const redisClient = createClient({ url: REDIS_URI });
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Connected to Redis'));

// --- Helper Functions ---

// 1. Validate Token (Ideally we cache this, but for now we hit the API or DB directly)
// Note: Since we have DB access here, we can skip the HTTP call for speed if we share the DB.
// Let's use direct DB access for Application model since we are in the same network/repo context usually.
// OTHERWISE use fetch to MAF_API_URL/validate.
// DECISION: Use direct DB access for performance and simplicity in this monolithic-style repo setup.
const ApplicationSchema = new mongoose.Schema({
    name: String,
    token: { type: String, index: true },
    defenseMode: String,
    aiModel: String,
    loggingEnabled: Boolean
});
const Application = mongoose.model('Application', ApplicationSchema);

async function validateToken(token) {
    if (!token) return null;
    return await Application.findOne({ token }).lean();
}

async function analyzeRequestWithAI(reqData, appConfig) {
    try {
        const prompt = `
        Analyze this HTTP request for security threats:
        Method: ${reqData.method}
        URL: ${reqData.path}
        Headers: ${JSON.stringify(reqData.headers)}
        Body: ${JSON.stringify(reqData.body).substring(0, 500)}
        
        Respond JSON: { "verdict": "BLOCK" | "ALLOW", "reason": "short reason" }
        `;

        const modelToUse = appConfig.aiModel || 'mistral';

        // Mock AI Call for scaffolding - Replace with actual Ollama fetch
        // In real impl, fetch('http://maf-ai:11434/api/generate', ...)

        // Simulating AI check
        // if (reqData.path.includes('union+select')) return { verdict: 'BLOCK', reason: 'SQL Injection Detected' };

        return { verdict: 'ALLOW', reason: null };

    } catch (e) {
        logger.error("AI Analysis Failed", e);
        return { verdict: 'ALLOW', reason: 'AI Fail Open' };
    }
}

async function logRequest(reqData, decision, appConfig) {
    if (!appConfig.loggingEnabled) return;

    try {
        const logEntry = {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            ip: reqData.ip,
            method: reqData.method,
            uri: reqData.path,
            status: decision.decision === 'YES' ? 200 : 403, // Pseudo status
            size: '0B',
            userAgent: reqData.headers['user-agent'] || 'unknown',
            referer: reqData.headers['referer'] || '',
            country: 'Unknown',
            attackType: decision.decision === 'NO' ? decision.reason : null,
            aiAnalysis: decision.reason,
            createdAt: new Date(),
            applicationId: appConfig._id
        };

        await Log.create(logEntry);

        if (redisClient.isOpen) {
            await redisClient.publish('maf-logs', JSON.stringify(logEntry));
        }
    } catch (e) {
        logger.error("Logging failed", e);
    }
}

// --- Main Endpoint ---
app.post('/evaluate', async (req, res) => {
    const start = Date.now();
    const { token, ip, method, path, headers, body } = req.body;

    if (!token) {
        return res.status(400).json({ decision: 'NO', reason: 'Missing Token' });
    }

    try {
        const appConfig = await validateToken(token);

        if (!appConfig) {
            return res.status(401).json({ decision: 'NO', reason: 'Invalid Token' });
        }

        if (appConfig.defenseMode === 'Offline') {
            // Offline usually means "System is off", so maybe Open/Allow or Block? 
            // "Offline" in WAF context often means "WAF is bypassed/off" -> ALLOW. 
            // But if it means "App is offline", then BLOCK. 
            // Let's assume Offline = Functionality Disabled = WAF Disabled (ALLOW) or Service Down (BLOCK)?
            // Given the context of "Defense Mode", Offline usually means "Traffic continues without inspection" OR "Traffic is stopped".
            // Let's go with "WAF Disabled / Bypassed" -> ALLOW.
            // Wait, user used 'Offline' in UI which implies "Service Offline" text in previous code.
            // Previous code: res.end('Service Offline'). So it BLOCKS traffic.
            return res.json({ decision: 'NO', reason: 'Service Unavailable (Offline Mode)' });
        }

        let decision = { decision: 'YES', reason: null };

        if (appConfig.defenseMode === 'Defense' || appConfig.defenseMode === 'Audited') {
            // Run Analysis
            const aiResult = await analyzeRequestWithAI({ ip, method, path, headers, body }, appConfig);

            if (aiResult.verdict === 'BLOCK') {
                if (appConfig.defenseMode === 'Defense') {
                    decision = { decision: 'NO', reason: aiResult.reason };
                } else {
                    // Audited: Log it but allow
                    decision = { decision: 'YES', reason: `[AUDIT] ${aiResult.reason}` };
                }
            }
        }

        // Async Logging
        logRequest({ ip, method, path, headers, body }, decision, appConfig);

        res.json(decision);

    } catch (e) {
        logger.error("Evaluation Error", e);
        // Fail Open
        res.json({ decision: 'YES', reason: 'Internal Error (Fail Open)' });
    }
});

app.get('/health', (req, res) => res.send('MAF Engine Active'));

// --- Init ---
async function init() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('Connected to MongoDB');
        await redisClient.connect();

        app.listen(PORT, () => {
            logger.info(`MAF Decision Engine listening on port ${PORT}`);
        });

    } catch (e) {
        logger.error("Init Failed", e);
        process.exit(1);
    }
}

init();
