/**
 * Database Models for PostgreSQL
 * 
 * Este módulo fornece funções para interagir com o banco PostgreSQL
 * Migrado do SQLite para PostgreSQL
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const { query } = require('./postgres');

/**
 * ==========================================
 * ENDPOINTS MANAGEMENT
 * ==========================================
 */

/**
 * Get all endpoints
 */
async function getAllEndpoints() {
  const result = await query(
    'SELECT id, nome as name, slug, descricao as description, ativo as active, criado_em as created_at FROM redirecionamentos ORDER BY criado_em DESC'
  );
  return result.rows;
}

/**
 * Get endpoint by ID
 */
async function getEndpointById(id) {
  const result = await query(
    'SELECT id, nome as name, slug, descricao as description, ativo as active, criado_em as created_at FROM redirecionamentos WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Endpoint not found');
  }
  
  return result.rows[0];
}

/**
 * Get endpoint by slug
 */
async function getEndpointBySlug(slug) {
  const result = await query(
    'SELECT id, nome as name, slug, descricao as description, ativo as active, criado_em as created_at FROM redirecionamentos WHERE slug = $1',
    [slug]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Endpoint not found');
  }
  
  return result.rows[0];
}

/**
 * Create new endpoint
 */
async function createEndpoint(name, slug, description) {
  const result = await query(
    `INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo, criado_em) 
     VALUES ($1, $2, $3, '', true, CURRENT_TIMESTAMP) 
     RETURNING id, nome as name, slug, descricao as description, ativo as active, criado_em as created_at`,
    [name, slug, description || '']
  );
  
  return result.rows[0];
}

/**
 * Update endpoint
 */
async function updateEndpoint(id, name, slug, description, active) {
  const result = await query(
    `UPDATE redirecionamentos 
     SET nome = $2, slug = $3, descricao = $4, ativo = $5, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $1 
     RETURNING id, nome as name, slug, descricao as description, ativo as active, criado_em as created_at`,
    [id, name, slug, description, active]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Endpoint not found');
  }
  
  return result.rows[0];
}

/**
 * Delete endpoint
 */
async function deleteEndpoint(id) {
  const result = await query(
    'DELETE FROM redirecionamentos WHERE id = $1 RETURNING id',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Endpoint not found');
  }
  
  return result.rows[0];
}

/**
 * ==========================================
 * DESTINATIONS MANAGEMENT
 * ==========================================
 */

/**
 * Get all destinations (from redirecionamento_destinos)
 */
async function getAllDestinations() {
  const result = await query(`
    SELECT 
      rd.id,
      rd.nome as name,
      rd.url,
      rd.ativo as active,
      rd.ordem as order_index,
      rd.timeout,
      rd.max_tentativas as max_retries,
      rd.redirecionamento_id as webhook_endpoint_id,
      rd.criado_em as created_at,
      r.nome as endpoint_name,
      r.slug as endpoint_slug
    FROM redirecionamento_destinos rd
    LEFT JOIN redirecionamentos r ON rd.redirecionamento_id = r.id
    ORDER BY rd.ordem ASC, rd.criado_em DESC
  `);
  
  return result.rows;
}

/**
 * Get active destinations
 */
async function getActiveDestinations() {
  const result = await query(`
    SELECT 
      rd.id,
      rd.nome as name,
      rd.url,
      rd.ativo as active,
      rd.ordem as order_index,
      rd.timeout,
      rd.max_tentativas as max_retries,
      rd.redirecionamento_id as webhook_endpoint_id,
      rd.criado_em as created_at,
      r.nome as endpoint_name,
      r.slug as endpoint_slug
    FROM redirecionamento_destinos rd
    LEFT JOIN redirecionamentos r ON rd.redirecionamento_id = r.id
    WHERE rd.ativo = true
    ORDER BY rd.ordem ASC, rd.criado_em DESC
  `);
  
  return result.rows;
}

/**
 * Get destinations by endpoint ID
 */
async function getDestinationsByEndpoint(endpointId) {
  const result = await query(`
    SELECT 
      rd.id,
      rd.nome as name,
      rd.url,
      rd.ativo as active,
      rd.ordem as order_index,
      rd.timeout,
      rd.max_tentativas as max_retries,
      rd.redirecionamento_id as webhook_endpoint_id,
      rd.criado_em as created_at
    FROM redirecionamento_destinos rd
    WHERE rd.redirecionamento_id = $1
    ORDER BY rd.ordem ASC, rd.criado_em DESC
  `, [endpointId]);
  
  return result.rows;
}

