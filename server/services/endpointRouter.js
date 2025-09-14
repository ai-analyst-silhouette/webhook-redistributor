/**
 * Endpoint Router Service
 * 
 * This service handles dynamic routing for webhook endpoints.
 * It provides functionality to:
 * - Route webhooks to specific endpoints by slug
 * - Validate endpoint existence and status
 * - Filter destinations by endpoint
 * - Provide detailed logging for endpoint usage
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const models = require('../database/models');
const { redistributeWebhook } = require('./redistributor');
const { logWebhook } = require('../database/logs');

/**
 * Routes a webhook to a specific endpoint by slug
 * @param {string} slug - The endpoint slug to route to
 * @param {Object} payload - The webhook payload
 * @param {Object} headers - Original headers from the webhook
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} - Result of the webhook processing
 */
const routeWebhook = async (slug, payload, headers, query) => {
  console.log(`=== ROUTING WEBHOOK TO ENDPOINT: ${slug} ===`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log('==========================================');

  try {
    // Validate slug
    if (!slug || typeof slug !== 'string') {
      throw new Error('Invalid endpoint slug provided');
    }

    // Get endpoint by slug
    const endpoint = await models.getEndpointBySlug(slug);
    
    if (!endpoint) {
      console.log(`❌ Endpoint not found: ${slug}`);
      return {
        success: false,
        error: 'Endpoint not found',
        statusCode: 404,
        message: `Webhook endpoint '${slug}' does not exist`
      };
    }

    // Check if endpoint is active
    if (!endpoint.active) {
      console.log(`❌ Endpoint is inactive: ${slug}`);
      return {
        success: false,
        error: 'Endpoint inactive',
        statusCode: 410,
        message: `Webhook endpoint '${slug}' is currently inactive`
      };
    }

    console.log(`✅ Endpoint found: ${endpoint.name} (${endpoint.slug})`);
    console.log(`Description: ${endpoint.description || 'No description'}`);

    // Get active destinations for this specific endpoint
    const destinations = await models.getActiveDestinationsByEndpoint(endpoint.id);
    
    console.log(`Found ${destinations.length} active destination(s) for endpoint '${slug}':`);
    destinations.forEach(dest => console.log(`  - ${dest.name}: ${dest.url}`));

    if (destinations.length === 0) {
      console.log(`⚠️ No active destinations found for endpoint '${slug}'`);
      return {
        success: true,
        message: `Webhook received for endpoint '${slug}' but no active destinations configured`,
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
          slug: endpoint.slug
        },
        redistribution: {
          attempted: 0,
          successful: 0,
          failed: 0,
          results: []
        }
      };
    }

    // Redistribute webhook to destinations for this specific endpoint
    const redistributionResults = await redistributeWebhook(payload, headers, query, endpoint.id);

    const successfulCount = redistributionResults.filter(r => r.success).length;
    const failedCount = redistributionResults.filter(r => !r.success).length;

    // Log webhook to database with endpoint information
    try {
      await logWebhook(
        JSON.stringify(payload),
        successfulCount > 0 ? 'success' : 'error',
        redistributionResults.length,
        failedCount > 0 ? `Failed to send to ${failedCount} destination(s)` : null,
        endpoint.slug,
        0 // response_time will be updated by middleware
      );
    } catch (logError) {
      console.error('Error logging webhook to database:', logError);
    }

    console.log(`=== ENDPOINT REDISTRIBUTION SUMMARY: ${slug} ===`);
    console.log(`Total destinations: ${redistributionResults.length}`);
    console.log(`Successful: ${successfulCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log('===============================================');

    return {
      success: true,
      message: `Webhook received and processed for endpoint '${slug}'`,
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description
      },
      redistribution: {
        attempted: redistributionResults.length,
        successful: successfulCount,
        failed: failedCount,
        results: redistributionResults
      }
    };

  } catch (error) {
    console.error(`❌ Error routing webhook to endpoint '${slug}':`, error);
    
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
      message: `Error processing webhook for endpoint '${slug}': ${error.message}`
    };
  }
};

/**
 * Routes a webhook to the default endpoint (slug = 'default')
 * @param {Object} payload - The webhook payload
 * @param {Object} headers - Original headers from the webhook
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} - Result of the webhook processing
 */
const routeToDefaultEndpoint = async (payload, headers, query) => {
  console.log('=== ROUTING WEBHOOK TO DEFAULT ENDPOINT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log('===========================================');

  try {
    // Get default destinations (webhook_endpoint_id IS NULL)
    const destinations = await models.getActiveDefaultDestinations();
    
    console.log(`Found ${destinations.length} active destination(s) for default endpoint:`);
    destinations.forEach(dest => console.log(`  - ${dest.name}: ${dest.url}`));

    if (destinations.length === 0) {
      console.log('⚠️ No active destinations found for default endpoint');
      return {
        success: true,
        message: 'Webhook received for default endpoint but no active destinations configured',
        endpoint: {
          id: null,
          name: 'Default',
          slug: 'default'
        },
        redistribution: {
          attempted: 0,
          successful: 0,
          failed: 0,
          results: []
        }
      };
    }

    // Redistribute webhook to default destinations (endpointId = null)
    const redistributionResults = await redistributeWebhook(payload, headers, query, null);

    const successfulCount = redistributionResults.filter(r => r.success).length;
    const failedCount = redistributionResults.filter(r => !r.success).length;

    // Log webhook to database with endpoint information
    try {
      await logWebhook(
        JSON.stringify(payload),
        successfulCount > 0 ? 'success' : 'error',
        redistributionResults.length,
        failedCount > 0 ? `Failed to send to ${failedCount} destination(s)` : null,
        'default',
        0 // response_time will be updated by middleware
      );
    } catch (logError) {
      console.error('Error logging webhook to database:', logError);
    }

    console.log('=== DEFAULT ENDPOINT REDISTRIBUTION SUMMARY ===');
    console.log(`Total destinations: ${redistributionResults.length}`);
    console.log(`Successful: ${successfulCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log('===============================================');

    return {
      success: true,
      message: 'Webhook received and processed for default endpoint',
      endpoint: {
        id: null,
        name: 'Default',
        slug: 'default'
      },
      redistribution: {
        attempted: redistributionResults.length,
        successful: successfulCount,
        failed: failedCount,
        results: redistributionResults
      }
    };

  } catch (error) {
    console.error('❌ Error routing webhook to default endpoint:', error);
    
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
      message: `Error processing webhook for default endpoint: ${error.message}`
    };
  }
};

/**
 * Gets endpoint usage statistics
 * @returns {Promise<Object>} - Endpoint usage statistics
 */
const getEndpointStats = async () => {
  try {
    const endpoints = await models.getAllEndpoints();
    const stats = [];

    for (const endpoint of endpoints) {
      const destinations = await models.getActiveDestinationsByEndpoint(endpoint.id);
      const totalDestinations = await models.getDestinationsByEndpoint(endpoint.id);
      
      stats.push({
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
          slug: endpoint.slug,
          description: endpoint.description,
          active: endpoint.active
        },
        destinations: {
          total: totalDestinations.length,
          active: destinations.length,
          inactive: totalDestinations.length - destinations.length
        },
        created_at: endpoint.created_at
      });
    }

    return {
      success: true,
      data: stats,
      count: stats.length
    };

  } catch (error) {
    console.error('Error getting endpoint stats:', error);
    return {
      success: false,
      error: 'Failed to get endpoint statistics',
      message: error.message
    };
  }
};

module.exports = {
  routeWebhook,
  routeToDefaultEndpoint,
  getEndpointStats
};
