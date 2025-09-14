const { db } = require('./init');

// Get all destinations
const getAllDestinations = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM destinations ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error getting all destinations:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get active destinations only
const getActiveDestinations = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM destinations WHERE active = 1 ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error getting active destinations:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Create a new destination
const createDestination = (name, url, webhook_endpoint_id = null) => {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!name || !url) {
      reject(new Error('Name and URL are required'));
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      reject(new Error('Invalid URL format'));
      return;
    }

    const query = 'INSERT INTO destinations (name, url, webhook_endpoint_id) VALUES (?, ?, ?)';
    
    db.run(query, [name, url, webhook_endpoint_id], function(err) {
      if (err) {
        console.error('Error creating destination:', err.message);
        reject(err);
      } else {
        console.log(`Destination created with ID: ${this.lastID}`);
        resolve({
          id: this.lastID,
          name,
          url,
          webhook_endpoint_id,
          active: 1,
          created_at: new Date().toISOString()
        });
      }
    });
  });
};

// Update a destination
const updateDestination = (id, data) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject(new Error('Destination ID is required'));
      return;
    }

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.url !== undefined) {
      // Validate URL if provided
      try {
        new URL(data.url);
        fields.push('url = ?');
        values.push(data.url);
      } catch (error) {
        reject(new Error('Invalid URL format'));
        return;
      }
    }

    if (data.active !== undefined) {
      fields.push('active = ?');
      values.push(data.active ? 1 : 0);
    }

    if (fields.length === 0) {
      reject(new Error('No fields to update'));
      return;
    }

    values.push(id);
    const query = `UPDATE destinations SET ${fields.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        console.error('Error updating destination:', err.message);
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Destination not found'));
      } else {
        console.log(`Destination ${id} updated successfully`);
        resolve({ id, ...data, changes: this.changes });
      }
    });
  });
};

// Delete a destination
const deleteDestination = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject(new Error('Destination ID is required'));
      return;
    }

    const query = 'DELETE FROM destinations WHERE id = ?';

    db.run(query, [id], function(err) {
      if (err) {
        console.error('Error deleting destination:', err.message);
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Destination not found'));
      } else {
        console.log(`Destination ${id} deleted successfully`);
        resolve({ id, changes: this.changes });
      }
    });
  });
};

// Get destination by ID
const getDestinationById = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject(new Error('Destination ID is required'));
      return;
    }

    const query = 'SELECT * FROM destinations WHERE id = ?';

    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Error getting destination by ID:', err.message);
        reject(err);
      } else if (!row) {
        reject(new Error('Destination not found'));
      } else {
        resolve(row);
      }
    });
  });
};

// ===== WEBHOOK ENDPOINTS FUNCTIONS =====

// Get all webhook endpoints
const getAllEndpoints = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM webhook_endpoints ORDER BY created_at ASC';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error getting all endpoints:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get endpoint by slug
const getEndpointBySlug = (slug) => {
  return new Promise((resolve, reject) => {
    if (!slug) {
      reject(new Error('Endpoint slug is required'));
      return;
    }

    const query = 'SELECT * FROM webhook_endpoints WHERE slug = ?';
    
    db.get(query, [slug], (err, row) => {
      if (err) {
        console.error('Error getting endpoint by slug:', err.message);
        reject(err);
      } else if (!row) {
        reject(new Error('Endpoint not found'));
      } else {
        resolve(row);
      }
    });
  });
};

// Create a new webhook endpoint
const createEndpoint = (name, slug, description = null) => {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!name || !slug) {
      reject(new Error('Name and slug are required'));
      return;
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      reject(new Error('Slug must contain only lowercase letters, numbers, and hyphens'));
      return;
    }

    const query = 'INSERT INTO webhook_endpoints (name, slug, description) VALUES (?, ?, ?)';
    
    db.run(query, [name, slug, description], function(err) {
      if (err) {
        console.error('Error creating endpoint:', err.message);
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          reject(new Error('Endpoint slug already exists'));
        } else {
          reject(err);
        }
      } else {
        console.log(`Endpoint created with ID: ${this.lastID}`);
        resolve({
          id: this.lastID,
          name,
          slug,
          description,
          active: 1,
          created_at: new Date().toISOString()
        });
      }
    });
  });
};

// Get destinations by endpoint ID
const getDestinationsByEndpoint = (endpointId) => {
  return new Promise((resolve, reject) => {
    if (!endpointId) {
      reject(new Error('Endpoint ID is required'));
      return;
    }

    const query = 'SELECT * FROM destinations WHERE webhook_endpoint_id = ? ORDER BY created_at DESC';
    
    db.all(query, [endpointId], (err, rows) => {
      if (err) {
        console.error('Error getting destinations by endpoint:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get active destinations by endpoint ID
const getActiveDestinationsByEndpoint = (endpointId) => {
  return new Promise((resolve, reject) => {
    if (!endpointId) {
      reject(new Error('Endpoint ID is required'));
      return;
    }

    const query = 'SELECT * FROM destinations WHERE webhook_endpoint_id = ? AND active = 1 ORDER BY created_at DESC';
    
    db.all(query, [endpointId], (err, rows) => {
      if (err) {
        console.error('Error getting active destinations by endpoint:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get destinations for default endpoint (webhook_endpoint_id IS NULL)
const getDefaultDestinations = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM destinations WHERE webhook_endpoint_id IS NULL ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error getting default destinations:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get active destinations for default endpoint
const getActiveDefaultDestinations = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM destinations WHERE webhook_endpoint_id IS NULL AND active = 1 ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error getting active default destinations:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Update a webhook endpoint
const updateEndpoint = (id, name, slug, description, active) => {
  return new Promise((resolve, reject) => {
    if (!id || !name || !slug) {
      reject(new Error('ID, name and slug are required'));
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      reject(new Error('Slug must contain only lowercase letters, numbers, and hyphens'));
      return;
    }

    const query = `
      UPDATE webhook_endpoints 
      SET name = ?, slug = ?, description = ?, active = ?
      WHERE id = ?
    `;
    
    db.run(query, [name, slug, description, active ? 1 : 0, id], function(err) {
      if (err) {
        console.error('Error updating endpoint:', err.message);
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          reject(new Error('Endpoint slug already exists'));
        } else {
          reject(err);
        }
      } else if (this.changes === 0) {
        reject(new Error('Endpoint not found'));
      } else {
        console.log(`Endpoint ${id} updated successfully`);
        resolve({
          id: id,
          name,
          slug,
          description,
          active: active ? 1 : 0,
          updated_at: new Date().toISOString()
        });
      }
    });
  });
};

// Delete a webhook endpoint
const deleteEndpoint = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject(new Error('Endpoint ID is required'));
      return;
    }

    const query = 'DELETE FROM webhook_endpoints WHERE id = ?';
    
    db.run(query, [id], function(err) {
      if (err) {
        console.error('Error deleting endpoint:', err.message);
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Endpoint not found'));
      } else {
        console.log(`Endpoint ${id} deleted successfully`);
        resolve({
          id: id,
          deleted: true,
          deleted_at: new Date().toISOString()
        });
      }
    });
  });
};

// Get endpoint by ID
const getEndpointById = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject(new Error('Endpoint ID is required'));
      return;
    }

    const query = 'SELECT * FROM webhook_endpoints WHERE id = ?';
    
    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Error getting endpoint by ID:', err.message);
        reject(err);
      } else if (!row) {
        reject(new Error('Endpoint not found'));
      } else {
        resolve(row);
      }
    });
  });
};

module.exports = {
  // Destination functions
  getAllDestinations,
  getActiveDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  getDestinationById,
  
  // Endpoint functions
  getAllEndpoints,
  getEndpointById,
  getEndpointBySlug,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  getDestinationsByEndpoint,
  getActiveDestinationsByEndpoint,
  getDefaultDestinations,
  getActiveDefaultDestinations
};
