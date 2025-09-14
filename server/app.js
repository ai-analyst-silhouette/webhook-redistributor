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
const webhookRoutes = require('./routes/webhook');        // Webhook reception and redistribution
const destinationRoutes = require('./routes/destinations'); // Destination CRUD operations
const endpointRoutes = require('./routes/endpoints');      // Endpoint CRUD operations
const logsRoutes = require('./routes/logs');              // Logs and statistics
const exportRoutes = require('./routes/export');          // Export/import configuration

const app = express();
const PORT = process.env.PORT || 3001; // Default to port 3001, but can be overridden by environment

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Webhook Redistribution Server is running',
    status: 'OK',
    port: PORT
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Register routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/export', exportRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
