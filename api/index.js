import { GoogleGenAI } from "@google/genai";

// Memoria volátil simple (Global variable)
// NOTA: En Vercel Serverless, esto se reinicia frecuentemente.
// Pero funcionará para conversaciones cortas si el contenedor está "caliente".
const sessions = new Map();

// Limpiar sesiones viejas cada 10 mins (GC simple)
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActive > 10 * 60 * 1000) {
            sessions.delete(id);
        }
    }
}, 60 * 1000);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const path = req.url.split('?')[0];

    // Endpoint de Salud
    if (path === '/health') {
        return res.status(200).json({ status: "healthy", sessions: sessions.size });
    }

    // Endpoint para borrar contexto
    if (req.method === 'DELETE' && path.startsWith('/api/context/')) {
        const sessionId = path.split('/').pop();
        if (sessionId) {
            sessions.delete(sessionId);
            return res.status(200).json({ message: "Contexto limpiado" });
        }
    }

    // Endpoint Principal (AI)
    try {
        const prompt = req.query.prompt || req.body?.prompt;
        const sessionId = req.query.sessionId || req.body?.sessionId || 'default';
        const useContext = req.query.useContext !== 'false'; // Default true
        const format = req.query.format || req.body?.format || 'json';
        const system = req.query.system || req.body?.system;

        if (!prompt) {
            return res.status(400).json({ error: "Falta el parámetro 'prompt'" });
        }

        // Recuperar o iniciar historial
        let history = [];
        if (useContext && sessions.has(sessionId)) {
            history = sessions.get(sessionId).history;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const defaultSystem = "Responde directo y sin markdown. Escribe texto plano limpio.";

        const config = {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.95,
            systemInstruction: system || defaultSystem
        };

        // Crear sesión de chat con el historial previo
        const model = ai.models.get("gemini-3-flash-preview");

        // Convertir formato de historial simple a formato de Gemini SDK si es necesario
        // Aquí asumimos array de {role: "user"|"model", parts: [{text: "..."}]}

        // Generar respuesta (usando generateContent si es simple o chat si hay contexto)
        let responseText = "";

        if (useContext) {
            // Modo Chat
            // Manteinemiento manual del historial para tener control total
            // Añadir mensaje actual del usuario
            const currentHistory = [...history, { role: "user", parts: [{ text: prompt }] }];

            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: currentHistory,
                config
            });

            responseText = result.text || "";

            // Guardar en historial (User + Model)
            history.push({ role: "user", parts: [{ text: prompt }] });
            history.push({ role: "model", parts: [{ text: responseText }] });

            // Limitar historial (últimos 20 mensajes)
            if (history.length > 20) history = history.slice(-20);

            // Actualizar sesión
            sessions.set(sessionId, {
                history,
                lastActive: Date.now()
            });

        } else {
            // Modo Stateless (Sin memoria)
            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config
            });
            responseText = result.text || "";
        }

        // Limpieza de formato (Markdown Killer)
        responseText = responseText
            .replace(/```[\s\S]*?```/g, '') // Quitar bloques grandes primero
            .replace(/```/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/^#+\s/gm, '')
            .replace(/`/g, '')
            .trim();

        const responseData = {
            response: responseText,
            sessionId: sessionId,
            contextSize: history.length
        };

        if (format === 'text') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(200).send(responseText);
        } else {
            return res.status(200).json(responseData);
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: error.message || String(error) });
    }
}