/**
 * Export/Import Configuration Routes
 * 
 * This module provides endpoints for backing up and restoring
 * the entire webhook redistributor configuration:
 * - Export all endpoints and destinations
 * - Import configuration from backup
 * - Validate configuration before import
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const models = require('../database/models');
const { generateUsageReport } = require('../utils/endpointUsage');

/**
 * GET /api/export/config - Export complete configuration
 * @query {boolean} includeStats - Include usage statistics (default: false)
 * @query {boolean} includeLogs - Include recent logs (default: false)
 */
router.get('/config', async (req, res) => {
  try {
    const includeStats = req.query.includeStats === 'true';
    const includeLogs = req.query.includeLogs === 'true';
    
    console.log('📤 Exporting configuration...');
    
    // Get all endpoints
    const endpoints = await models.getAllEndpoints();
    console.log(`✅ Found ${endpoints.length} endpoints`);
    
    // Get all destinations with their endpoint information
    const destinations = await models.getAllDestinations();
    console.log(`✅ Found ${destinations.length} destinations`);
    
    // Build export data
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        totalEndpoints: endpoints.length,
        totalDestinations: destinations.length,
        includeStats,
        includeLogs
      },
      endpoints: endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: endpoint.active,
        created_at: endpoint.created_at
      })),
      destinations: destinations.map(destination => ({
        id: destination.id,
        name: destination.name,
        url: destination.url,
        active: destination.active,
        webhook_endpoint_id: destination.webhook_endpoint_id,
        created_at: destination.created_at
      }))
    };
    
    // Add usage statistics if requested
    if (includeStats) {
      try {
        const usageReport = await generateUsageReport();
        exportData.usageStats = usageReport;
        console.log('✅ Added usage statistics');
      } catch (error) {
        console.warn('⚠️ Could not include usage statistics:', error.message);
        exportData.usageStats = { error: 'Could not generate usage statistics' };
      }
    }
    
    // Add recent logs if requested
    if (includeLogs) {
      try {
        const { getRecentWebhookLogs } = require('../database/logs');
        const logs = await getRecentWebhookLogs(100); // Last 100 logs
        exportData.recentLogs = logs;
        console.log(`✅ Added ${logs.length} recent logs`);
      } catch (error) {
        console.warn('⚠️ Could not include logs:', error.message);
        exportData.recentLogs = { error: 'Could not retrieve logs' };
      }
    }
    
    console.log('✅ Configuration export completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Configuration exported successfully',
      data: exportData,
      downloadUrl: `/api/export/download/${Date.now()}`
    });
    
  } catch (error) {
    console.error('❌ Error exporting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting configuration',
      error: error.message
    });
  }
});

/**
 * GET /api/export/download/:timestamp - Download configuration as file
 */
