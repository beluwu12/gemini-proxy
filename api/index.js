import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const prompt = req.query.prompt || req.body?.prompt;
    const system = req.query.system || req.body?.system;

    // Por defecto JSON para compatibilidad con el snippet que sugeriste
    const format = req.query.format || req.body?.format || 'json';

    if (!prompt) {
        return res.status(400).json({ error: "Falta el parámetro 'prompt'" });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // System instruction: respuestas directas sin markdown
        const defaultSystem = "Responde de forma directa y concisa. NO uses formato markdown. NO uses bloques de código. NO uses negritas. Escribe texto plano limpio.";

        const config = {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.95,
            systemInstruction: system || defaultSystem
        };

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config
        });

        let text = response.text || "";

        // Limpieza agresiva de markdown para evitar romper el script del cliente
        text = text
            .replace(/```/g, '')       // Quitar code blocks
            .replace(/\*\*/g, '')      // Quitar negritas
            .replace(/\*/g, '')        // Quitar cursivas
            .replace(/^#+\s/gm, '')    // Quitar headers
            .replace(/`/g, '')         // Quitar code inline
            .trim();

        if (format === 'text') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(200).send(text);
        } else {
            // Default: JSON { response: "texto" }
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ response: text });
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({
            error: "Error de Gemini API",
            detalle: error.message || String(error)
        });
    }
}