const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// CORS - permitir múltiplas origens
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8888',
  'https://gorilapod.netlify.app',
  'https://gorilapod.com.br',
  'https://www.gorilapod.com.br',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como apps mobile ou curl)
    if (!origin) return callback(null, true);
    // Verificar se a origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Em desenvolvimento, permitir qualquer localhost
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    console.warn('⚠️ Origem bloqueada por CORS:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rotas
const pixRoutes = require('./routes/pix');
const pedidosRoutes = require('./routes/pedidos');
const usuariosRoutes = require('./routes/usuarios');

// Usar rotas
app.use('/api/pix', pixRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend PIX rodando',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Pagamentos PIX - POD EXPRESSS',
    endpoints: {
      health: '/health',
      createCharge: 'POST /api/pix/create-charge',
      checkStatus: 'GET /api/pix/status/:txid',
      webhook: 'POST /api/pix/webhook'
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀 ====================================');
  console.log(`🚀 Backend PIX rodando na porta ${PORT}`);
  console.log(`🚀 Ambiente: ${process.env.EFI_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUÇÃO'}`);
  console.log('🚀 ====================================');
});

module.exports = app;
