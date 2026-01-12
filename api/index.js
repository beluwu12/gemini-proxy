export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const prompt = req.query.prompt || req.body?.prompt;
    const system = req.query.system || req.body?.system;

    if (!prompt) return res.status(400).json({ error: "Falta el prompt" });

    // --- CONFIGURACIÓN DE GEMINI 3 ---
    const MODEL_ID = "gemini-3-flash-preview";
    const API_KEY = process.env.GEMINI_API_KEY;
    // Forzamos el endpoint v1beta que es el que soporta los modelos más nuevos
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7
            }
        };

        if (system) {
            payload.systemInstruction = { parts: [{ text: system }] };
        }

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Si Google devuelve un error (ej: el modelo no existe o no tienes acceso)
        if (data.error) {
            return res.status(data.error.code || 500).json({
                error: "Error de Google API",
                detalle: data.error.message,
                model_attempted: MODEL_ID
            });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        res.status(200).json({
            response: text || "Sin respuesta",
            model_used: MODEL_ID // Aquí confirmamos qué modelo pedimos
        });
        // que rico la pinga no?
    } catch (error) {
        res.status(500).json({ error: "Error interno", detalle: error.message });
    }
}