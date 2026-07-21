/**
 * Servidor Express local para APIs de PIX
 * CodexPay usa Netlify Functions, este servidor serve apenas como health check
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
    console.log(`📌 Rotas disponíveis:`);
    console.log(`   GET  /api/health    - Health check`);
});
