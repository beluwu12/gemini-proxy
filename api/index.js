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
    const format = req.query.format || req.body?.format || 'text';

    if (!prompt) {
        return res.status(400).send("Falta el parámetro 'prompt'");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // System instruction: respuestas directas sin markdown
        const defaultSystem = "Responde de forma directa y concisa. NO uses formato markdown, NO uses asteriscos, NO uses listas con viñetas, NO uses numeración. Escribe solo texto plano normal como si fuera una conversación casual.";

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

        // Limpiar cualquier formato markdown residual
        text = text
            .replace(/\*\*/g, '')      // Quitar negritas
            .replace(/\*/g, '')        // Quitar cursivas
            .replace(/^#+\s/gm, '')    // Quitar headers
            .replace(/^[-•]\s/gm, '')  // Quitar viñetas
            .replace(/^\d+\.\s/gm, '') // Quitar listas numeradas
            .replace(/`/g, '')         // Quitar code inline
            .trim();

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ response: text });
        } else {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(200).send(text);
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(500).send("Error: " + (error.message || String(error)));
    }
}