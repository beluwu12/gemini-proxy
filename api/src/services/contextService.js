// In-memory volatile storage for serverless environment
// Note: This will be reset when the lambda freezes/restarts
const sessions = new Map();

const contextService = {
    areSessionsEnabled: () => true,

    getContext: async (sessionId) => {
        if (!sessions.has(sessionId)) return [];
        const session = sessions.get(sessionId);
        // Refresh timestamp
        session.lastActive = Date.now();
        return session.history;
    },

    addMessage: async (sessionId, role, content) => {
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, { history: [], lastActive: Date.now() });
        }

        const session = sessions.get(sessionId);
        session.history.push({ role, content, timestamp: new Date().toISOString() });
        session.lastActive = Date.now();

        // Keep only last 20 messages
        if (session.history.length > 20) {
            session.history = session.history.slice(-20);
        }
    },

    formatContextForGemini: async (sessionId) => {
        const history = await contextService.getContext(sessionId);
        if (!history.length) return "";

        return history.map(msg => {
            const roleName = msg.role === 'user' ? 'Usuario' : 'Asistente';
            return `${roleName}: ${msg.content}\n`;
        }).join("") + "\n";
    },

    clearContext: async (sessionId) => {
        sessions.delete(sessionId);
        return true;
    }
};

// Simple cleanup for stale sessions
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActive > 30 * 60 * 1000) { // 30 mins timeout
            sessions.delete(id);
        }
    }
}, 60 * 1000);

module.exports = contextService;
