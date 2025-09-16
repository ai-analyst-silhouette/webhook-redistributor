const express = require('express');
const router = express.Router();
const { query } = require('../database/postgres');
const { logEndpointUsage, logEndpointResponse, getDetailedEndpointStats } = require('../middleware/endpointLogger');
const logs = require('../database/logs');
const messages = require('../config/messages');
const { toBrazilianTime } = require('../utils/timezone');

// POST /api/webhook - Receive webhook payload (default redirecionamento)
router.post('/', logEndpointUsage, logEndpointResponse, async (req, res) => {
  let logStatus = 'success';
  let errorMessage = null;
  let redistributionResults = [];

  try {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV !== 'production') {
      console.log('=== WEBHOOK RECEIVED (DEFAULT REDIRECIONAMENTO) ===');
      console.log('Timestamp:', toBrazilianTime());
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Query params:', req.query);
      console.log('==========================================');
    }

    try {
      // Route to default redirecionamento
      const result = await routeToDefaultRedirecionamento(req.body, req.headers, req.query);
      
      if (result.success) {
        redistributionResults = result.redistribution.results;
      } else {
        logStatus = 'error';
        errorMessage = result.message;
        redistributionResults = [];
      }
    } catch (redistributionError) {
      console.error('Erro durante redistribuição do webhook:', redistributionError);
      logStatus = 'error';
      errorMessage = redistributionError.message;
    }

    const response = {
      success: true,
      message: messages.SUCCESS.WEBHOOK_RECEIVED,
      timestamp: toBrazilianTime(),
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
      console.error('Erro ao registrar webhook:', logError);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log(`Redistribution: ${response.redistribution.successful}/${response.redistribution.attempted} successful`);
    console.log('===================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    logStatus = 'error';
    errorMessage = error.message;
    
    try {
      await logs.createWebhookLog(req.body, logStatus, 0, errorMessage);
    } catch (logError) {
      console.error('Erro ao registrar falha no processamento do webhook:', logError);
    }
    
    res.status(500).json({ success: false, message: messages.ERROR.WEBHOOK_PROCESSING_ERROR, error: error.message });
  }
});

// POST /api/webhook/:slug - Receive webhook payload for specific redirecionamento
router.post('/:slug', logEndpointUsage, logEndpointResponse, async (req, res) => {
  const { slug } = req.params;
  let logStatus = 'success';
  let errorMessage = null;
  let redistributionResults = [];

  try {
    console.log(`=== WEBHOOK RECEIVED (REDIRECIONAMENTO: ${slug}) ===`);
    console.log('Timestamp:', toBrazilianTime());
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', req.query);
    console.log('==========================================');

    try {
      // Route to specific redirecionamento
      const result = await routeToRedirecionamento(slug, req.body, req.headers, req.query);
      
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
      console.error('Erro durante redistribuição do webhook:', redistributionError);
      logStatus = 'error';
      errorMessage = redistributionError.message;
    }

    const response = {
      success: true,
      message: messages.SUCCESS.WEBHOOK_RECEIVED,
      timestamp: toBrazilianTime(),
      redirecionamento: {
        slug: slug,
        nome: 'Redirecionamento Personalizado'
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
      console.error('Erro ao registrar webhook:', logError);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log(`Redistribution: ${response.redistribution.successful}/${response.redistribution.attempted} successful`);
    console.log('===================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    logStatus = 'error';
    errorMessage = error.message;
    
    try {
      await logs.createWebhookLog(req.body, logStatus, 0, errorMessage);
    } catch (logError) {
      console.error('Erro ao registrar falha no processamento do webhook:', logError);
    }
    
    res.status(500).json({ success: false, message: messages.ERROR.WEBHOOK_PROCESSING_ERROR, error: error.message });
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
      timestamp: toBrazilianTime(),
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
      timestamp: toBrazilianTime(),
      status: 'not_found'
    });
  }
});

// Route to default redirecionamento
async function routeToDefaultRedirecionamento(payload, headers, query) {
  try {
    // Get default redirecionamento
    const result = await query('SELECT * FROM redirecionamentos WHERE slug = $1 AND ativo = true', ['default']);
    const redirecionamento = result.rows[0];

    if (!redirecionamento) {
      return {
        success: false,
        message: 'Redirecionamento padrão não encontrado',
        statusCode: 404
      };
    }

    // Buscar destinos ativos do redirecionamento
    const destinosResult = await query(
      'SELECT url FROM redirecionamento_destinos WHERE redirecionamento_id = $1 AND ativo = true ORDER BY ordem',
      [redirecionamento.id]
    );
    
    const urls = destinosResult.rows.map(row => row.url);
    
    if (urls.length === 0) {
      return {
        success: false,
        message: 'Redirecionamento padrão não possui destinos ativos configurados',
        statusCode: 400
      };
    }

    console.log(`=== ROUTING WEBHOOK TO REDIRECIONAMENTO: ${redirecionamento.slug} ===`);
    console.log('Timestamp:', toBrazilianTime());
    console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
    console.log('==========================================');
    console.log(`✅ Redirecionamento encontrado: ${redirecionamento.nome} (${redirecionamento.slug})`);
    console.log(`Descrição: ${redirecionamento.descricao}`);
    console.log(`Encontradas ${urls.length} URL(s) ativa(s) para redirecionamento '${redirecionamento.slug}':`);
    urls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    // Redistribute to all URLs
    const results = await redistributeToUrls(urls, payload, headers, redirecionamento.slug);
    
    return {
      success: true,
      redistribution: {
        attempted: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    };
  } catch (error) {
    console.error('Erro ao rotear para redirecionamento padrão:', error);
    return {
      success: false,
      message: 'Erro interno ao processar redirecionamento padrão',
      error: error.message,
      statusCode: 500
    };
  }
}

// Route to specific redirecionamento
async function routeToRedirecionamento(slug, payload, headers, query) {
  try {
    // Get redirecionamento by slug
    const result = await query('SELECT * FROM redirecionamentos WHERE slug = $1 AND ativo = true', [slug]);
    const redirecionamento = result.rows[0];

    if (!redirecionamento) {
      return {
        success: false,
        message: `Redirecionamento '${slug}' não encontrado`,
        statusCode: 404
      };
    }

    // Buscar destinos ativos do redirecionamento
    const destinosResult = await query(
      'SELECT url FROM redirecionamento_destinos WHERE redirecionamento_id = $1 AND ativo = true ORDER BY ordem',
      [redirecionamento.id]
    );
    
    const urls = destinosResult.rows.map(row => row.url);
    
    if (urls.length === 0) {
      return {
        success: false,
        message: `Redirecionamento '${slug}' não possui destinos ativos configurados`,
        statusCode: 400
      };
    }

    console.log(`=== ROUTING WEBHOOK TO REDIRECIONAMENTO: ${redirecionamento.slug} ===`);
    console.log('Timestamp:', toBrazilianTime());
    console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
    console.log('==========================================');
    console.log(`✅ Redirecionamento encontrado: ${redirecionamento.nome} (${redirecionamento.slug})`);
    console.log(`Descrição: ${redirecionamento.descricao}`);
    console.log(`Encontradas ${urls.length} URL(s) ativa(s) para redirecionamento '${redirecionamento.slug}':`);
    urls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    // Redistribute to all URLs
    const results = await redistributeToUrls(urls, payload, headers, redirecionamento.slug);
    
    return {
      success: true,
      redistribution: {
        attempted: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    };
  } catch (error) {
    console.error(`Erro ao rotear para redirecionamento '${slug}':`, error);
    return {
      success: false,
      message: 'Erro interno ao processar redirecionamento',
      error: error.message,
      statusCode: 500
    };
  }
}

// Redistribute webhook to multiple URLs
async function redistributeToUrls(urls, payload, headers, redirecionamentoSlug) {
  const axios = require('axios');
  const results = [];
  
  console.log('=== STARTING WEBHOOK REDISTRIBUTION ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log(`Redirecionamento ID: ${redirecionamentoSlug}`);
  console.log(`Encontradas ${urls.length} URL(s) ativa(s) para redirecionamento ${redirecionamentoSlug}:`);
  urls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const startTime = Date.now();
    
    console.log(`--- Enviando para ${url} ---`);
    console.log(`📤 Enviando payload para ${url}:`);
    console.log(`   URL: ${url}`);
    console.log(`   Headers: {`);
    console.log(`  'Content-Type': 'application/json',`);
    console.log(`  'User-Agent': 'Webhook-Redistributor/1.0',`);
    console.log(`  'X-Redistributed-At': '${new Date().toISOString()}',`);
    console.log(`  'X-Redistributed-From': 'webhook-redistributor'`);
    console.log(`}`);
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhook-Redistributor/1.0',
          'X-Redistributed-At': toBrazilianTime(),
          'X-Redistributed-From': 'webhook-redistributor'
        },
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;
      const result = {
        url,
        success: true,
        status: response.status,
        responseTime,
        responseData: response.data,
        timestamp: new Date().toISOString()
      };

      results.push(result);
      
      console.log(`✅ SUCCESS: ${url}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Response size: ${JSON.stringify(response.data).length} bytes`);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result = {
        url,
        success: false,
        error: error.message,
        responseTime,
        status: error.response?.status || 0,
        timestamp: new Date().toISOString()
      };

      results.push(result);
      
      console.log(`❌ FAILED: ${url}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Status: ${error.response?.status || 0}`);
    }
  }

  console.log('=== REDISTRIBUTION SUMMARY ===');
  console.log(`Total URLs: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log('===============================================');

  return results;
}

module.exports = router;
