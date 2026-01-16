const { GoogleGenAI } = require('@google/genai');
const config = require('../config/config');
const contextService = require('./contextService');

class GeminiService {
    constructor() {
        this.ai = new GoogleGenAI({ apiKey: config.geminiKey });
    }

    async generate(prompt, sessionId = null) {
        // Basic completion without chat history managed by SDK
        // But we manually append context if session exists

        let fullPrompt = prompt;
        let contextUsed = false;

        if (sessionId) {
            const context = await contextService.formatContextForGemini(sessionId);
            if (context) {
                fullPrompt = `Historial de conversación:\n${context}\nUsuario: ${prompt}`;
                contextUsed = true;
            }
            // Save user message
            await contextService.addMessage(sessionId, 'user', prompt);
        }

        const response = await this.ai.models.generateContent({
            model: config.geminiModel,
            contents: fullPrompt,
            config: {
                maxOutputTokens: 2048,
                temperature: 0.7
            }
        });

        const text = response.text || "";

        if (sessionId) {
            // Save assistant response
            await contextService.addMessage(sessionId, 'assistant', text);
        }

        return { response: text, sessionId, contextUsed };
    }
}

module.exports = new GeminiService();
