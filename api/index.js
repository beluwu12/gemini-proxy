import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    if (!prompt) {
        return res.status(400).json({
            error: "Falta el parámetro 'prompt'",
            uso: "?prompt=tu pregunta"
        });
    }

    try {
        const config = {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.95
        };

        if (system) {
            config.systemInstruction = system;
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config
        });

        const text = response.text;

        if (text) {
            res.status(200).json({ response: text });
        } else {
            res.status(500).json({ error: "Respuesta vacía de Gemini" });
        }

    } catch (error) {
        res.status(500).json({
            error: "Error de Gemini API",
            detalle: error.message
        });
    }
}
