/**
 * Endpoint Usage Tracking Utility
 * 
 * This utility provides comprehensive endpoint usage tracking and management:
 * - Track usage statistics per endpoint
 * - Identify unused or inactive endpoints
 * - Generate usage reports
 * - Automatic cleanup of inactive endpoints
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const models = require('../database/models');
const { logWebhook } = require('../database/logs');

// In-memory usage tracking (in production, this should be in a database)
const usageTracker = new Map();

/**
 * Track endpoint usage
 * @param {string} endpointSlug - The endpoint slug
 * @param {Object} requestData - Request data for tracking
 */
const trackUsage = (endpointSlug, requestData = {}) => {
  const now = new Date();
  const usageKey = endpointSlug;
  
  if (!usageTracker.has(usageKey)) {
    usageTracker.set(usageKey, {
      totalRequests: 0,
      lastUsed: null,
      firstUsed: now,
      averageResponseTime: 0,
      successCount: 0,
      errorCount: 0,
      uniqueIPs: new Set(),
      userAgents: new Set(),
      requestSizes: [],
      responseTimes: []
    });
  }
  
  const stats = usageTracker.get(usageKey);
  stats.totalRequests++;
  stats.lastUsed = now;
  
  if (requestData.ip) {
    stats.uniqueIPs.add(requestData.ip);
  }
  
  if (requestData.userAgent) {
    stats.userAgents.add(requestData.userAgent);
  }
  
  if (requestData.requestSize) {
    stats.requestSizes.push(requestData.requestSize);
    // Keep only last 100 request sizes for memory management
    if (stats.requestSizes.length > 100) {
      stats.requestSizes = stats.requestSizes.slice(-100);
    }
  }
  
  if (requestData.responseTime) {
    stats.responseTimes.push(requestData.responseTime);
    // Keep only last 100 response times for memory management
    if (stats.responseTimes.length > 100) {
      stats.responseTimes = stats.responseTimes.slice(-100);
    }
    
    // Update average response time
    const totalTime = stats.responseTimes.reduce((sum, time) => sum + time, 0);
    stats.averageResponseTime = totalTime / stats.responseTimes.length;
  }
  
  if (requestData.success !== undefined) {
    if (requestData.success) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }
  }
};

/**
 * Get usage statistics for all endpoints
 * @returns {Object} Usage statistics
 */
const getAllUsageStats = () => {
  const stats = {};
  
  for (const [endpointSlug, data] of usageTracker.entries()) {
    stats[endpointSlug] = {
      totalRequests: data.totalRequests,
      lastUsed: data.lastUsed,
      firstUsed: data.firstUsed,
      averageResponseTime: Math.round(data.averageResponseTime),
      successRate: data.totalRequests > 0 ? 
        Math.round((data.successCount / data.totalRequests) * 100) : 0,
      errorRate: data.totalRequests > 0 ? 
        Math.round((data.errorCount / data.totalRequests) * 100) : 0,
      uniqueIPs: data.uniqueIPs.size,
      uniqueUserAgents: data.userAgents.size,
      averageRequestSize: data.requestSizes.length > 0 ? 
        Math.round(data.requestSizes.reduce((sum, size) => sum + size, 0) / data.requestSizes.length) : 0,
      isActive: data.lastUsed ? 
        (Date.now() - data.lastUsed.getTime()) < (24 * 60 * 60 * 1000) : false // Active if used in last 24h
    };
  }
  
  return stats;
};

/**
 * Get usage statistics for a specific endpoint
 * @param {string} endpointSlug - The endpoint slug
 * @returns {Object|null} Usage statistics or null if not found
 */
