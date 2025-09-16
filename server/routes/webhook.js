const express = require('express');
const router = express.Router();
const { query } = require('../database/postgres');
const messages = require('../config/messages');
const { toBrazilianTime } = require('../utils/timezone');

// POST /api/webhook - Receive webhook payload (default redirecionamento)
router.post('/', async (req, res) => {
  let redistributionResults = [];
  const startTime = Date.now();
  let logId = null;

  try {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV !== 'production') {
      console.log('=== WEBHOOK RECEIVED (DEFAULT REDIRECIONAMENTO) ===');
      console.log('Timestamp:', toBrazilianTime());
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Query params:', req.query);
      console.log('==========================================');
    }

    // Log webhook reception
    const logResult = await query(`
      INSERT INTO logs_webhook (payload, status, destinos_enviados, slug_redirecionamento, tempo_resposta, ip_origem, user_agent, headers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      JSON.stringify(req.body),
      0, // Will be updated after processing
      0, // Will be updated after processing
      'default',
      0, // Will be updated after processing
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      JSON.stringify(req.headers)
    ]);
    
    logId = logResult.rows[0].id;

    try {
      // Route to default redirecionamento
      const result = await routeToDefaultRedirecionamento(req.body, req.headers, req.query);
      
      if (result.success) {
        redistributionResults = result.redistribution.results;
      } else {
        redistributionResults = [];
      }
    } catch (redistributionError) {
      console.error('Erro durante redistribuição do webhook:', redistributionError);
    }

    const responseTime = Date.now() - startTime;
    const successful = redistributionResults.filter(r => r.success).length;
    const failed = redistributionResults.filter(r => !r.success).length;
    const status = failed === 0 ? 200 : (successful > 0 ? 207 : 500); // 207 = Multi-Status

    // Update log with final results
    await query(`
      UPDATE logs_webhook 
      SET status = $1, destinos_enviados = $2, tempo_resposta = $3, mensagem_erro = $4
      WHERE id = $5
    `, [
      status,
      redistributionResults.length,
      responseTime,
      failed > 0 ? `${failed} destinos falharam` : null,
      logId
    ]);

    const response = {
      success: true,
      message: messages.SUCCESS.WEBHOOK_RECEIVED,
      timestamp: toBrazilianTime(),
      receivedData: { headers: req.headers, body: req.body, query: req.query },
      redistribution: {
        attempted: redistributionResults.length,
        successful: successful,
        failed: failed,
        results: redistributionResults
      }
    };

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log(`Redistribution: ${response.redistribution.successful}/${response.redistribution.attempted} successful`);
    console.log('===================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    // Update log with error
    if (logId) {
      await query(`
        UPDATE logs_webhook 
        SET status = $1, tempo_resposta = $2, mensagem_erro = $3
        WHERE id = $4
      `, [500, Date.now() - startTime, error.message, logId]);
    }
    
    res.status(500).json({ success: false, message: messages.ERROR.WEBHOOK_PROCESSING_ERROR, error: error.message });
  }
});

// POST /api/webhook/:slug - Receive webhook payload for specific redirecionamento
router.post('/:slug', async (req, res) => {
  const { slug } = req.params;
  let redistributionResults = [];
  const startTime = Date.now();
  let logId = null;

  try {
    console.log(`=== WEBHOOK RECEIVED (REDIRECIONAMENTO: ${slug}) ===`);
    console.log('Timestamp:', toBrazilianTime());
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', req.query);
    console.log('==========================================');

    // First check if redirecionamento exists before creating log
    const redirecionamentoCheck = await query('SELECT id FROM redirecionamentos WHERE slug = $1 AND ativo = true', [slug]);
    
    if (redirecionamentoCheck.rows.length === 0) {
      console.log(`❌ Redirecionamento '${slug}' não encontrado ou inativo`);
      return res.status(404).json({
        success: false,
        message: `Redirecionamento '${slug}' não encontrado`,
        error: 'Redirecionamento não existe ou está inativo',
        timestamp: toBrazilianTime()
      });
    }

    // Log webhook reception only if redirecionamento exists
    const logResult = await query(`
      INSERT INTO logs_webhook (payload, status, destinos_enviados, slug_redirecionamento, tempo_resposta, ip_origem, user_agent, headers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      JSON.stringify(req.body),
      0, // Will be updated after processing
      0, // Will be updated after processing
      slug,
      0, // Will be updated after processing
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      JSON.stringify(req.headers)
    ]);
    
    logId = logResult.rows[0].id;

    try {
      // Route to specific redirecionamento
      const result = await routeToRedirecionamento(slug, req.body, req.headers, req.query);
      
      if (result.success) {
        redistributionResults = result.redistribution.results;
      } else {
        redistributionResults = [];
        
        // Update log with error and return appropriate error status
        await query(`
          UPDATE logs_webhook 
          SET status = $1, tempo_resposta = $2, mensagem_erro = $3
          WHERE id = $4
        `, [result.statusCode || 500, Date.now() - startTime, result.message, logId]);
        
        return res.status(result.statusCode || 500).json({
          success: false,
          message: result.message,
          error: result.error,
          timestamp: toBrazilianTime()
        });
      }
    } catch (redistributionError) {
      console.error('Erro durante redistribuição do webhook:', redistributionError);
    }

    const responseTime = Date.now() - startTime;
    const successful = redistributionResults.filter(r => r.success).length;
    const failed = redistributionResults.filter(r => !r.success).length;
    const status = failed === 0 ? 200 : (successful > 0 ? 207 : 500); // 207 = Multi-Status

    // Update log with final results
    await query(`
      UPDATE logs_webhook 
      SET status = $1, destinos_enviados = $2, tempo_resposta = $3, mensagem_erro = $4
      WHERE id = $5
    `, [
      status,
      redistributionResults.length,
      responseTime,
      failed > 0 ? `${failed} destinos falharam` : null,
      logId
    ]);

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
        successful: successful,
        failed: failed,
        results: redistributionResults
      }
    };

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log(`Redistribution: ${response.redistribution.successful}/${response.redistribution.attempted} successful`);
    console.log('===================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    // Update log with error
    if (logId) {
      await query(`
        UPDATE logs_webhook 
        SET status = $1, tempo_resposta = $2, mensagem_erro = $3
        WHERE id = $4
      `, [500, Date.now() - startTime, error.message, logId]);
    }
    
    res.status(500).json({ success: false, message: messages.ERROR.WEBHOOK_PROCESSING_ERROR, error: error.message });
  }
});

// GET /api/webhook - Health check for webhook endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Webhook endpoint is ready',
    timestamp: toBrazilianTime(),
    status: 'active'
  });
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
async function routeToDefaultRedirecionamento(payload, headers, queryParams) {
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
async function routeToRedirecionamento(slug, payload, headers, queryParams) {
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
  console.log('Timestamp:', toBrazilianTime());
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
    console.log(`  'X-Redistributed-At': '${toBrazilianTime()}',`);
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
