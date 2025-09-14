const express = require('express');
const router = express.Router();
const {
  getAllDestinations,
  getActiveDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  getDestinationById,
  getAllEndpoints,
  getEndpointById
} = require('../database/models');

// GET /api/destinations - Get all destinations
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    let destinations;
    if (active === 'true') {
      destinations = await getActiveDestinations();
    } else {
      destinations = await getAllDestinations();
    }

    // Get all endpoints to map endpoint information
    const endpoints = await getAllEndpoints();
    const endpointMap = new Map(endpoints.map(ep => [ep.id, ep]));

    // Add endpoint information to each destination
    const destinationsWithEndpoints = destinations.map(dest => {
      const endpoint = dest.webhook_endpoint_id ? endpointMap.get(dest.webhook_endpoint_id) : null;
      return {
        ...dest,
        endpoint: endpoint ? {
          id: endpoint.id,
          name: endpoint.name,
          slug: endpoint.slug,
          description: endpoint.description,
          active: endpoint.active
        } : {
          id: null,
          name: 'Default',
          slug: 'default',
          description: 'Default endpoint for general webhooks',
          active: true
        }
      };
    });

    res.json({
      success: true,
      data: destinationsWithEndpoints,
      count: destinationsWithEndpoints.length
    });

  } catch (error) {
    console.error('Error getting destinations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving destinations',
      error: error.message
    });
  }
});

// GET /api/destinations/:id - Get destination by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await getDestinationById(parseInt(id));

    // Get endpoint information
    let endpoint = null;
    if (destination.webhook_endpoint_id) {
      try {
        endpoint = await getEndpointById(destination.webhook_endpoint_id);
      } catch (error) {
        console.warn('Endpoint not found for destination:', destination.webhook_endpoint_id);
      }
    }

    const destinationWithEndpoint = {
      ...destination,
      endpoint: endpoint ? {
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: endpoint.active
      } : {
        id: null,
        name: 'Default',
        slug: 'default',
        description: 'Default endpoint for general webhooks',
        active: true
      }
    };

    res.json({
      success: true,
      data: destinationWithEndpoint
    });

  } catch (error) {
    console.error('Error getting destination:', error);
    const statusCode = error.message === 'Destination not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/destinations - Create new destination
router.post('/', async (req, res) => {
  try {
    const { name, url, webhook_endpoint_id } = req.body;

    // Validate required fields
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Name and URL are required'
      });
    }

    // Validate webhook_endpoint_id if provided
    if (webhook_endpoint_id !== undefined && webhook_endpoint_id !== null) {
      if (isNaN(webhook_endpoint_id)) {
        return res.status(400).json({
          success: false,
          message: 'webhook_endpoint_id must be a number'
        });
      }

      // Check if endpoint exists
      try {
        await getEndpointById(webhook_endpoint_id);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook_endpoint_id: endpoint not found'
        });
      }
    }

    const destination = await createDestination(name, url, webhook_endpoint_id);

    // Get endpoint information for response
    let endpoint = null;
    if (destination.webhook_endpoint_id) {
      try {
        endpoint = await getEndpointById(destination.webhook_endpoint_id);
      } catch (error) {
        console.warn('Endpoint not found for new destination:', destination.webhook_endpoint_id);
      }
    }

    const destinationWithEndpoint = {
      ...destination,
      endpoint: endpoint ? {
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: endpoint.active
      } : {
        id: null,
        name: 'Default',
        slug: 'default',
        description: 'Default endpoint for general webhooks',
        active: true
      }
    };

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destinationWithEndpoint
    });

  } catch (error) {
    console.error('Error creating destination:', error);
    const statusCode = error.message.includes('Invalid URL') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/destinations/:id - Update destination
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, active, webhook_endpoint_id } = req.body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid destination ID is required'
      });
    }

    // Check if there's data to update
    if (!name && !url && active === undefined && webhook_endpoint_id === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No data provided for update'
      });
    }

    // Validate webhook_endpoint_id if provided
    if (webhook_endpoint_id !== undefined && webhook_endpoint_id !== null) {
      if (isNaN(webhook_endpoint_id)) {
        return res.status(400).json({
          success: false,
          message: 'webhook_endpoint_id must be a number'
        });
      }

      // Check if endpoint exists
      try {
        await getEndpointById(webhook_endpoint_id);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook_endpoint_id: endpoint not found'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (active !== undefined) updateData.active = active;
    if (webhook_endpoint_id !== undefined) updateData.webhook_endpoint_id = webhook_endpoint_id;

    const result = await updateDestination(parseInt(id), updateData);

    // Get endpoint information for response
    let endpoint = null;
    if (result.webhook_endpoint_id) {
      try {
        endpoint = await getEndpointById(result.webhook_endpoint_id);
      } catch (error) {
        console.warn('Endpoint not found for updated destination:', result.webhook_endpoint_id);
      }
    }

    const destinationWithEndpoint = {
      ...result,
      endpoint: endpoint ? {
        id: endpoint.id,
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: endpoint.active
      } : {
        id: null,
        name: 'Default',
        slug: 'default',
        description: 'Default endpoint for general webhooks',
        active: true
      }
    };

    res.json({
      success: true,
      message: 'Destination updated successfully',
      data: destinationWithEndpoint
    });

  } catch (error) {
    console.error('Error updating destination:', error);
    const statusCode = error.message === 'Destination not found' ? 404 : 
                      error.message.includes('Invalid URL') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/destinations/:id - Delete destination
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid destination ID is required'
      });
    }

    const result = await deleteDestination(parseInt(id));

    res.json({
      success: true,
      message: 'Destination deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Error deleting destination:', error);
    const statusCode = error.message === 'Destination not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