const getEndpointUsageStats = (endpointSlug) => {
  const data = usageTracker.get(endpointSlug);
  if (!data) return null;
  
  return {
    totalRequests: data.totalRequests,
    lastUsed: data.lastUsed,
    firstUsed: data.firstUsed,
    averageResponseTime: Math.round(data.averageResponseTime),
    successRate: data.totalRequests > 0 ? 
      Math.round((data.successCount / data.totalRequests) * 100) : 0,
    errorRate: data.totalRequests > 0 ? 
      Math.round((data.errorCount / data.totalRequests) * 100) : 0,
    uniqueIPs: data.uniqueIPs.size,
    uniqueUserAgents: data.userAgents.size,
    averageRequestSize: data.requestSizes.length > 0 ? 
      Math.round(data.requestSizes.reduce((sum, size) => sum + size, 0) / data.requestSizes.length) : 0,
    isActive: data.lastUsed ? 
      (Date.now() - data.lastUsed.getTime()) < (24 * 60 * 60 * 1000) : false
  };
};

/**
 * Get inactive endpoints (not used in the last 24 hours)
 * @returns {Array} Array of inactive endpoint slugs
 */
const getInactiveEndpoints = () => {
  const inactive = [];
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [endpointSlug, data] of usageTracker.entries()) {
    if (!data.lastUsed || (now - data.lastUsed.getTime()) > twentyFourHours) {
      inactive.push({
        slug: endpointSlug,
        lastUsed: data.lastUsed,
        daysSinceLastUse: data.lastUsed ? 
          Math.floor((now - data.lastUsed.getTime()) / (24 * 60 * 60 * 1000)) : null
      });
    }
  }
  
  return inactive;
};

/**
 * Get unused endpoints (never used)
 * @returns {Array} Array of unused endpoint slugs
 */
const getUnusedEndpoints = () => {
  const unused = [];
  
  for (const [endpointSlug, data] of usageTracker.entries()) {
    if (data.totalRequests === 0) {
      unused.push({
        slug: endpointSlug,
        created: data.firstUsed
      });
    }
  }
  
  return unused;
};

/**
 * Get most used endpoints
 * @param {number} limit - Number of endpoints to return (default: 10)
 * @returns {Array} Array of most used endpoints
 */
const getMostUsedEndpoints = (limit = 10) => {
  const allStats = getAllUsageStats();
  
  return Object.entries(allStats)
    .map(([slug, stats]) => ({ slug, ...stats }))
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, limit);
};

/**
 * Get endpoints with highest error rates
 * @param {number} minRequests - Minimum requests to consider (default: 10)
 * @param {number} minErrorRate - Minimum error rate percentage (default: 10)
 * @returns {Array} Array of endpoints with high error rates
 */
const getHighErrorRateEndpoints = (minRequests = 10, minErrorRate = 10) => {
  const allStats = getAllUsageStats();
  
  return Object.entries(allStats)
    .map(([slug, stats]) => ({ slug, ...stats }))
    .filter(stats => stats.totalRequests >= minRequests && stats.errorRate >= minErrorRate)
    .sort((a, b) => b.errorRate - a.errorRate);
};

/**
 * Generate comprehensive usage report
 * @returns {Object} Comprehensive usage report
 */
const generateUsageReport = async () => {
  try {
    const allEndpoints = await models.getAllEndpoints();
    const allStats = getAllUsageStats();
    const inactiveEndpoints = getInactiveEndpoints();
    const unusedEndpoints = getUnusedEndpoints();
    const mostUsed = getMostUsedEndpoints(5);
    const highErrorRate = getHighErrorRateEndpoints();
    
    const totalEndpoints = allEndpoints.length;
    const activeEndpoints = Object.values(allStats).filter(stats => stats.isActive).length;
    const totalRequests = Object.values(allStats).reduce((sum, stats) => sum + stats.totalRequests, 0);
    const averageResponseTime = Object.values(allStats).reduce((sum, stats) => sum + stats.averageResponseTime, 0) / 
      (Object.values(allStats).length || 1);
    
    return {
      summary: {
        totalEndpoints,
        activeEndpoints,
        inactiveEndpoints: inactiveEndpoints.length,
        unusedEndpoints: unusedEndpoints.length,
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime)
      },
      inactiveEndpoints,
      unusedEndpoints,
      mostUsedEndpoints: mostUsed,
      highErrorRateEndpoints: highErrorRate,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating usage report:', error);
    throw error;
  }
};

