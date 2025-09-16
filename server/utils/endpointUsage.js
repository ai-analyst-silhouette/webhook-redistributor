/**
 * Endpoint Usage Utilities
 * 
 * Handles endpoint usage tracking and statistics
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const { query } = require('../database/postgres');
// const { logWebhook } = require('../database/logs'); // Removed - logs are handled in webhook routes

// In-memory usage tracking (in production, this should be in a database)
const usageTracker = new Map();

/**
 * Track endpoint usage
 * @param {string} endpointSlug - The endpoint slug
 * @param {Object} payload - The webhook payload
 * @param {string} status - Success or error status
 */
const trackUsage = (endpointSlug, payload, status) => {
  const key = `${endpointSlug}_${status}`;
  const current = usageTracker.get(key) || 0;
  usageTracker.set(key, current + 1);
  
  // Also track total usage
  const totalKey = `${endpointSlug}_total`;
  const total = usageTracker.get(totalKey) || 0;
  usageTracker.set(totalKey, total + 1);
};

/**
 * Get usage statistics for an endpoint
 * @param {string} endpointSlug - The endpoint slug
 * @returns {Object} Usage statistics
 */
const getUsageStats = (endpointSlug) => {
  const successKey = `${endpointSlug}_success`;
  const errorKey = `${endpointSlug}_error`;
  const totalKey = `${endpointSlug}_total`;
  
  return {
    success: usageTracker.get(successKey) || 0,
    errors: usageTracker.get(errorKey) || 0,
    total: usageTracker.get(totalKey) || 0
  };
};

/**
 * Get all usage statistics
 * @returns {Object} All usage statistics
 */
const getAllUsageStats = () => {
  const stats = {};
  
  for (const [key, value] of usageTracker.entries()) {
    const [endpoint, type] = key.split('_');
    
    if (!stats[endpoint]) {
      stats[endpoint] = { success: 0, errors: 0, total: 0 };
    }
    
    if (type === 'success') {
      stats[endpoint].success = value;
    } else if (type === 'error') {
      stats[endpoint].errors = value;
    } else if (type === 'total') {
      stats[endpoint].total = value;
    }
  }
  
  return stats;
};

/**
 * Generate usage report
 * @returns {Promise<Object>} Usage report
 */
const generateUsageReport = async () => {
  try {
    // Get redirecionamentos from database
    const result = await query('SELECT id, nome, slug, descricao, ativo, created_at FROM redirecionamentos ORDER BY created_at');
    const redirecionamentos = result.rows;
    
    const report = {
      generated_at: new Date().toISOString(),
      endpoints: redirecionamentos.map(redirecionamento => ({
        id: redirecionamento.id,
        name: redirecionamento.nome,
        slug: redirecionamento.slug,
        description: redirecionamento.descricao,
        active: redirecionamento.ativo,
        created_at: redirecionamento.created_at,
        usage: getUsageStats(redirecionamento.slug)
      })),
      summary: {
        total_endpoints: redirecionamentos.length,
        active_endpoints: redirecionamentos.filter(r => r.ativo).length,
        total_requests: Object.values(getAllUsageStats()).reduce((sum, stats) => sum + stats.total, 0)
      }
    };
    
    return report;
  } catch (error) {
    console.error('Error generating usage report:', error);
    return {
      generated_at: new Date().toISOString(),
      endpoints: [],
      summary: {
        total_endpoints: 0,
        active_endpoints: 0,
        total_requests: 0
      },
      error: error.message
    };
  }
};

/**
 * Reset usage statistics
 */
const resetUsageStats = () => {
  usageTracker.clear();
};

module.exports = {
  trackUsage,
  getUsageStats,
  getAllUsageStats,
  generateUsageReport,
  resetUsageStats
};