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
const { initializeDatabase } = require('./database/init');

// Import API routes
const authRoutes = require('./routes/auth');              // Authentication routes
const webhookRoutes = require('./routes/webhook');        // Webhook reception and redistribution
const redirecionamentosRoutes = require('./routes/redirecionamentos'); // Redirecionamentos CRUD operations
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    timestamp: new Date().toISOString()
  });
});

// Register routes
app.use('/api/autenticacao', authRoutes);                    // Authentication routes (no auth required)
app.use('/api/webhook', webhookRoutes);                      // Webhook reception (no auth required for webhook reception)
app.use('/api/redirecionamentos', authenticateToken, redirecionamentosRoutes); // Redirecionamentos CRUD operations (auth required)
app.use('/api/logs-webhook', authenticateToken, logsRoutes);          // Logs and statistics (auth required)
app.use('/api/exportar', authenticateToken, exportRoutes);            // Export/import configuration (auth required)

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