/**
 * Cleanup inactive endpoints (mark as inactive if not used for specified days)
 * @param {number} daysInactive - Days of inactivity before cleanup (default: 30)
 * @returns {Object} Cleanup results
 */
const cleanupInactiveEndpoints = async (daysInactive = 30) => {
  try {
    const allEndpoints = await models.getAllEndpoints();
    const now = Date.now();
    const daysInMs = daysInactive * 24 * 60 * 60 * 1000;
    
    const cleanedUp = [];
    const errors = [];
    
    for (const endpoint of allEndpoints) {
      // Skip default endpoint
      if (endpoint.slug === 'default') continue;
      
      const stats = getEndpointUsageStats(endpoint.slug);
      const isInactive = !stats || !stats.lastUsed || (now - stats.lastUsed.getTime()) > daysInMs;
      
      if (isInactive && endpoint.active) {
        try {
          await models.updateEndpoint(endpoint.id, endpoint.name, endpoint.slug, endpoint.description, false);
          cleanedUp.push({
            id: endpoint.id,
            name: endpoint.name,
            slug: endpoint.slug,
            lastUsed: stats?.lastUsed,
            daysSinceLastUse: stats?.lastUsed ? 
              Math.floor((now - stats.lastUsed.getTime()) / (24 * 60 * 60 * 1000)) : null
          });
        } catch (error) {
          errors.push({
            endpoint: endpoint.slug,
            error: error.message
          });
        }
      }
    }
    
    return {
      cleanedUp,
      errors,
      totalCleaned: cleanedUp.length,
      totalErrors: errors.length
    };
  } catch (error) {
    console.error('Error cleaning up inactive endpoints:', error);
    throw error;
  }
};

/**
 * Reset usage statistics for an endpoint
 * @param {string} endpointSlug - The endpoint slug
 * @returns {boolean} Success status
 */
const resetEndpointStats = (endpointSlug) => {
  if (usageTracker.has(endpointSlug)) {
    usageTracker.delete(endpointSlug);
    return true;
  }
  return false;
};

/**
 * Reset all usage statistics
 */
const resetAllStats = () => {
  usageTracker.clear();
};

/**
 * Get detailed endpoint analytics
 * @param {string} endpointSlug - The endpoint slug
 * @returns {Object|null} Detailed analytics or null if not found
 */
const getDetailedAnalytics = (endpointSlug) => {
  const data = usageTracker.get(endpointSlug);
  if (!data) return null;
  
  return {
    basic: getEndpointUsageStats(endpointSlug),
    requestSizes: {
      min: data.requestSizes.length > 0 ? Math.min(...data.requestSizes) : 0,
      max: data.requestSizes.length > 0 ? Math.max(...data.requestSizes) : 0,
      average: data.requestSizes.length > 0 ? 
        Math.round(data.requestSizes.reduce((sum, size) => sum + size, 0) / data.requestSizes.length) : 0
    },
    responseTimes: {
      min: data.responseTimes.length > 0 ? Math.min(...data.responseTimes) : 0,
      max: data.responseTimes.length > 0 ? Math.max(...data.responseTimes) : 0,
      average: Math.round(data.averageResponseTime)
    },
    uniqueIPs: Array.from(data.uniqueIPs),
    userAgents: Array.from(data.userAgents)
  };
};

module.exports = {
  trackUsage,
  getAllUsageStats,
  getEndpointUsageStats,
  getInactiveEndpoints,
  getUnusedEndpoints,
  getMostUsedEndpoints,
  getHighErrorRateEndpoints,
  generateUsageReport,
  cleanupInactiveEndpoints,
  resetEndpointStats,
  resetAllStats,
  getDetailedAnalytics
};
