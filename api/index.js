const { GoogleGenAI } = require("@google/genai");

// Simulación de Base de Datos en Memoria (Volátil en Serverless)
// Se mantiene viva mientras la instancia de Vercel no se apague (aprox 15 mins de inactividad)
const sessions = new Map();

// Helper para obtener/crear sesión
const getSession = (id) => {
    if (!sessions.has(id)) {
        sessions.set(id, {
            history: [],
            lastActive: Date.now()
        });
    }
    return sessions.get(id);
};

export default async function handler(req, res) {
    // 1. Configuración CORS (Permitir todo)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responder rápido a preflight checks
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 2. Extracción de Datos
        // Soportamos tanto GET (query) como POST (body)
        const prompt = req.query.prompt || req.body?.prompt;
        const sessionId = req.query.sessionId || req.body?.sessionId || 'default';
        const systemInstruction = req.query.system || "Responde de forma concisa y directa. NO uses Markdown. Solo texto plano.";

        if (!prompt) {
            return res.status(400).json({ error: "Falta el parámetro 'prompt'" });
        }

        // 3. Inicializar SDK de Gemini
        // Usamos la variable de entorno configurada en Vercel
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 4. Gestión de Memoria (Contexto)
        const session = getSession(sessionId);
        session.lastActive = Date.now(); // Actualizar timestamp

        // Convertir historial a formato compatible con Gemini SDK
        // (Aunque para simplificar, a veces es mejor concatenar texto si el modelo es flash)
        // Aquí concatenamos para asegurar robustez en el modelo "preview"

        let fullContext = "";
        if (session.history.length > 0) {
            fullContext = "Historial de conversación reciente:\n" +
                session.history.map(m => `${m.role}: ${m.text}`).join("\n") +
                "\n\n--- Nueva Interacción ---\n";
        }

        const finalPrompt = `${fullContext}Usuario: ${prompt}\nAsistente:`;

        // 5. Llamada a la IA
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: finalPrompt,
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 1000,
                temperature: 0.7
            }
        });

        let text = response.text || "";

        // 6. Limpieza Agresiva de Markdown (Anti-NotSoBot Break)
        // Quitamos bloques de código, negritas, etc. para que Discord lo muestre limpio.
        text = text
            .replace(/```[\s\S]*?```/g, '') // Eliminar bloques de código grandes
            .replace(/```/g, '')             // Eliminar triple backtick suelto
            .replace(/`/g, '')               // Eliminar backtick simple
            .replace(/\*\*/g, '')            // Eliminar negritas
            .replace(/^#+\s/gm, '')          // Eliminar headers markdown
            .trim();

        // 7. Guardar en Memoria
        session.history.push({ role: 'Usuario', text: prompt });
        session.history.push({ role: 'Asistente', text: text });

        // Mantener solo los últimos 10 mensajes para no saturar tokens
        if (session.history.length > 20) {
            session.history = session.history.slice(-10);
        }

        // 8. Respuesta Final JSON
        return res.status(200).json({
            response: text,
            sessionId: sessionId,
            contextSize: session.history.length / 2 // Pares de mensajes
        });

    } catch (error) {
        console.error("Error API:", error);
        return res.status(500).json({
            error: "Error interno del servidor",
            details: error.message
        });
    }
}
