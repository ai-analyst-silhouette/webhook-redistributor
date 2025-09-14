const { db } = require('./init');

// Create a new webhook log entry
const createWebhookLog = (payload, status, destinationsSent, errorMessage = null) => {
  return new Promise((resolve, reject) => {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    db.run(
      'INSERT INTO webhook_logs (payload, status, destinations_sent, error_message) VALUES (?, ?, ?, ?)',
      [payloadString, status, destinationsSent, errorMessage],
      function(err) {
        if (err) {
          console.error('Error creating webhook log:', err.message);
          return reject(new Error('Failed to create webhook log'));
        }
        console.log(`Webhook log created with ID: ${this.lastID}`);
        resolve({
          id: this.lastID,
          payload: payloadString,
          status,
          destinations_sent: destinationsSent,
          error_message: errorMessage,
          received_at: new Date().toISOString()
        });
      }
    );
  });
};

// Get recent webhook logs (last 50)
const getRecentWebhookLogs = (limit = 50) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM webhook_logs ORDER BY received_at DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) {
          console.error('Error fetching webhook logs:', err.message);
          return reject(new Error('Failed to fetch webhook logs'));
        }
        resolve(rows);
      }
    );
  });
};

// Get webhook statistics
const getWebhookStats = () => {
  return new Promise((resolve, reject) => {
    const stats = {};
    
    // Get total webhooks received
    db.get('SELECT COUNT(*) as total FROM webhook_logs', (err, row) => {
      if (err) {
        console.error('Error fetching total webhooks:', err.message);
        return reject(new Error('Failed to fetch total webhooks'));
      }
      stats.total = row.total;
      
      // Get successful webhooks
      db.get('SELECT COUNT(*) as successful FROM webhook_logs WHERE status = "success"', (err, row) => {
        if (err) {
          console.error('Error fetching successful webhooks:', err.message);
          return reject(new Error('Failed to fetch successful webhooks'));
        }
        stats.successful = row.successful;
        
        // Get error webhooks
        db.get('SELECT COUNT(*) as errors FROM webhook_logs WHERE status = "error"', (err, row) => {
          if (err) {
            console.error('Error fetching error webhooks:', err.message);
            return reject(new Error('Failed to fetch error webhooks'));
          }
          stats.errors = row.errors;
          
          // Get today's webhooks
          db.get('SELECT COUNT(*) as today FROM webhook_logs WHERE DATE(received_at) = DATE("now")', (err, row) => {
            if (err) {
              console.error('Error fetching today\'s webhooks:', err.message);
              return reject(new Error('Failed to fetch today\'s webhooks'));
            }
            stats.today = row.today;
            
            // Calculate success rate
            stats.success_rate = stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(2) : 0;
            
            resolve(stats);
          });
        });
      });
    });
  });
};

// Get webhook logs by date range
const getWebhookLogsByDateRange = (startDate, endDate, limit = 100) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM webhook_logs WHERE received_at BETWEEN ? AND ? ORDER BY received_at DESC LIMIT ?',
      [startDate, endDate, limit],
      (err, rows) => {
        if (err) {
          console.error('Error fetching webhook logs by date range:', err.message);
          return reject(new Error('Failed to fetch webhook logs by date range'));
        }
        resolve(rows);
      }
    );
  });
};

