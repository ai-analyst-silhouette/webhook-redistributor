/**
 * Endpoint Logger Middleware
 * 
 * This middleware provides logging functionality for webhook endpoints:
 * - Logs which endpoint was called
 * - Tracks usage statistics per endpoint
 * - Provides detailed logging for debugging
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const { query } = require('../database/postgres');
const { logWebhook } = require('../database/logs');

// In-memory counter for endpoint usage (in production, this should be in a database)
const endpointUsageCounters = new Map();

/**
 * Middleware to log endpoint usage and track statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logEndpointUsage = (req, res, next) => {
  const startTime = Date.now();
  const endpoint = req.params.slug || 'default';
  
  // Log endpoint access
  console.log(`🔗 Endpoint accessed: /api/webhook/${endpoint}`);
  console.log(`📊 Method: ${req.method}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`👤 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  
  // Track usage counter
  const currentCount = endpointUsageCounters.get(endpoint) || 0;
  endpointUsageCounters.set(endpoint, currentCount + 1);
  
  console.log(`📈 Usage count for '${endpoint}': ${currentCount + 1}`);
  
  // Add endpoint info to request for use in routes
  req.endpointInfo = {
    slug: endpoint,
    startTime: startTime,
    usageCount: currentCount + 1
  };
  
  next();
};

/**
 * Middleware to log response details after processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logEndpointResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const endTime = Date.now();
    const processingTime = endTime - (req.endpointInfo?.startTime || endTime);
    
    console.log(`✅ Endpoint response sent: /api/webhook/${req.endpointInfo?.slug || 'default'}`);
    console.log(`⏱️ Processing time: ${processingTime}ms`);
    console.log(`📊 Status code: ${res.statusCode}`);
    console.log(`📦 Response size: ${JSON.stringify(data).length} bytes`);
    
    // Log to database if it's a webhook request
    if (req.method === 'POST' && req.endpointInfo) {
      logEndpointToDatabase(req, res.statusCode, processingTime, data);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Logs endpoint usage to database
 * @param {Object} req - Express request object
 * @param {number} statusCode - HTTP status code
 * @param {number} processingTime - Processing time in milliseconds
 * @param {any} responseData - Response data
 */
const logEndpointToDatabase = async (req, statusCode, processingTime, responseData) => {
  try {
    const { logWebhook } = require('../database/logs');
    
    // Log to logs_webhook table with endpoint information
    await logWebhook(
      JSON.stringify(req.body),
      statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
      0, // destinos_enviados will be updated by redistributor
      statusCode >= 200 && statusCode < 300 ? null : `HTTP ${statusCode}`,
      req.endpointInfo.slug,
      processingTime
    );
    
    console.log(`📝 Database log entry for endpoint '${req.endpointInfo.slug}':`);
    console.log(`   - Status: ${statusCode}`);
    console.log(`   - Processing time: ${processingTime}ms`);
    console.log(`   - Usage count: ${req.endpointInfo.usageCount}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error logging endpoint to database:', error);
  }
};

/**
 * Gets endpoint usage statistics
 * @returns {Object} Usage statistics for all endpoints
 */
const getEndpointUsageStats = () => {
  const stats = {};
  
  for (const [endpoint, count] of endpointUsageCounters.entries()) {
    stats[endpoint] = {
      totalRequests: count,
      lastAccessed: new Date().toISOString()
    };
  }
  
  return {
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  };
};

/**
 * Resets endpoint usage counters
 */
const resetEndpointCounters = () => {
  endpointUsageCounters.clear();
  console.log('🔄 Endpoint usage counters reset');
};

/**
 * Gets detailed endpoint information including database stats
 * @returns {Promise<Object>} Detailed endpoint statistics
 */
const getDetailedEndpointStats = async () => {
  try {
    // Por enquanto, retorna estatísticas básicas dos redirecionamentos
    const result = await query('SELECT id, nome, slug, descricao, ativo, created_at FROM redirecionamentos WHERE ativo = true');
    const detailedStats = [];
    
    for (const redirecionamento of result.rows) {
      const usageCount = endpointUsageCounters.get(redirecionamento.slug) || 0;
      
      detailedStats.push({
        endpoint: {
          id: redirecionamento.id,
          name: redirecionamento.nome,
          slug: redirecionamento.slug,
          description: redirecionamento.descricao,
          active: redirecionamento.ativo,
          created_at: redirecionamento.created_at
        },
        destinations: {
          total: 0, // TODO: Implementar contagem de destinos
          active: 0, // TODO: Implementar contagem de destinos
          inactive: 0 // TODO: Implementar contagem de destinos
        },
        usage: {
          totalRequests: usageCount,
          lastAccessed: new Date().toISOString()
        }
      });
    }
    
    return {
      success: true,
      data: detailedStats,
      count: detailedStats.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting detailed endpoint stats:', error);
    return {
      success: false,
      error: 'Failed to get detailed endpoint statistics',
      message: error.message
    };
  }
};

module.exports = {
  logEndpointUsage,
  logEndpointResponse,
  getEndpointUsageStats,
  resetEndpointCounters,
  getDetailedEndpointStats
};
