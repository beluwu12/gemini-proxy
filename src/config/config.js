require('dotenv').config();

const express = require('express');
const app = express();
const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'production',
    geminiKey: process.env.GEMINI_API_KEY,
    geminiModel: "gemini-3-flash-preview",
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
    },
    cors: {
        origin: '*',
        methods: 'GET,POST,OPTIONS',
        allowedHeaders: 'Content-Type,Authorization'
    },
    context: {
        enableSessions: true,
        maxMessages: 20
    }
};

module.exports = config;
