const express = require('express');
const router = express.Router();
const { redistributeWebhook } = require('../services/redistributor');
const { routeWebhook, routeToDefaultEndpoint } = require('../services/endpointRouter');
const { logEndpointUsage, logEndpointResponse, getDetailedEndpointStats } = require('../middleware/endpointLogger');
const logs = require('../database/logs');

// POST /api/webhook - Receive webhook payload (default endpoint)
router.post('/', logEndpointUsage, logEndpointResponse, async (req, res) => {
  let logStatus = 'success';
  let errorMessage = null;
  let redistributionResults = [];

  try {
    console.log('=== WEBHOOK RECEIVED (DEFAULT ENDPOINT) ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', req.query);
    console.log('==========================================');

    try {
      // Route to default endpoint
      const result = await routeToDefaultEndpoint(req.body, req.headers, req.query);
      
      if (result.success) {
        redistributionResults = result.redistribution.results;
      } else {
        logStatus = 'error';
        errorMessage = result.message;
        redistributionResults = [];
      }
    } catch (redistributionError) {
      console.error('Error during webhook redistribution:', redistributionError);
      logStatus = 'error';
      errorMessage = redistributionError.message;
    }

    const response = {
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: { headers: req.headers, body: req.body, query: req.query },
      redistribution: {
        attempted: redistributionResults.length,
        successful: redistributionResults.filter(r => r.success).length,
        failed: redistributionResults.filter(r => !r.success).length,
        results: redistributionResults
      }
    };

    // Log the webhook to database
    try {
      await logs.createWebhookLog(
        req.body,
        logStatus,
        redistributionResults.length,
        errorMessage
      );
    } catch (logError) {
      console.error('Error logging webhook:', logError);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log(`Redistribution: ${response.redistribution.successful}/${response.redistribution.attempted} successful`);
    console.log('===================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing webhook:', error);
    logStatus = 'error';
    errorMessage = error.message;
    
    try {
      await logs.createWebhookLog(req.body, logStatus, 0, errorMessage);
    } catch (logError) {
      console.error('Error logging webhook processing failure:', logError);
    }
    
    res.status(500).json({ success: false, message: 'Error processing webhook', error: error.message });
  }
});

// POST /api/webhook/:slug - Receive webhook payload for specific endpoint
router.post('/:slug', logEndpointUsage, logEndpointResponse, async (req, res) => {
  const { slug } = req.params;
  let logStatus = 'success';
  let errorMessage = null;
  let redistributionResults = [];

  try {
    console.log(`=== WEBHOOK RECEIVED (ENDPOINT: ${slug}) ===`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', req.query);
    console.log('==========================================');

    try {
      // Route to specific endpoint
      const result = await routeWebhook(slug, req.body, req.headers, req.query);
      
      if (result.success) {
        redistributionResults = result.redistribution.results;
      } else {
        logStatus = 'error';
        errorMessage = result.message;
        redistributionResults = [];
        
        // Return appropriate error status
        return res.status(result.statusCode || 500).json({
          success: false,
          message: result.message,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (redistributionError) {
      console.error('Error during webhook redistribution:', redistributionError);
      logStatus = 'error';
      errorMessage = redistributionError.message;
    }

    const response = {
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      endpoint: {
        slug: slug,
        name: 'Custom Endpoint'
      },
      receivedData: { headers: req.headers, body: req.body, query: req.query },
      redistribution: {
        attempted: redistributionResults.length,
        successful: redistributionResults.filter(r => r.success).length,
        failed: redistributionResults.filter(r => !r.success).length,
        results: redistributionResults
      }
    };

    // Log the webhook to database
    try {
      await logs.createWebhookLog(
        req.body,
        logStatus,
        redistributionResults.length,
        errorMessage
      );
    } catch (logError) {
      console.error('Error logging webhook:', logError);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log(`Redistribution: ${response.redistribution.successful}/${response.redistribution.attempted} successful`);
    console.log('===================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing webhook:', error);
    logStatus = 'error';
    errorMessage = error.message;
    
    try {
      await logs.createWebhookLog(req.body, logStatus, 0, errorMessage);
    } catch (logError) {
      console.error('Error logging webhook processing failure:', logError);
    }
    
    res.status(500).json({ success: false, message: 'Error processing webhook', error: error.message });
  }
});

// GET /api/webhook - Health check for webhook endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Webhook endpoint is ready',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
});

// GET /api/webhook/stats - Get endpoint usage statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getDetailedEndpointStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting endpoint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting endpoint statistics',
      error: error.message
    });
  }
});

// GET /api/webhook/:slug - Health check for specific endpoint
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  
  try {
    const models = require('../database/models');
    const endpoint = await models.getEndpointBySlug(slug);
    
    res.json({
      message: `Webhook endpoint '${slug}' is ready`,
      timestamp: new Date().toISOString(),
      status: 'active',
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: endpoint.active
      }
    });
  } catch (error) {
    res.status(404).json({
      message: `Webhook endpoint '${slug}' not found`,
      timestamp: new Date().toISOString(),
      status: 'not_found'
    });
  }
});

module.exports = router;
