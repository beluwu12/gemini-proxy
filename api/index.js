// api/index.js - Monolithic Serverless Function
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { GoogleGenAI } = require('@google/genai');

// --- CONFIG ---
const config = {
    geminiKey: process.env.GEMINI_API_KEY,
    geminiModel: "gemini-3-flash-preview",
};

// --- SERVICES ---

// Volatile Memory
const sessions = new Map();

const contextService = {
    getContext: (sessionId) => {
        if (!sessions.has(sessionId)) return [];
        const session = sessions.get(sessionId);
        session.lastActive = Date.now();
        return session.history;
    },

    addMessage: (sessionId, role, content) => {
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, { history: [], lastActive: Date.now() });
        }
        const session = sessions.get(sessionId);
        session.history.push({ role, content });
        session.lastActive = Date.now();
        if (session.history.length > 20) session.history = session.history.slice(-20);
    },

    formatContext: (sessionId) => {
        const history = contextService.getContext(sessionId);
        if (!history.length) return "";
        return history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`).join("\n");
    }
};

// Cleanup interval
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActive > 30 * 60 * 1000) sessions.delete(id);
    }
}, 60 * 1000);

// Gemini Service
const ai = new GoogleGenAI({ apiKey: config.geminiKey });

async function generateAI(prompt, sessionId) {
    let fullPrompt = prompt;
    if (sessionId) {
        const context = contextService.formatContext(sessionId);
        if (context) fullPrompt = `Historial:\n${context}\nUsuario: ${prompt}`;
        contextService.addMessage(sessionId, 'user', prompt);
    }

    const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: fullPrompt,
        config: { maxOutputTokens: 2048, temperature: 0.7 }
    });

    const text = response.text || "";
    if (sessionId) contextService.addMessage(sessionId, 'assistant', text);
    return { response: text, sessionId };
}

// --- APP & ROUTES ---
const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(compression());

// Health
app.get('/health', (req, res) => res.json({ status: "healthy", sessions: sessions.size }));

// API Handler
const apiHandler = async (req, res) => {
    try {
        const prompt = req.query.prompt || req.body?.prompt;
        const sessionId = req.query.sessionId || req.body?.sessionId;

        if (!prompt) return res.status(400).json({ error: "Falta prompt" });

        const result = await generateAI(prompt, sessionId);

        // Clean Markdown
        const cleanText = result.response
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`/g, '')
            .trim();

        res.json({ response: cleanText, sessionId: result.sessionId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Routes
app.get('/api', apiHandler);
app.get('/api/ai', apiHandler);
app.post('/api/ai', apiHandler);

// Swagger JSON (Embedded basic spec)
app.get('/api-docs', (req, res) => {
    res.json({
        openapi: "3.0.0",
        info: { title: "Gemini Proxy", version: "1.0.0" },
        paths: {
            "/api/ai": {
                get: { parameters: [{ name: "prompt", in: "query" }], responses: { 200: { description: "OK" } } }
            }
        }
    });
});

module.exports = app;