const { query } = require('./postgres');
const { toBrazilianTime } = require('../utils/timezone');

// Create a new webhook log entry
const createWebhookLog = async (payload, status, destinationsSent, errorMessage = null) => {
  try {
    const result = await query(
      `INSERT INTO logs_webhook (payload, status, destinos_enviados, erro, recebido_em) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
       RETURNING id`,
      [JSON.stringify(payload), status, destinationsSent, errorMessage]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating webhook log:', error);
    throw error;
  }
};

// Get webhook statistics
const getWebhookStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
        COUNT(CASE WHEN DATE(recebido_em) = CURRENT_DATE THEN 1 END) as today
      FROM logs_webhook
    `);

    return {
      total: parseInt(result.rows[0].total),
      successful: parseInt(result.rows[0].successful),
      errors: parseInt(result.rows[0].errors),
      today: parseInt(result.rows[0].today)
    };
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    return { total: 0, successful: 0, errors: 0, today: 0 };
  }
};

// Get webhook logs with pagination
const getWebhookLogs = async (page = 1, limit = 50, status = null) => {
  try {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [limit, offset];
    
    if (status) {
      whereClause = 'WHERE status = $3';
      params = [limit, offset, status];
    }
    
    const result = await query(
      `SELECT * FROM logs_webhook ${whereClause} 
       ORDER BY recebido_em DESC 
       LIMIT $1 OFFSET $2`,
      params
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting webhook logs:', error);
    return [];
  }
};

// Get recent webhook logs (alias for getWebhookLogs)
const getRecentWebhookLogs = async (limit = 50) => {
  return await getWebhookLogs(1, limit);
};

// Get detailed webhook statistics
const getDetailedStats = async (startDate = null, endDate = null) => {
  try {
    let whereClause = '';
    let params = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE recebido_em BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
         AVG(CASE WHEN status = 'success' THEN destinos_enviados END) as avg_destinations
       FROM logs_webhook ${whereClause}`,
      params
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting detailed stats:', error);
    return { total: 0, successful: 0, errors: 0, avg_destinations: 0 };
  }
};

// Get webhook logs by date range
const getWebhookLogsByDateRange = async (startDate, endDate, limit = 50) => {
  try {
    const result = await query(
      `SELECT * FROM logs_webhook 
       WHERE recebido_em BETWEEN $1 AND $2 
       ORDER BY recebido_em DESC 
       LIMIT $3`,
      [startDate, endDate, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting webhook logs by date range:', error);
    return [];
  }
};

// Get webhook log by ID
const getWebhookLogById = async (id) => {
  try {
    const result = await query('SELECT * FROM logs_webhook WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting webhook log by ID:', error);
    return null;
  }
};

// Get webhook stats by endpoint
const getWebhookStatsByEndpoint = async (startDate, endpoint) => {
  try {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
       FROM logs_webhook 
       WHERE recebido_em >= $1 AND slug = $2`,
      [startDate, endpoint]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting webhook stats by endpoint:', error);
    return { total: 0, successful: 0, errors: 0 };
  }
};

// Get webhook logs by endpoint
const getWebhookLogsByEndpoint = async (slug, limit = 50, status = null) => {
  try {
    let whereClause = 'WHERE slug = $1';
    let params = [slug, limit];
    
    if (status) {
      whereClause += ' AND status = $3';
      params.push(status);
    }
    
    const result = await query(
      `SELECT * FROM logs_webhook ${whereClause} 
       ORDER BY recebido_em DESC 
       LIMIT $2`,
      params
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting webhook logs by endpoint:', error);
    return [];
  }
};

// Log webhook (main function)
const logWebhook = async (payload, status, destinationsSent, errorMessage = null) => {
  try {
    const logId = await createWebhookLog(payload, status, destinationsSent, errorMessage);
    console.log(`Webhook logged with ID: ${logId}`);
    return logId;
  } catch (error) {
    console.error('Error logging webhook:', error);
    throw error;
  }
};

module.exports = {
  createWebhookLog,
  getWebhookStats,
  getWebhookLogs,
  getRecentWebhookLogs,
  getWebhookLogsByDateRange,
  getWebhookLogById,
  getWebhookStatsByEndpoint,
  getWebhookLogsByEndpoint,
  getDetailedStats,
  logWebhook
};