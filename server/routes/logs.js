const express = require('express');
const router = express.Router();
const logs = require('../database/logs');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// GET /api/logs - Get recent webhook logs
router.get('/', authenticateToken, requirePermission('visualizar_logs'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const webhookLogs = await logs.getRecentWebhookLogs(limit);
    
    res.status(200).json({
      success: true,
      data: webhookLogs,
      count: webhookLogs.length,
      limit
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook logs',
      error: error.message
    });
  }
});

// GET /api/logs/stats - Get webhook statistics
router.get('/stats', authenticateToken, requirePermission('visualizar_estatisticas'), async (req, res) => {
  try {
    const stats = await logs.getWebhookStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching webhook stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook statistics',
      error: error.message
    });
  }
});

// GET /api/logs/range - Get webhook logs by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }
    
    const webhookLogs = await logs.getWebhookLogsByDateRange(startDate, endDate, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: webhookLogs,
      count: webhookLogs.length,
      startDate,
      endDate,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching webhook logs by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook logs by date range',
      error: error.message
    });
  }
});

// GET /api/logs/:id - Get specific webhook log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // This would require adding a getWebhookLogById function to logs.js
    // For now, we'll return a 404
    res.status(404).json({
      success: false,
      message: 'Individual log retrieval not implemented yet'
    });
  } catch (error) {
    console.error('Error fetching webhook log by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook log',
      error: error.message
    });
  }
});

// GET /api/logs/stats/by-endpoint - Get statistics grouped by endpoint
router.get('/stats/by-endpoint', async (req, res) => {
  try {
    const { range = '24h', endpoint } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (range) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await logs.getWebhookStatsByEndpoint(startDate, endpoint);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching webhook stats by endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook statistics by endpoint',
      error: error.message
    });
  }
});

// GET /api/logs/endpoint/:slug - Get logs for specific endpoint
router.get('/endpoint/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    
    const webhookLogs = await logs.getWebhookLogsByEndpoint(slug, limit, status);
    
    res.status(200).json({
      success: true,
      data: webhookLogs,
      count: webhookLogs.length,
      limit,
      endpoint: slug
    });
  } catch (error) {
    console.error('Error fetching webhook logs by endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook logs for endpoint',
      error: error.message
    });
  }
});

module.exports = router;
