const { GoogleGenAI } = require('@google/genai');

// --- CONFIG ---
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// --- VOLATILE MEMORY ---
// Nota: Se reinicia con cada cold start
const sessions = new Map();

function getContext(id) {
    if (!sessions.has(id)) sessions.set(id, []);
    return sessions.get(id);
}

// --- HANDLER NATIVO VERCEL ---
module.exports = async (req, res) => {
    // 1. CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const path = req.url.split('?')[0];

    // 2. Health Check
    if (path.includes('/health')) {
        return res.status(200).json({ status: "healthy_native", sessions: sessions.size });
    }

    // 3. API Logic
    try {
        const prompt = req.query.prompt || req.body?.prompt;
        const sessionId = req.query.sessionId || req.body?.sessionId;

        if (!prompt) {
            return res.status(400).json({ error: "Falta prompt" });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

        // Context Logic
        let fullPrompt = prompt;

        if (sessionId) {
            const history = getContext(sessionId);
            // Formatear historial simple
            const contextStr = history.map(m => `${m.role}: ${m.text}`).join("\n");

            if (contextStr) {
                fullPrompt = `Historial de chat previo:\n${contextStr}\n\nUsuario actual: ${prompt}`;
            }

            // Guardar mensaje usuario
            history.push({ role: 'Usuario', text: prompt });
            // Keep last 10
            if (history.length > 10) history.shift();
        }

        // Call Gemini
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: fullPrompt,
            config: {
                maxOutputTokens: 2048,
                temperature: 0.7
            }
        });

        // Clean Response
        let text = response.text || "";
        text = text.replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`/g, '')              // Remove inline code
            .replace(/\*\*/g, '')           // Remove bold
            .trim();

        // Save AI response
        if (sessionId) {
            getContext(sessionId).push({ role: 'Asistente', text });
        }

        // Return JSON
        res.status(200).json({
            response: text,
            sessionId: sessionId,
            ts: Date.now()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.toString() });
    }
};