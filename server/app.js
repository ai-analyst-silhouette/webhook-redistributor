/**
 * Webhook Redistributor - Main Server Application
 * 
 * This is the main Express.js server that handles:
 * - Webhook reception and redistribution
 * - Destination management (CRUD operations)
 * - Logging and monitoring
 * - CORS and middleware configuration
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('/app/database/init-postgres');
const { toBrazilianTime } = require('./utils/timezone');

// Import API routes
const authRoutes = require('./routes/auth-postgres');     // Authentication routes
const webhookRoutes = require('./routes/webhook');        // Webhook reception and redistribution
const redirecionamentosRoutes = require('./routes/redirecionamentos-normalized'); // Redirecionamentos CRUD operations (normalized)
const usuariosRoutes = require('./routes/usuarios');      // User management
const logsRoutes = require('./routes/logs');              // Logs and statistics
const exportRoutes = require('./routes/export');          // Export/import configuration

// Import authentication middleware
const { authenticateToken, apiRateLimiter } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001; // Default to port 3001, but can be overridden by environment

// Trust proxy for rate limiting behind reverse proxy (Traefik)
// Configure trust proxy to handle X-Forwarded-For headers properly
// Use specific proxy count instead of true for better security
app.set('trust proxy', 1);

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://redistribuidor-front.silhouetteexperts.com.br',
        process.env.BACKEND_URL || 'https://redistribuidor-back.silhouetteexperts.com.br'
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log todas as requisições para debug (controlado por LOG_LEVEL)
app.use((req, res, next) => {
  if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV !== 'production') {
    console.log(`📝 REQUEST: ${req.method} ${req.path}`);
    console.log(`📝 Headers:`, req.headers);
  }
  next();
});

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor de Redistribuição de Webhook está rodando',
    status: 'OK',
    port: PORT
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'saudável',
    timestamp: toBrazilianTime()
  });
});

// Register routes
app.use('/api/autenticacao', authRoutes);                    // Authentication routes (no auth required)
app.use('/api/webhook', webhookRoutes);                      // Webhook reception (no auth required for webhook reception)
app.use('/api/redirecionamentos', authenticateToken, redirecionamentosRoutes); // Redirecionamentos CRUD operations (auth required)
app.use('/api/usuarios', authenticateToken, usuariosRoutes); // User management (auth required)
app.use('/api/logs-webhook', authenticateToken, logsRoutes);          // Logs and statistics (auth required)
app.use('/api/exportar', authenticateToken, exportRoutes);            // Export/import configuration (auth required)

// Temporary routes for frontend compatibility
app.get('/api/endpoints', authenticateToken, (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/destinations', authenticateToken, (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/destinations', authenticateToken, (req, res) => {
  res.json({ success: true, data: { id: 1, message: 'Destination created' } });
});

app.post('/api/endpoints', authenticateToken, (req, res) => {
  res.json({ success: true, data: { id: 1, message: 'Endpoint created' } });
});

app.put('/api/endpoints/:id', authenticateToken, (req, res) => {
  res.json({ success: true, data: { id: req.params.id, message: 'Endpoint updated' } });
});

app.delete('/api/endpoints/:id', authenticateToken, (req, res) => {
  res.json({ success: true, data: { id: req.params.id, message: 'Endpoint deleted' } });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      
      // Show appropriate health check URL based on environment
      const healthUrl = process.env.NODE_ENV === 'production' 
        ? 'https://redistribuidor-back.silhouetteexperts.com.br/health'
        : `http://localhost:${PORT}/health`;
      
      console.log(`Verificação de saúde disponível em ${healthUrl}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
