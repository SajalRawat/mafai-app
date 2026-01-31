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
    id: { type: String, required: true, unique: true },
    token: { type: String, required: true, index: true },
    time: { type: String, required: true },
    ip: { type: String, required: true },
    method: { type: String, required: true },
    uri: { type: String, required: true },
    status: { type: Number, required: true },
    size: { type: String, required: true },
    userAgent: { type: String },
    attackType: { type: String },
    aiAnalysis: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

app.use(cors());
app.use(bodyParser.json());

// --- Security Constants ---
const SECURITY_PATTERNS = {
    SQLi: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /((\%27)|(\'))union/i,
        /exec(\s|\+)+(s|x)p\w+/i,
        /UNION(\s|\+)+SELECT/i,
        /DROP(\s|\+)+TABLE/i,
        /INSERT(\s|\+)+INTO/i,
        /SELECT(\s|\+)+.+FROM/i,
        /UPDATE(\s|\+)+.+SET/i,
        /DELETE(\s|\+)+FROM/i
    ],
    XSS: [
        /<script.*?>.*?<\/script>/is,
        /javascript:/i,
        /on\w+=(\"|'|%22|%27).*/i,
        /(\%3C)|<|((\%3E)|>)/i
    ],
    Traversal: [
        /(\.\.\/)+/i,
        /(\%2e\%2e\%2f)+/i,
        /\/etc\/passwd/i,
        /\/windows\/win.ini/i
    ]
};

// --- In-Memory Cache (Simple) ---
const appCache = new Map(); // token -> { config, timestamp }
const CACHE_TTL = 30 * 1000; // 30 seconds

// --- Helper Functions ---

function analyzeRequestWithRegex(requestData) {
    const checkString = (str) => {
        if (!str) return null;
        for (const [type, patterns] of Object.entries(SECURITY_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(str)) {
                    return { verdict: 'BLOCK', reason: `Pattern Match: ${type}` };
                }
            }
        }
        return null;
    };

    const urlResult = checkString(requestData.url || requestData.path);
    if (urlResult) return urlResult;

    if (requestData.body) {
        const bodyStr = typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body);
        const bodyResult = checkString(bodyStr);
        if (bodyResult) return bodyResult;
    }

    return { verdict: 'ALLOW', reason: null };
}

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
        const prompt = `[WAF] Analyze the following HTTP request body for security threats (SQLi, XSS, Path Traversal, Command Injection).
Method: ${reqData.method}
Path: ${reqData.path}
Body: ${JSON.stringify(reqData.body).substring(0, 1000)}

Instructions:
1. Ignore harmless inputs like simple text, emails, standard JSON data, or safe HTML (e.g., <b>bold</b>).
2. ONLY flag as a threat if there is a clear, actionable attack vector.
3. Distinguish between discussing code (e.g., "how to fix XSS") and executing code (e.g., actual <script> tag injection).
4. Be smart: "SELECT * FROM users" in a search query is suspicious, but "I like SQL" is not.

Output JSON ONLY: {"threat": boolean, "riskScore": 0-100, "reason": "concise reason"}
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
        const analysis = JSON.parse(data.response);
        logger.info('AI Analysis result:', analysis);
        return analysis;
    } catch (e) {
        logger.error('AI Analysis failed', e);
        return { threat: false, riskScore: 0, reason: 'AI Fail Open' };
    }
}

async function sendTelemetry(token, reqData, verdict, analysis) {
    try {
        const logEntry = new Log({
            id: crypto.randomUUID(),
            token,
            time: new Date().toISOString(),
            ip: reqData.ip || '0.0.0.0',
            method: reqData.method || 'UNKNOWN',
            uri: reqData.path || '/',
            status: verdict === 'YES' ? 200 : 403,
            size: '0B',
            userAgent: reqData.headers['user-agent'] || 'unknown',
            attackType: analysis.threat ? analysis.reason : 'Clean',
            aiAnalysis: analysis.reason,
            createdAt: new Date()
        });

        await logEntry.save();
        logger.info('Telemetry saved successfully', { id: logEntry.id });
    } catch (e) {
        logger.error('Failed to save telemetry to database', e);
    }
}

// --- Main Evaluation Route ---

app.post('/evaluate', async (req, res) => {
    const { token, request } = req.body;

    if (!token || !request) {
        logger.warn('Invalid payload received: missing token or request', { hasToken: !!token, hasRequest: !!request });
        return res.status(400).json({ decision: 'NO', reason: 'Invalid payload: missing token or request' });
    }

    try {
        const config = await getAppConfig(token);

        if (!config) {
            logger.warn('Unauthorized request: Invalid Application Token', { token });
            return res.status(401).json({ decision: 'NO', reason: 'Invalid Application Token' });
        }

        // --- Log-Only Override (e.g. from local regex check in package) ---
        if (req.body.logOnly || request.method === 'GET') {
            const isBlocked = req.body.verdict === 'BLOCK' || (request.method === 'GET' && analyzeRequestWithRegex(request).verdict === 'BLOCK');
            const analysis = {
                threat: isBlocked,
                riskScore: isBlocked ? 100 : 0,
                reason: req.body.reason || (isBlocked ? 'Blocked by Engine Regex' : 'AI skipped for GET')
            };
            sendTelemetry(token, request, isBlocked ? 'NO' : 'YES', analysis);

            // If it was a log-only request from the package, we return a special status
            if (req.body.logOnly) {
                return res.json({ decision: 'LOGGED', reason: 'Log Only Request processed' });
            }

            // Otherwise, if it's a direct evaluate call for a GET request, return YES/NO
            return res.json({
                decision: isBlocked ? 'NO' : 'YES',
                code: isBlocked ? 403 : 200,
                reason: analysis.reason
            });
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