/**
 * Get active destinations by endpoint ID
 */
async function getActiveDestinationsByEndpoint(endpointId) {
  const result = await query(`
    SELECT 
      rd.id,
      rd.nome as name,
      rd.url,
      rd.ativo as active,
      rd.ordem as order_index,
      rd.timeout,
      rd.max_tentativas as max_retries,
      rd.redirecionamento_id as webhook_endpoint_id,
      rd.criado_em as created_at
    FROM redirecionamento_destinos rd
    WHERE rd.redirecionamento_id = $1 AND rd.ativo = true
    ORDER BY rd.ordem ASC, rd.criado_em DESC
  `, [endpointId]);
  
  return result.rows;
}

/**
 * Get destination by ID
 */
async function getDestinationById(id) {
  const result = await query(`
    SELECT 
      rd.id,
      rd.nome as name,
      rd.url,
      rd.ativo as active,
      rd.ordem as order_index,
      rd.timeout,
      rd.max_tentativas as max_retries,
      rd.redirecionamento_id as webhook_endpoint_id,
      rd.criado_em as created_at
    FROM redirecionamento_destinos rd
    WHERE rd.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    throw new Error('Destination not found');
  }
  
  return result.rows[0];
}

/**
 * Create new destination
 */
async function createDestination(name, url, webhook_endpoint_id) {
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error('Invalid URL format');
  }
  
  // Get the highest order for this endpoint
  let order = 0;
  if (webhook_endpoint_id) {
    const orderResult = await query(
      'SELECT COALESCE(MAX(ordem), -1) + 1 as next_order FROM redirecionamento_destinos WHERE redirecionamento_id = $1',
      [webhook_endpoint_id]
    );
    order = orderResult.rows[0].next_order;
  }
  
  const result = await query(`
    INSERT INTO redirecionamento_destinos 
    (redirecionamento_id, nome, url, ativo, ordem, timeout, max_tentativas, criado_em) 
    VALUES ($1, $2, $3, true, $4, 5000, 3, CURRENT_TIMESTAMP) 
    RETURNING 
      id,
      nome as name,
      url,
      ativo as active,
      ordem as order_index,
      timeout,
      max_tentativas as max_retries,
      redirecionamento_id as webhook_endpoint_id,
      criado_em as created_at
  `, [webhook_endpoint_id, name, url, order]);
  
  return result.rows[0];
}

/**
 * Update destination
 */
async function updateDestination(id, updateData) {
  // Validate URL if provided
  if (updateData.url) {
    try {
      new URL(updateData.url);
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }
  
  const fields = [];
  const values = [id];
  let paramCounter = 2;
  
  if (updateData.name !== undefined) {
    fields.push(`nome = $${paramCounter}`);
    values.push(updateData.name);
    paramCounter++;
  }
  
  if (updateData.url !== undefined) {
    fields.push(`url = $${paramCounter}`);
    values.push(updateData.url);
    paramCounter++;
  }
  
  if (updateData.active !== undefined) {
    fields.push(`ativo = $${paramCounter}`);
    values.push(updateData.active);
    paramCounter++;
  }
  
  if (updateData.webhook_endpoint_id !== undefined) {
    fields.push(`redirecionamento_id = $${paramCounter}`);
    values.push(updateData.webhook_endpoint_id);
    paramCounter++;
  }
  
  if (fields.length === 0) {
    throw new Error('No data provided for update');
  }
  
  fields.push('atualizado_em = CURRENT_TIMESTAMP');
  
  const result = await query(`
    UPDATE redirecionamento_destinos 
    SET ${fields.join(', ')}
    WHERE id = $1 
    RETURNING 
      id,
      nome as name,
      url,
      ativo as active,
      ordem as order_index,
      timeout,
      max_tentativas as max_retries,
      redirecionamento_id as webhook_endpoint_id,
      criado_em as created_at
  `, values);
  
  if (result.rows.length === 0) {
    throw new Error('Destination not found');
  }
  
  return result.rows[0];
}

/**
 * Delete destination
 */
async function deleteDestination(id) {
  const result = await query(
    'DELETE FROM redirecionamento_destinos WHERE id = $1 RETURNING id',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Destination not found');
  }
  
  return result.rows[0];
}

module.exports = {
  // Endpoints
  getAllEndpoints,
  getEndpointById,
  getEndpointBySlug,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  
  // Destinations
  getAllDestinations,
  getActiveDestinations,
  getDestinationsByEndpoint,
  getActiveDestinationsByEndpoint,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination
};
