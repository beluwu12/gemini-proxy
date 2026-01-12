export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const prompt = req.query.prompt || req.body?.prompt;
    const system = req.query.system || req.body?.system;

    if (!prompt) return res.status(400).send("Falta el prompt");

    const MODEL_ID = "gemini-3-flash-preview";
    const API_KEY = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
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
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
        const cleanText = text.replace(/\*\*/g, "").replace(/`/g, "").trim();

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(cleanText);

    } catch (error) {
        return res.status(500).send("Error interno: " + error.message);
    }
}