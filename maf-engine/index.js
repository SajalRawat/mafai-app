const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pino = require('pino');
const crypto = require('crypto');

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration ---
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://maf-ui:3000'; // Internal Docker URL
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://maf-ai:11434/api/generate';

app.use(cors());
app.use(bodyParser.json());

// --- In-Memory Cache (Simple) ---
const appCache = new Map(); // token -> { config, timestamp }
const CACHE_TTL = 60 * 1000; // 1 minute

// --- Helper Functions ---

async function getAppConfig(token) {
    const now = Date.now();
    const cached = appCache.get(token);

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.config;
    }

    try {
        const response = await fetch(`${DASHBOARD_URL}/api/internal/applications/validate?token=${token}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.valid) {
            const config = {
                defenseMode: data.defenseMode,
                aiModel: data.aiModel || 'mistral'
            };
            appCache.set(token, { config, timestamp: now });
            return config;
        }
    } catch (e) {
        logger.error('Failed to validate token from dashboard', e);
    }
    return null;
}

async function analyzeWithAI(reqData, aiModel) {
    try {
        const prompt = `
        You are a Web Application Firewall (WAF). Analyze this request for security threats:
        Method: ${reqData.method}
        Path: ${reqData.path}
        Headers: ${JSON.stringify(reqData.headers)}
        Body: ${JSON.stringify(reqData.body).substring(0, 1000)}

        Return ONLY a JSON object:
        {
            "threat": boolean,
            "riskScore": number (0-100),
            "reason": "short explanation"
        }
        `;

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            body: JSON.stringify({
                model: aiModel,
                prompt: prompt,
                format: 'json',
                stream: false
            })
        });

        if (!response.ok) throw new Error('Ollama failed');

        const data = await response.json();
        return JSON.parse(data.response);
    } catch (e) {
        logger.error('AI Analysis failed', e);
        return { threat: false, riskScore: 0, reason: 'AI Fail Open' };
    }
}

async function sendTelemetry(token, reqData, verdict, analysis) {
    try {
        const logEntry = {
            id: crypto.randomUUID(),
            token,
            time: new Date().toISOString(),
            ip: reqData.ip,
            method: reqData.method,
            uri: reqData.path,
            status: verdict === 'ALLOW' ? 200 : 403,
            size: '0B',
            userAgent: reqData.headers['user-agent'],
            attackType: analysis.threat ? analysis.reason : null,
            aiAnalysis: analysis.reason
        };

        fetch(`${DASHBOARD_URL}/api/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
        }).catch(err => logger.error('Telemetry delivery failed', err));

    } catch (e) {
        logger.error('Failed to prepare telemetry', e);
    }
}

// --- Main Evaluation Route ---

app.post('/evaluate', async (req, res) => {
    const { token, request } = req.body;

    if (!token || !request) {
        return res.status(400).json({ decision: 'YES', reason: 'Invalid payload' });
    }

    try {
        const config = await getAppConfig(token);

        if (!config) {
            return res.status(401).json({ decision: 'NO', reason: 'Invalid Application Token' });
        }

        // 1. Offline Mode handling
        if (config.defenseMode === 'OFFLINE') {
            return res.json({ decision: 'YES', reason: 'Protection Disabled (Offline)' });
        }

        // 2. AI Analysis
        const analysis = await analyzeWithAI(request, config.aiModel);

        let decision = 'YES';
        if (analysis.threat && config.defenseMode === 'DEFENSE') {
            decision = 'NO';
        }

        // 3. Telemetry (Async)
        sendTelemetry(token, request, decision, analysis);

        res.json({
            decision,
            code: decision === 'YES' ? 200 : 403,
            reason: analysis.reason
        });

    } catch (e) {
        logger.error('Critical evaluation error', e);
        res.json({ decision: 'YES', reason: 'Internal Engine Error (Fail Open)' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'active' }));

app.listen(PORT, () => {
    logger.info(`MAF Decision Engine listening on port ${PORT}`);
});
