import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const prompt = req.query.prompt || req.body?.prompt;
    const system = req.query.system || req.body?.system;

    if (!prompt) return res.status(400).json({ error: "Falta el prompt" });

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Forzamos la estructura de contenido que espera el SDK de Gemini 2.0/3.0
        const contents = [{
            role: "user",
            parts: [{ text: prompt }]
        }];

        const config = {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.95
        };

        if (system) {
            config.systemInstruction = {
                parts: [{ text: system }]
            };
        }

        const response = await ai.models.generateContent({
            // ASEGÚRATE DE QUE ESTE ID SEA EL CORRECTO PARA G3
            model: "gemini-3-flash-preview",
            contents: contents,
            config: config
        });

        // El objeto 'response' en el nuevo SDK contiene metadatos.
        // Vamos a extraer el texto y, opcionalmente, verificar el modelo.
        const text = response.text;

        if (text) {
            res.status(200).json({
                response: text,
                // Esto te servirá para debuguear dentro del bot:
                debug_model: response.model_version || "no-version-info"
            });
        } else {
            res.status(500).json({ error: "Respuesta vacía" });
        }

    } catch (error) {
        console.error("Error detallado:", error);
        res.status(500).json({
            error: "Error de Gemini API",
            detalle: error.message
        });
    }
}