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
    const format = req.query.format || req.body?.format || 'text'; // 'text' o 'json'

    if (!prompt) {
        return res.status(400).send("Falta el parámetro 'prompt'");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

        const text = response.text || "";

        // Devolver texto plano por defecto, JSON si se pide explícitamente
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