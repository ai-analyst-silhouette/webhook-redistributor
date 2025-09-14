/**
 * Endpoints Routes
 * 
 * This module provides CRUD operations for webhook endpoints:
 * - List all endpoints
 * - Create new endpoint
 * - Update existing endpoint
 * - Delete endpoint
 * - Get destinations for specific endpoint
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const models = require('../database/models');
const { slugify, isValidSlug, generateUniqueSlug, sanitizeSlug } = require('../utils/slugify');

/**
 * GET /api/endpoints - List all endpoints
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all endpoints');
    
    const endpoints = await models.getAllEndpoints();
    
    // Get destination counts for each endpoint
    const endpointsWithStats = await Promise.all(
      endpoints.map(async (endpoint) => {
        const destinations = await models.getDestinationsByEndpoint(endpoint.id);
        const activeDestinations = await models.getActiveDestinationsByEndpoint(endpoint.id);
        
        return {
          ...endpoint,
          destinations: {
            total: destinations.length,
            active: activeDestinations.length,
            inactive: destinations.length - activeDestinations.length
          }
        };
      })
    );

    console.log(`✅ Found ${endpointsWithStats.length} endpoints`);
    
    res.json({
      success: true,
      data: endpointsWithStats,
      count: endpointsWithStats.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching endpoints:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching endpoints',
      error: error.message
    });
  }
});

/**
 * GET /api/endpoints/:id - Get specific endpoint by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const endpointId = parseInt(id);

    if (isNaN(endpointId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endpoint ID',
        error: 'Endpoint ID must be a number'
      });
    }

    console.log(`🔍 Fetching endpoint with ID: ${endpointId}`);
    
    const endpoints = await models.getAllEndpoints();
    const endpoint = endpoints.find(ep => ep.id === endpointId);
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: `No endpoint found with ID: ${endpointId}`
      });
    }

    // Get destination stats
    const destinations = await models.getDestinationsByEndpoint(endpointId);
    const activeDestinations = await models.getActiveDestinationsByEndpoint(endpointId);
    
    const endpointWithStats = {
      ...endpoint,
      destinations: {
        total: destinations.length,
        active: activeDestinations.length,
        inactive: destinations.length - activeDestinations.length
      }
    };

    console.log(`✅ Found endpoint: ${endpoint.name} (${endpoint.slug})`);
    
    res.json({
      success: true,
      data: endpointWithStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching endpoint',
      error: error.message
    });
  }
});

/**
 * POST /api/endpoints - Create new endpoint
 */
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, active = true } = req.body;

    console.log(`➕ Creating new endpoint: ${name}`);

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
        error: 'Endpoint name cannot be empty'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name too long',
        error: 'Endpoint name must be 100 characters or less'
      });
    }

    // Generate or validate slug
    let finalSlug;
    if (slug && typeof slug === 'string' && slug.trim().length > 0) {
      // Use provided slug, but sanitize it
      finalSlug = sanitizeSlug(slug.trim());
      
      if (!isValidSlug(finalSlug)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid slug format',
          error: 'Slug must contain only lowercase letters, numbers, and hyphens'
        });
      }
    } else {
      // Generate slug from name
      finalSlug = slugify(name.trim());
    }

    // Check if slug already exists
    const checkSlugExists = async (slugToCheck) => {
      try {
        const existingEndpoint = await models.getEndpointBySlug(slugToCheck);
        return !!existingEndpoint;
      } catch (error) {
        // If endpoint not found, slug is available
        return false;
      }
    };

    const slugExists = await checkSlugExists(finalSlug);
    if (slugExists) {
      // Try to generate unique slug
      try {
        finalSlug = await generateUniqueSlug(name.trim(), checkSlugExists);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Unable to generate unique slug',
          error: error.message
        });
      }
    }

    // Validate description length
    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description too long',
        error: 'Description must be 500 characters or less'
      });
    }

    // Create endpoint
    const newEndpoint = await models.createEndpoint(
      name.trim(),
      finalSlug,
      description ? description.trim() : null
    );

    console.log(`✅ Endpoint created: ${newEndpoint.name} (${newEndpoint.slug}) with ID: ${newEndpoint.id}`);

    res.status(201).json({
      success: true,
      message: 'Endpoint created successfully',
      data: newEndpoint,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating endpoint:', error);
    
    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        message: 'Endpoint slug already exists',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating endpoint',
        error: error.message
      });
    }
  }
});

