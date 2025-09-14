/**
 * Webhook Redistribution Service
 * 
 * This service handles the core functionality of redistributing webhooks
 * to multiple destinations. It includes:
 * - Fetching active destinations from database
 * - Sending webhooks to each destination with custom headers
 * - Handling timeouts and errors gracefully
 * - Detailed logging of redistribution attempts
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const axios = require('axios');
const { 
  getActiveDestinations, 
  getActiveDestinationsByEndpoint, 
  getActiveDefaultDestinations,
  getEndpointById
} = require('../database/models');

// Configuration
const WEBHOOK_TIMEOUT = 5000; // 5 seconds timeout for webhook delivery

/**
 * Redistributes webhook payload to active destinations for a specific endpoint
 * @param {Object} payload - The webhook payload to redistribute
 * @param {Object} headers - Original headers from the webhook
 * @param {Object} query - Original query parameters
 * @param {number|null} endpointId - Specific endpoint ID to filter destinations (null for default)
 * @returns {Promise<Array>} Array of redistribution results
 */
const redistributeWebhook = async (payload, headers = {}, query = {}, endpointId = null) => {
  console.log('=== STARTING WEBHOOK REDISTRIBUTION ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log('Endpoint ID:', endpointId || 'default');

  try {
    // Get endpoint slug for logging
    let endpointSlug = 'default';
    if (endpointId) {
      const endpoint = await getEndpointById(endpointId);
      if (endpoint) {
        endpointSlug = endpoint.slug;
      }
    }

    // Get active destinations for specific endpoint
    let destinations;
    if (endpointId === null) {
      // Get default destinations (webhook_endpoint_id IS NULL)
      destinations = await getActiveDefaultDestinations();
    } else {
      // Get destinations for specific endpoint
      destinations = await getActiveDestinationsByEndpoint(endpointId);
    }
    
    if (destinations.length === 0) {
      console.log('No active destinations found. Skipping redistribution.');
      return [];
    }

    console.log(`Found ${destinations.length} active destination(s) for endpoint ${endpointSlug}:`);
    destinations.forEach(dest => {
      console.log(`  - ${dest.name}: ${dest.url}`);
    });

    // Prepare redistribution results array
    const results = [];

    // Redistribute to each destination
    for (const destination of destinations) {
      const result = await sendToDestination(destination, payload, headers, query);
      results.push(result);
    }

    // Log summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`=== REDISTRIBUTION SUMMARY (Endpoint: ${endpointSlug}) ===`);
    console.log(`Total destinations: ${destinations.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log('===============================================');

    return results;

  } catch (error) {
    console.error('Error in webhook redistribution:', error);
    throw error;
  }
};

/**
 * Sends webhook payload to a specific destination
 * @param {Object} destination - Destination object with id, name, url
 * @param {Object} payload - Webhook payload
 * @param {Object} headers - Original headers
 * @param {Object} query - Original query parameters
 * @returns {Promise<Object>} Result object with success status and details
 */
const sendToDestination = async (destination, payload, headers, query) => {
  const startTime = Date.now();
  
  try {
    console.log(`\n--- Sending to ${destination.name} (${destination.url}) ---`);

    // Prepare headers for redistribution
    const redistributionHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Webhook-Redistributor/1.0',
      'X-Redistributed-At': new Date().toISOString(),
      'X-Redistributed-From': 'webhook-redistributor',
      // Preserve some original headers that might be important
      ...(headers['x-webhook-source'] && { 'X-Original-Source': headers['x-webhook-source'] }),
      ...(headers['x-webhook-event'] && { 'X-Original-Event': headers['x-webhook-event'] }),
    };

    // Send POST request to destination
    const response = await axios.post(destination.url, payload, {
      headers: redistributionHeaders,
      timeout: WEBHOOK_TIMEOUT,
      validateStatus: (status) => status < 500, // Accept 2xx, 3xx, 4xx as success
    });

    const duration = Date.now() - startTime;
    
    const result = {
      destinationId: destination.id,
      destinationName: destination.name,
      destinationUrl: destination.url,
      success: true,
      statusCode: response.status,
      responseTime: duration,
      responseData: response.data,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ SUCCESS: ${destination.name}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response time: ${duration}ms`);
    console.log(`   Response size: ${JSON.stringify(response.data || '').length} bytes`);

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    let errorMessage = 'Unknown error';
    let statusCode = null;

    if (error.response) {
      // Server responded with error status
      statusCode = error.response.status;
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response received (timeout or network error)';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = `Request timeout (${WEBHOOK_TIMEOUT}ms)`;
    } else {
      errorMessage = error.message;
    }

    const result = {
      destinationId: destination.id,
      destinationName: destination.name,
      destinationUrl: destination.url,
      success: false,
      error: errorMessage,
      statusCode: statusCode,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };

    console.log(`❌ FAILED: ${destination.name}`);
    console.log(`   Error: ${errorMessage}`);
    console.log(`   Response time: ${duration}ms`);
    if (statusCode) {
      console.log(`   Status code: ${statusCode}`);
    }

    return result;
  }
};

/**
 * Test connectivity to a destination without sending payload
 * @param {Object} destination - Destination object
 * @returns {Promise<Object>} Test result
 */
const testDestination = async (destination) => {
  try {
    console.log(`Testing connectivity to ${destination.name} (${destination.url})`);
    
    const response = await axios.get(destination.url, {
      timeout: WEBHOOK_TIMEOUT,
      validateStatus: (status) => status < 500,
    });

    return {
      destinationId: destination.id,
      destinationName: destination.name,
      destinationUrl: destination.url,
      success: true,
      statusCode: response.status,
      message: 'Destination is reachable'
    };

  } catch (error) {
    return {
      destinationId: destination.id,
      destinationName: destination.name,
      destinationUrl: destination.url,
      success: false,
      error: error.message,
      message: 'Destination is not reachable'
    };
  }
};

module.exports = {
  redistributeWebhook,
  sendToDestination,
  testDestination
};
