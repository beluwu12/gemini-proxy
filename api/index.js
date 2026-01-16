const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(express.json());

// CORS manual simple
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

const config = {
    geminiKey: process.env.GEMINI_API_KEY,
};

// Volatile Memory Map
const sessions = new Map();

// Helper context (simplified)
function getContext(id) {
    if (!sessions.has(id)) sessions.set(id, []);
    return sessions.get(id);
}

app.get('/health', (req, res) => res.json({ status: "healthy_minimal" }));

app.all('/api*', async (req, res) => {
    try {
        const prompt = req.query.prompt || req.body?.prompt;
        const sessionId = req.query.sessionId || req.body?.sessionId;

        if (!prompt) return res.json({ error: "no prompt" });

        const ai = new GoogleGenAI({ apiKey: config.geminiKey });

        // Simple context handling
        let fullPrompt = prompt;
        if (sessionId) {
            const history = getContext(sessionId);
            const contextStr = history.map(m => `${m.role}: ${m.text}`).join("\n");
            fullPrompt = `History:\n${contextStr}\nUser: ${prompt}`;

            // Save user msg
            history.push({ role: 'User', text: prompt });
            if (history.length > 10) history.shift();
        }

        const resp = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: fullPrompt
        });

        const text = (resp.text || "").replace(/```/g, '').trim();

        if (sessionId) {
            getContext(sessionId).push({ role: 'AI', text });
        }

        res.json({ response: text, sessionId });

    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

module.exports = app;