/**
 * PUT /api/endpoints/:id - Update endpoint
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, active } = req.body;
    const endpointId = parseInt(id);

    if (isNaN(endpointId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endpoint ID',
        error: 'Endpoint ID must be a number'
      });
    }

    console.log(`🔄 Updating endpoint with ID: ${endpointId}`);

    // Get existing endpoint
    const endpoints = await models.getAllEndpoints();
    const existingEndpoint = endpoints.find(ep => ep.id === endpointId);
    
    if (!existingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: `No endpoint found with ID: ${endpointId}`
      });
    }

    // Validation
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty',
          error: 'Endpoint name is required'
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Name too long',
          error: 'Endpoint name must be 100 characters or less'
        });
      }
    }

    // Handle slug update
    let finalSlug = existingEndpoint.slug;
    if (slug !== undefined) {
      if (slug && typeof slug === 'string' && slug.trim().length > 0) {
        finalSlug = sanitizeSlug(slug.trim());
        
        if (!isValidSlug(finalSlug)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid slug format',
            error: 'Slug must contain only lowercase letters, numbers, and hyphens'
          });
        }
      } else if (name !== undefined) {
        // Generate slug from name if slug is empty
        finalSlug = slugify(name.trim());
      }

      // Check if new slug conflicts with existing endpoints (excluding current)
      if (finalSlug !== existingEndpoint.slug) {
        const checkSlugExists = async (slugToCheck) => {
          try {
            const existingEndpoint = await models.getEndpointBySlug(slugToCheck);
            return existingEndpoint && existingEndpoint.id !== endpointId;
          } catch (error) {
            return false;
          }
        };

        const slugExists = await checkSlugExists(finalSlug);
        if (slugExists) {
          // Try to generate unique slug
          try {
            finalSlug = await generateUniqueSlug(name || existingEndpoint.name, checkSlugExists);
          } catch (error) {
            return res.status(400).json({
              success: false,
              message: 'Unable to generate unique slug',
              error: error.message
            });
          }
        }
      }
    }

    // Validate description length
    if (description !== undefined && description && description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description too long',
        error: 'Description must be 500 characters or less'
      });
    }

    // Update endpoint (we'll need to add this function to models)
    const updatedEndpoint = await models.updateEndpoint(
      endpointId,
      name ? name.trim() : existingEndpoint.name,
      finalSlug,
      description !== undefined ? (description ? description.trim() : null) : existingEndpoint.description,
      active !== undefined ? active : existingEndpoint.active
    );

    console.log(`✅ Endpoint updated: ${updatedEndpoint.name} (${updatedEndpoint.slug})`);

    res.json({
      success: true,
      message: 'Endpoint updated successfully',
      data: updatedEndpoint,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating endpoint:', error);
    
    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        message: 'Endpoint slug already exists',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating endpoint',
        error: error.message
      });
    }
  }
});

/**
 * DELETE /api/endpoints/:id - Delete endpoint
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const endpointId = parseInt(id);

    if (isNaN(endpointId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endpoint ID',
        error: 'Endpoint ID must be a number'
      });
    }

    console.log(`🗑️ Deleting endpoint with ID: ${endpointId}`);

    // Get existing endpoint
    const endpoints = await models.getAllEndpoints();
    const existingEndpoint = endpoints.find(ep => ep.id === endpointId);
    
    if (!existingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: `No endpoint found with ID: ${endpointId}`
      });
    }

    // Check if endpoint has active destinations
    const activeDestinations = await models.getActiveDestinationsByEndpoint(endpointId);
    if (activeDestinations.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete endpoint with active destinations',
        error: `Endpoint has ${activeDestinations.length} active destination(s). Remove or reassign destinations first.`,
        data: {
          endpoint: existingEndpoint,
          activeDestinations: activeDestinations.length
        }
      });
    }

    // Check if it's the default endpoint
    if (existingEndpoint.slug === 'default') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete default endpoint',
        error: 'The default endpoint cannot be deleted'
      });
    }

    // Delete endpoint
    await models.deleteEndpoint(endpointId);

    console.log(`✅ Endpoint deleted: ${existingEndpoint.name} (${existingEndpoint.slug})`);

    res.json({
      success: true,
      message: 'Endpoint deleted successfully',
      data: {
        id: endpointId,
        name: existingEndpoint.name,
        slug: existingEndpoint.slug
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error deleting endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting endpoint',
      error: error.message
    });
  }
});

/**
 * GET /api/endpoints/:slug/destinations - Get destinations for specific endpoint
 */
router.get('/:slug/destinations', async (req, res) => {
  try {
    const { slug } = req.params;

    console.log(`🔍 Fetching destinations for endpoint: ${slug}`);

    // Get endpoint by slug
    const endpoint = await models.getEndpointBySlug(slug);
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: `No endpoint found with slug: ${slug}`
      });
    }

    // Get destinations for this endpoint
    const destinations = await models.getDestinationsByEndpoint(endpoint.id);
    const activeDestinations = await models.getActiveDestinationsByEndpoint(endpoint.id);

    console.log(`✅ Found ${destinations.length} destinations for endpoint: ${endpoint.name}`);

    res.json({
      success: true,
      data: {
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
          slug: endpoint.slug,
          description: endpoint.description,
          active: endpoint.active,
          created_at: endpoint.created_at
        },
        destinations: destinations,
        stats: {
          total: destinations.length,
          active: activeDestinations.length,
          inactive: destinations.length - activeDestinations.length
        }
      },
      count: destinations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching endpoint destinations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching endpoint destinations',
      error: error.message
    });
  }
});

module.exports = router;
