export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Obtener parámetros (GET y POST)
    const prompt = req.query.prompt || req.body?.prompt;
    const systemInstruction = req.query.system || req.body?.system;

    if (!prompt) {
        return res.status(400).json({
            error: "Falta el parámetro 'prompt'",
            uso: "?prompt=tu pregunta"
        });
    }

    // Construir payload siguiendo mejores prácticas de Gemini 3:
    // - Instrucciones precisas y concisas
    // - El modelo es menos verboso por defecto
    // - Contexto primero, instrucciones al final
    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.95
        }
    };

    // System instruction opcional para personalizar comportamiento
    if (systemInstruction) {
        payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: "Error de Gemini API",
                detalle: errorData.error?.message || "Desconocido"
            });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            res.status(200).json({ response: text });
        } else {
            res.status(500).json({ error: "Respuesta vacía de Gemini" });
        }

    } catch (error) {
        res.status(500).json({
            error: "Error interno",
            mensaje: error.message
        });
    }
}
