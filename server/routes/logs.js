const express = require('express');
const router = express.Router();
const { query } = require('../database/postgres');
const { toBrazilianTime } = require('../utils/timezone');

// GET /api/logs/webhook - Get webhook logs with pagination and filters
router.get('/webhook', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      slug_redirecionamento,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (status) {
      whereConditions.push(`status = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    if (slug_redirecionamento) {
      whereConditions.push(`slug_redirecionamento = $${paramCounter}`);
      queryParams.push(slug_redirecionamento);
      paramCounter++;
    }

    if (start_date) {
      whereConditions.push(`recebido_em >= $${paramCounter}`);
      queryParams.push(start_date);
      paramCounter++;
    }

    if (end_date) {
      whereConditions.push(`recebido_em <= $${paramCounter}`);
      queryParams.push(end_date);
      paramCounter++;
    }

    if (search) {
      whereConditions.push(`(
        payload::text ILIKE $${paramCounter} OR 
        mensagem_erro ILIKE $${paramCounter} OR 
        ip_origem ILIKE $${paramCounter} OR 
        user_agent ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM logs_webhook ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get logs with pagination
    const logsQuery = `
      SELECT 
        id,
        payload,
        recebido_em,
        status,
        destinos_enviados,
        mensagem_erro,
        slug_redirecionamento,
        tempo_resposta,
        ip_origem,
        user_agent,
        headers
      FROM logs_webhook 
      ${whereClause}
      ORDER BY recebido_em DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    queryParams.push(parseInt(limit));
    queryParams.push(offset);
    
    const logsResult = await query(logsQuery, queryParams);

    // Get status summary
    const summaryQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM logs_webhook 
      ${whereClause}
      GROUP BY status
      ORDER BY status
    `;
    
    const summaryResult = await query(summaryQuery, queryParams.slice(0, -2)); // Remove limit and offset params

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: summaryResult.rows
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/logs/audit - Get audit logs with pagination and filters
router.get('/audit', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      usuario_id,
      acao,
      recurso_tipo,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (usuario_id) {
      whereConditions.push(`usuario_id = $${paramCounter}`);
      queryParams.push(usuario_id);
      paramCounter++;
    }

    if (acao) {
      whereConditions.push(`acao = $${paramCounter}`);
      queryParams.push(acao);
      paramCounter++;
    }

    if (recurso_tipo) {
      whereConditions.push(`recurso_tipo = $${paramCounter}`);
      queryParams.push(recurso_tipo);
      paramCounter++;
    }

    if (start_date) {
      whereConditions.push(`timestamp >= $${paramCounter}`);
      queryParams.push(start_date);
      paramCounter++;
    }

    if (end_date) {
      whereConditions.push(`timestamp <= $${paramCounter}`);
      queryParams.push(end_date);
      paramCounter++;
    }

    if (search) {
      whereConditions.push(`(
        descricao ILIKE $${paramCounter} OR 
        ip ILIKE $${paramCounter} OR 
        user_agent ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM audit_log ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get logs with pagination
    const logsQuery = `
      SELECT 
        id,
        usuario_id,
        acao,
        descricao,
        recurso_tipo,
        recurso_id,
        ip,
        user_agent,
        timestamp,
        dados_anteriores,
        dados_novos
      FROM audit_log 
      ${whereClause}
      ORDER BY timestamp DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    queryParams.push(parseInt(limit));
    queryParams.push(offset);
    
    const logsResult = await query(logsQuery, queryParams);

    // Get action summary
    const summaryQuery = `
      SELECT 
        acao,
        COUNT(*) as count
      FROM audit_log 
      ${whereClause}
      GROUP BY acao
      ORDER BY acao
    `;
    
    const summaryResult = await query(summaryQuery, queryParams.slice(0, -2)); // Remove limit and offset params

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: summaryResult.rows
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/logs/stats - Get general statistics
router.get('/stats', async (req, res) => {
  try {
    // Webhook logs stats
    const webhookStatsQuery = `
      SELECT 
        COUNT(*) as total_webhooks,
        COUNT(CASE WHEN status = 200 THEN 1 END) as successful_webhooks,
        COUNT(CASE WHEN status >= 400 THEN 1 END) as failed_webhooks,
        COUNT(CASE WHEN recebido_em >= CURRENT_DATE THEN 1 END) as today_webhooks,
        COALESCE(AVG(tempo_resposta), 0) as avg_response_time
      FROM logs_webhook
    `;

    // Audit logs stats
    const auditStatsQuery = `
      SELECT 
        COUNT(*) as total_audits,
        COUNT(CASE WHEN timestamp >= CURRENT_DATE THEN 1 END) as today_audits,
        COUNT(DISTINCT usuario_id) as unique_users
      FROM audit_log
    `;

    const [webhookStats, auditStats] = await Promise.all([
      query(webhookStatsQuery),
      query(auditStatsQuery)
    ]);

    // Process webhook stats to ensure numbers are returned
    const webhookData = webhookStats.rows[0];
    const processedWebhookStats = {
      total_webhooks: parseInt(webhookData.total_webhooks) || 0,
      successful_webhooks: parseInt(webhookData.successful_webhooks) || 0,
      failed_webhooks: parseInt(webhookData.failed_webhooks) || 0,
      today_webhooks: parseInt(webhookData.today_webhooks) || 0,
      avg_response_time: parseFloat(webhookData.avg_response_time) || 0
    };

    // Process audit stats to ensure numbers are returned
    const auditData = auditStats.rows[0];
    const processedAuditStats = {
      total_audits: parseInt(auditData.total_audits) || 0,
      today_audits: parseInt(auditData.today_audits) || 0,
      unique_users: parseInt(auditData.unique_users) || 0
    };

    res.json({
      success: true,
      data: {
        webhook: processedWebhookStats,
        audit: processedAuditStats
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/logs/stats/by-endpoint - Get statistics grouped by endpoint
router.get('/stats/by-endpoint', async (req, res) => {
  try {
    const { endpoint, range = '24h' } = req.query;
    
    // Calculate time range
    let timeCondition = '';
    let queryParams = [];
    
    switch (range) {
      case '1h':
        timeCondition = 'AND recebido_em >= NOW() - INTERVAL \'1 hour\'';
        break;
      case '24h':
        timeCondition = 'AND recebido_em >= NOW() - INTERVAL \'24 hours\'';
        break;
      case '7d':
        timeCondition = 'AND recebido_em >= NOW() - INTERVAL \'7 days\'';
        break;
      case '30d':
        timeCondition = 'AND recebido_em >= NOW() - INTERVAL \'30 days\'';
        break;
      default:
        timeCondition = 'AND recebido_em >= NOW() - INTERVAL \'24 hours\'';
    }
    
    let whereClause = `WHERE 1=1 ${timeCondition}`;
    
    if (endpoint) {
      whereClause += ' AND slug_redirecionamento = $1';
      queryParams.push(endpoint);
    }
    
    const statsQuery = `
      SELECT 
        slug_redirecionamento as endpoint,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN status = 200 THEN 1 END) as success_count,
        COUNT(CASE WHEN status >= 400 THEN 1 END) as error_count,
        ROUND(
          (COUNT(CASE WHEN status = 200 THEN 1 END)::float / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as success_rate,
        AVG(tempo_resposta) as avg_response_time,
        MAX(recebido_em) as last_used
      FROM logs_webhook 
      ${whereClause}
      GROUP BY slug_redirecionamento
      ORDER BY usage_count DESC
    `;
    
    const result = await query(statsQuery, queryParams);
    
    // Calculate totals
    const totalUsage = result.rows.reduce((sum, row) => sum + parseInt(row.usage_count), 0);
    const totalSuccess = result.rows.reduce((sum, row) => sum + parseInt(row.success_count), 0);
    const totalErrors = result.rows.reduce((sum, row) => sum + parseInt(row.error_count), 0);
    const overallSuccessRate = totalUsage > 0 ? Math.round((totalSuccess / totalUsage) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        endpoints: result.rows,
        summary: {
          total_usage: totalUsage,
          total_success: totalSuccess,
          total_errors: totalErrors,
          overall_success_rate: overallSuccessRate,
          time_range: range
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas por endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

module.exports = router;
