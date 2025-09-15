/**
 * Rotas de Redirecionamentos - PostgreSQL
 * 
 * Este módulo gerencia todos os endpoints relacionados aos redirecionamentos:
 * - CRUD de redirecionamentos
 * - Gerenciamento de URLs de destino
 * - Teste de redirecionamentos
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const { query } = require('../database/postgres');
const messages = require('../config/messages');
const { requirePermission, auditLog } = require('../middleware/permissions');

const router = express.Router();

/**
 * GET /api/redirecionamentos
 * Listar todos os redirecionamentos
 */
router.get('/', requirePermission('visualizar_redirecionamentos'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', ativo = null } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 1;
    
    if (search) {
      whereClause += ` AND (nome ILIKE $${paramCount} OR slug ILIKE $${paramCount + 1} OR descricao ILIKE $${paramCount + 2})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramCount += 3;
    }
    
    if (ativo !== null) {
      whereClause += ` AND ativo = $${paramCount}`;
      params.push(ativo === 'true');
      paramCount++;
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM redirecionamentos ${whereClause}`;
    const countResult = await query(countQuery, params);
    
    // Get redirecionamentos with pagination
    const dataQuery = `
      SELECT 
        id, nome, slug, descricao, urls, ativo, criado_em,
        array_length(string_to_array(urls, ','), 1) as total_urls
      FROM redirecionamentos 
      ${whereClause}
      ORDER BY criado_em DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const queryParams = [...params, limit, offset];
    const dataResult = await query(dataQuery, queryParams);
    
    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar redirecionamentos:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * GET /api/redirecionamentos/:id
 * Buscar redirecionamento por ID
 */
router.get('/:id', requirePermission('visualizar_redirecionamentos'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM redirecionamentos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: messages.ERROR.REDIRECIONAMENTO_NOT_FOUND,
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * POST /api/redirecionamentos
 * Criar novo redirecionamento
 */
router.post('/', requirePermission('criar_redirecionamento'), async (req, res) => {
  try {
    const { nome, slug, descricao, urls, ativo = true } = req.body;
    
    // Validar dados obrigatórios
    if (!nome || !slug || !urls) {
      return res.status(400).json({
        error: messages.ERROR.MISSING_REQUIRED_FIELDS,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Verificar se slug já existe
    const existingSlug = await query(
      'SELECT id FROM redirecionamentos WHERE slug = $1',
      [slug]
    );
    
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({
        error: messages.ERROR.SLUG_ALREADY_EXISTS,
        code: 'DUPLICATE_SLUG'
      });
    }
    
    // Inserir novo redirecionamento
    const result = await query(
      `INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nome, slug, descricao, urls, ativo]
    );
    
    // Log de auditoria
    await auditLog(req.user.id, 'criar_redirecionamento', `Redirecionamento "${nome}" criado`, 'redirecionamento', result.rows[0].id, req.ip, req.get('User-Agent'));
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: messages.SUCCESS.REDIRECIONAMENTO_CREATED
    });
    
  } catch (error) {
    console.error('Erro ao criar redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * PUT /api/redirecionamentos/:id
 * Atualizar redirecionamento
 */
router.put('/:id', requirePermission('editar_redirecionamento'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, slug, descricao, urls, ativo } = req.body;
    
    // Verificar se redirecionamento existe
    const existing = await query(
      'SELECT * FROM redirecionamentos WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: messages.ERROR.REDIRECIONAMENTO_NOT_FOUND,
        code: 'NOT_FOUND'
      });
    }
    
    // Verificar se slug já existe (exceto para o próprio registro)
    if (slug && slug !== existing.rows[0].slug) {
      const existingSlug = await query(
        'SELECT id FROM redirecionamentos WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      
      if (existingSlug.rows.length > 0) {
        return res.status(400).json({
          error: messages.ERROR.SLUG_ALREADY_EXISTS,
          code: 'DUPLICATE_SLUG'
        });
      }
    }
    
    // Atualizar redirecionamento
    const result = await query(
      `UPDATE redirecionamentos 
       SET nome = COALESCE($1, nome),
           slug = COALESCE($2, slug),
           descricao = COALESCE($3, descricao),
           urls = COALESCE($4, urls),
           ativo = COALESCE($5, ativo),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nome, slug, descricao, urls, ativo, id]
    );
    
    // Log de auditoria
    await auditLog(req.user.id, 'editar_redirecionamento', `Redirecionamento "${result.rows[0].nome}" atualizado`, 'redirecionamento', id, req.ip, req.get('User-Agent'));
    
    res.json({
      success: true,
      data: result.rows[0],
      message: messages.SUCCESS.REDIRECIONAMENTO_UPDATED
    });
    
  } catch (error) {
    console.error('Erro ao atualizar redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * DELETE /api/redirecionamentos/:id
 * Deletar redirecionamento
 */
router.delete('/:id', requirePermission('excluir_redirecionamento'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se redirecionamento existe
    const existing = await query(
      'SELECT * FROM redirecionamentos WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: messages.ERROR.REDIRECIONAMENTO_NOT_FOUND,
        code: 'NOT_FOUND'
      });
    }
    
    // Deletar redirecionamento
    await query('DELETE FROM redirecionamentos WHERE id = $1', [id]);
    
    // Log de auditoria
    await auditLog(req.user.id, 'deletar_redirecionamento', `Redirecionamento "${existing.rows[0].nome}" deletado`, 'redirecionamento', id, req.ip, req.get('User-Agent'));
    
    res.json({
      success: true,
      message: messages.SUCCESS.REDIRECIONAMENTO_DELETED
    });
    
  } catch (error) {
    console.error('Erro ao deletar redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'DELETE_ERROR'
    });
  }
});

/**
 * POST /api/redirecionamentos/:id/testar
 * Testar redirecionamento
 */
router.post('/:id/testar', requirePermission('testar_redirecionamento'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payload = {} } = req.body;
    
    // Buscar redirecionamento
    const result = await query(
      'SELECT * FROM redirecionamentos WHERE id = $1 AND ativo = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: messages.ERROR.REDIRECIONAMENTO_NOT_FOUND,
        code: 'NOT_FOUND'
      });
    }
    
    const redirecionamento = result.rows[0];
    const urls = redirecionamento.urls.split(',').map(url => url.trim());
    
    // Simular teste (aqui você implementaria a lógica real de teste)
    const testResults = urls.map(url => ({
      url,
      status: 'success',
      response_time: Math.floor(Math.random() * 1000),
      message: 'Teste simulado'
    }));
    
    res.json({
      success: true,
      data: {
        redirecionamento: redirecionamento.nome,
        urls: testResults,
        total_urls: urls.length,
        successful: testResults.filter(r => r.status === 'success').length
      }
    });
    
  } catch (error) {
    console.error('Erro ao testar redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'TEST_ERROR'
    });
  }
});

module.exports = router;
