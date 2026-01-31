const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pino = require('pino');
const mongoose = require('mongoose');
const crypto = require('crypto');

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/maf_db';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://maf-ai:11434/api/generate';

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));

// --- Schemas ---
const ApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    token: { type: String, required: true, unique: true, index: true },
    defenseMode: { type: String, enum: ['DEFENSE', 'AUDITED', 'OFFLINE'], default: 'DEFENSE' },
    aiModel: { type: String, default: 'mistral' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const LogSchema = new mongoose.Schema({
    token: { type: String, required: true, index: true },
    time: { type: String, required: true },
    ip: { type: String, required: true },
    method: { type: String, required: true },
    uri: { type: String, required: true },
    status: { type: Number, required: true },
    size: { type: String, default: '0B' },
    userAgent: { type: String },
    attackType: { type: String },
    aiAnalysis: { type: String },
    createdAt: { type: Number, default: Date.now }
});

const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

app.use(cors());
app.use(bodyParser.json());

// --- In-Memory Cache (Simple) ---
const appCache = new Map(); // token -> { config, timestamp }
const CACHE_TTL = 30 * 1000; // 30 seconds

// --- Helper Functions ---

async function getAppConfig(token) {
    const now = Date.now();
    const cached = appCache.get(token);

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.config;
    }

    try {
        const app = await Application.findOne({ token }).lean();
        if (app) {
            const config = {
                defenseMode: app.defenseMode,
                aiModel: app.aiModel || 'mistral'
            };
            appCache.set(token, { config, timestamp: now });
            return config;
        }
    } catch (e) {
        logger.error('Failed to validate token from database', e);
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
        const logEntry = new Log({
            token,
            time: new Date().toISOString(),
            ip: reqData.ip || '0.0.0.0',
            method: reqData.method || 'UNKNOWN',
            uri: reqData.path || '/',
            status: verdict === 'YES' ? 200 : 403,
            size: '0B',
            userAgent: reqData.headers['user-agent'] || 'unknown',
            attackType: analysis.threat ? analysis.reason : null,
            aiAnalysis: analysis.reason,
            createdAt: Date.now()
        });

        await logEntry.save();
    } catch (e) {
        logger.error('Failed to save telemetry to database', e);
    }
}

// --- Main Evaluation Route ---

app.post('/evaluate', async (req, res) => {
    const { token, request } = req.body;

    if (!token || !request) {
        return res.status(400).json({ decision: 'NO', reason: 'Invalid payload' });
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
