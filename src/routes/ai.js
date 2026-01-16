const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

router.get('/', async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const sessionId = req.query.sessionId;

        if (!prompt) return res.status(400).json({ error: "Prompt requerido" });

        const result = await geminiService.generate(prompt, sessionId);

        // Clean markdown
        const cleanText = result.response
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`/g, '')
            .trim();

        res.json({
            response: cleanText,
            sessionId: result.sessionId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Support POST for longer prompts
router.post('/', async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt requerido" });

        const result = await geminiService.generate(prompt, sessionId);
        // Clean markdown
        const cleanText = result.response
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`/g, '')
            .trim();

        res.json({
            response: cleanText,
            sessionId: result.sessionId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
