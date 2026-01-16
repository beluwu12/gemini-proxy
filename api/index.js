const express = require('express');
const app = express();
const config = require('./src/config/config');
const aiRoutes = require('./src/routes/ai');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./public/swagger.json');

// Middleware
app.use(express.json());
app.use(require('cors')(config.cors));
app.use(require('helmet')());
app.use(require('compression')());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/ai', aiRoutes);
app.get('/health', (req, res) => res.json({ status: "healthy" }));

// Legacy support (to avoid breaking current bot)
app.use('/api', aiRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});

// Start if running directly
if (require.main === module) {
    app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
}

module.exports = app;