router.get('/download/:timestamp', async (req, res) => {
  try {
    const timestamp = req.params.timestamp;
    
    // Re-export the configuration
    const endpoints = await models.getAllEndpoints();
    const destinations = await models.getAllDestinations();
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        totalEndpoints: endpoints.length,
        totalDestinations: destinations.length
      },
      endpoints: endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: endpoint.active,
        created_at: endpoint.created_at
      })),
      destinations: destinations.map(destination => ({
        id: destination.id,
        name: destination.name,
        url: destination.url,
        active: destination.active,
        webhook_endpoint_id: destination.webhook_endpoint_id,
        created_at: destination.created_at
      }))
    };
    
    const filename = `webhook-config-${timestamp}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(exportData);
    
  } catch (error) {
    console.error('❌ Error downloading configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading configuration',
      error: error.message
    });
  }
});

/**
 * POST /api/import/config - Import configuration from backup
 */
router.post('/config', async (req, res) => {
  try {
    const { config, options = {} } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration data is required'
      });
    }
    
    const {
      overwriteExisting = false,
      skipInactive = false,
      validateUrls = true
    } = options;
    
    console.log('📥 Importing configuration...');
    console.log(`Options: overwrite=${overwriteExisting}, skipInactive=${skipInactive}, validateUrls=${validateUrls}`);
    
    const results = {
      endpoints: { created: 0, updated: 0, skipped: 0, errors: [] },
      destinations: { created: 0, updated: 0, skipped: 0, errors: [] }
    };
    
    // Import endpoints
    if (config.endpoints && Array.isArray(config.endpoints)) {
      console.log(`📋 Processing ${config.endpoints.length} endpoints...`);
      
      for (const endpointData of config.endpoints) {
        try {
          // Skip inactive endpoints if option is set
          if (skipInactive && !endpointData.active) {
            results.endpoints.skipped++;
            continue;
          }
          
          // Check if endpoint already exists
          const existingEndpoint = await models.getEndpointBySlug(endpointData.slug);
          
          if (existingEndpoint) {
            if (overwriteExisting) {
              await models.updateEndpoint(
                existingEndpoint.id,
                endpointData.name,
                endpointData.slug,
                endpointData.description,
                endpointData.active
              );
              results.endpoints.updated++;
              console.log(`✅ Updated endpoint: ${endpointData.name}`);
            } else {
              results.endpoints.skipped++;
              console.log(`⏭️ Skipped existing endpoint: ${endpointData.name}`);
            }
          } else {
            await models.createEndpoint(
              endpointData.name,
              endpointData.slug,
              endpointData.description
            );
            results.endpoints.created++;
            console.log(`✅ Created endpoint: ${endpointData.name}`);
          }
        } catch (error) {
          results.endpoints.errors.push({
            endpoint: endpointData.name,
            error: error.message
          });
          console.error(`❌ Error processing endpoint ${endpointData.name}:`, error.message);
        }
      }
    }
    
    // Import destinations
    if (config.destinations && Array.isArray(config.destinations)) {
      console.log(`📋 Processing ${config.destinations.length} destinations...`);
      
      for (const destinationData of config.destinations) {
        try {
          // Skip inactive destinations if option is set
          if (skipInactive && !destinationData.active) {
            results.destinations.skipped++;
            continue;
          }
          
          // Validate URL if option is set
          if (validateUrls && destinationData.url) {
            try {
              new URL(destinationData.url);
            } catch (urlError) {
              results.destinations.errors.push({
                destination: destinationData.name,
                error: `Invalid URL: ${destinationData.url}`
              });
              continue;
            }
          }
          
          // Check if destination already exists (by URL)
          const existingDestinations = await models.getAllDestinations();
          const existingDestination = existingDestinations.find(d => d.url === destinationData.url);
          
          if (existingDestination) {
            if (overwriteExisting) {
              await models.updateDestination(
                existingDestination.id,
                destinationData.name,
                destinationData.url,
                destinationData.active,
                destinationData.webhook_endpoint_id
              );
              results.destinations.updated++;
              console.log(`✅ Updated destination: ${destinationData.name}`);
            } else {
              results.destinations.skipped++;
              console.log(`⏭️ Skipped existing destination: ${destinationData.name}`);
            }
          } else {
            await models.createDestination(
              destinationData.name,
              destinationData.url,
              destinationData.active,
              destinationData.webhook_endpoint_id
            );
            results.destinations.created++;
            console.log(`✅ Created destination: ${destinationData.name}`);
          }
        } catch (error) {
          results.destinations.errors.push({
            destination: destinationData.name,
            error: error.message
          });
          console.error(`❌ Error processing destination ${destinationData.name}:`, error.message);
        }
      }
    }
    
    const totalProcessed = 
      results.endpoints.created + results.endpoints.updated + results.endpoints.skipped +
      results.destinations.created + results.destinations.updated + results.destinations.skipped;
    
    const totalErrors = results.endpoints.errors.length + results.destinations.errors.length;
    
    console.log(`✅ Import completed: ${totalProcessed} items processed, ${totalErrors} errors`);
    
    res.status(200).json({
      success: true,
      message: 'Configuration imported successfully',
      results,
      summary: {
        totalProcessed,
        totalErrors,
        endpointsProcessed: results.endpoints.created + results.endpoints.updated + results.endpoints.skipped,
        destinationsProcessed: results.destinations.created + results.destinations.updated + results.destinations.skipped
      }
    });
    
  } catch (error) {
    console.error('❌ Error importing configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing configuration',
      error: error.message
    });
  }
});

/**
 * GET /api/export/validate - Validate configuration data
 */
router.post('/validate', async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration data is required'
      });
    }
    
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      summary: {
        endpoints: 0,
        destinations: 0
      }
    };
    
    // Validate endpoints
    if (config.endpoints && Array.isArray(config.endpoints)) {
      validation.summary.endpoints = config.endpoints.length;
      
      for (let i = 0; i < config.endpoints.length; i++) {
        const endpoint = config.endpoints[i];
        
        if (!endpoint.name || typeof endpoint.name !== 'string') {
          validation.errors.push(`Endpoint ${i + 1}: Name is required and must be a string`);
          validation.valid = false;
        }
        
        if (!endpoint.slug || typeof endpoint.slug !== 'string') {
          validation.errors.push(`Endpoint ${i + 1}: Slug is required and must be a string`);
          validation.valid = false;
        } else if (!/^[a-z0-9-]+$/.test(endpoint.slug)) {
          validation.errors.push(`Endpoint ${i + 1}: Slug must contain only lowercase letters, numbers, and hyphens`);
          validation.valid = false;
        }
        
        if (endpoint.active === undefined) {
          validation.warnings.push(`Endpoint ${i + 1}: Active status not specified, will default to true`);
        }
      }
    }
    
    // Validate destinations
    if (config.destinations && Array.isArray(config.destinations)) {
      validation.summary.destinations = config.destinations.length;
      
      for (let i = 0; i < config.destinations.length; i++) {
        const destination = config.destinations[i];
        
        if (!destination.name || typeof destination.name !== 'string') {
          validation.errors.push(`Destination ${i + 1}: Name is required and must be a string`);
          validation.valid = false;
        }
        
        if (!destination.url || typeof destination.url !== 'string') {
          validation.errors.push(`Destination ${i + 1}: URL is required and must be a string`);
          validation.valid = false;
        } else {
          try {
            new URL(destination.url);
          } catch (urlError) {
            validation.errors.push(`Destination ${i + 1}: Invalid URL format`);
            validation.valid = false;
          }
        }
        
        if (destination.webhook_endpoint_id && typeof destination.webhook_endpoint_id !== 'number') {
          validation.warnings.push(`Destination ${i + 1}: webhook_endpoint_id should be a number`);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Configuration validation completed',
      validation
    });
    
  } catch (error) {
    console.error('❌ Error validating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating configuration',
      error: error.message
    });
  }
});

module.exports = router;