// Get webhook statistics grouped by endpoint
const getWebhookStatsByEndpoint = (startDate, endpoint = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        wl.endpoint_slug,
        COUNT(*) as usage_count,
        AVG(wl.response_time) as avg_response_time,
        SUM(CASE WHEN wl.status = 200 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN wl.status >= 400 THEN 1 ELSE 0 END) as error_count,
        MAX(wl.received_at) as last_used
      FROM webhook_logs wl
      WHERE wl.received_at >= ?
    `;
    
    const params = [startDate.toISOString()];
    
    if (endpoint) {
      query += ' AND wl.endpoint_slug = ?';
      params.push(endpoint);
    }
    
    query += ' GROUP BY wl.endpoint_slug ORDER BY usage_count DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching webhook stats by endpoint:', err.message);
        return reject(err);
      }
      
      // Get overall stats
      const overallQuery = `
        SELECT 
          COUNT(*) as total_usage,
          AVG(response_time) as avg_response_time,
          SUM(CASE WHEN status = 200 THEN 1 ELSE 0 END) as total_success,
          SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as total_errors
        FROM webhook_logs 
        WHERE received_at >= ?
      `;
      
      const overallParams = [startDate.toISOString()];
      if (endpoint) {
        overallQuery += ' AND endpoint_slug = ?';
        overallParams.push(endpoint);
      }
      
      db.get(overallQuery, overallParams, (err, overallStats) => {
        if (err) {
          console.error('Error fetching overall stats:', err.message);
          return reject(err);
        }
        
        const successRate = overallStats.total_usage > 0 
          ? Math.round((overallStats.total_success / overallStats.total_usage) * 100)
          : 0;
        
        resolve({
          endpoints: rows.map(row => ({
            endpoint_slug: row.endpoint_slug || 'default',
            usage_count: row.usage_count,
            avg_response_time: Math.round(row.avg_response_time || 0),
            success_count: row.success_count,
            error_count: row.error_count,
            last_used: row.last_used,
            success_rate: row.usage_count > 0 ? Math.round((row.success_count / row.usage_count) * 100) : 0
          })),
          total_usage: overallStats.total_usage,
          avg_response_time: Math.round(overallStats.avg_response_time || 0),
          success_rate: successRate,
          recent_activity: [] // This could be populated with recent activity if needed
        });
      });
    });
  });
};

// Get webhook logs by endpoint
const getWebhookLogsByEndpoint = (endpointSlug, limit = 50, status = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        wl.*,
        we.name as endpoint_name,
        we.slug as endpoint_slug
      FROM webhook_logs wl
      LEFT JOIN webhook_endpoints we ON wl.endpoint_slug = we.slug
      WHERE wl.endpoint_slug = ?
    `;
    
    const params = [endpointSlug];
    
    if (status) {
      if (status === 'success') {
        query += ' AND wl.status = 200';
      } else if (status === 'error') {
        query += ' AND wl.status >= 400';
      }
    }
    
    query += ' ORDER BY wl.received_at DESC LIMIT ?';
    params.push(limit);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching webhook logs by endpoint:', err.message);
        return reject(err);
      }
      
      const logs = rows.map(row => ({
        id: row.id,
        payload: row.payload,
        status: row.status,
        destinations_sent: row.destinations_sent,
        error_message: row.error_message,
        received_at: row.received_at,
        response_time: row.response_time,
        endpoint_slug: row.endpoint_slug,
        endpoint_name: row.endpoint_name || 'Default'
      }));
      
      resolve(logs);
    });
  });
};

// Enhanced logWebhook function with endpoint support
const logWebhook = (payload, status, destinationsSent, errorMessage = null, endpointSlug = null, responseTime = 0) => {
  return new Promise((resolve, reject) => {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    db.run(
      'INSERT INTO webhook_logs (payload, status, destinations_sent, error_message, endpoint_slug, response_time) VALUES (?, ?, ?, ?, ?, ?)',
      [payloadString, status, destinationsSent, errorMessage, endpointSlug, responseTime],
      function(err) {
        if (err) {
          console.error('Error creating webhook log:', err.message);
          return reject(new Error('Failed to create webhook log'));
        }
        console.log(`Webhook log created with ID: ${this.lastID}`);
        resolve({
          id: this.lastID,
          payload: payloadString,
          status,
          destinationsSent,
          errorMessage,
          endpointSlug,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }
    );
  });
};

module.exports = {
  createWebhookLog,
  logWebhook,
  getRecentWebhookLogs,
  getWebhookStats,
  getWebhookLogsByDateRange,
  getWebhookStatsByEndpoint,
  getWebhookLogsByEndpoint
};
