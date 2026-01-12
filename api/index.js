export default async function handler(req, res) {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const prompt = req.query.prompt || req.body?.prompt;

    if (!prompt) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(400).send("Falta el parámetro 'prompt'");
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1024,
                        temperature: 0.7
                    }
                })
            }
        );

        if (!response.ok) {
            return res.status(response.status).send("Error de Gemini API");
        }

        const data = await response.json();
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";

        // Limpieza rápida: eliminamos los acentos graves (`) que causan cuadros grises en Discord
        const cleanText = text.replace(/`/g, "").trim();

        // Enviamos SOLO el texto, no un objeto JSON
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(cleanText);

    } catch (error) {
        res.status(500).send("Error interno: " + error.message);
    }
}