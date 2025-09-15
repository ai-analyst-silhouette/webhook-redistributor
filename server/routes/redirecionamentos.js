/**
 * Rotas de Redirecionamentos
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
router.get('/', requirePermission('visualizar_redirecionamentos'), (req, res) => {
  const { page = 1, limit = 10, search = '', ativo = null } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (search) {
    whereClause += ' AND (nome LIKE ? OR slug LIKE ? OR descricao LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (ativo !== null) {
    whereClause += ' AND ativo = ?';
    params.push(ativo === 'true' ? 1 : 0);
  }
  
  // Get total count
  db.get(`SELECT COUNT(*) as total FROM redirecionamentos ${whereClause}`, params, (err, countResult) => {
    if (err) {
      console.error('Erro ao contar redirecionamentos:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'COUNT_ERROR'
      });
    }
    
    // Get redirecionamentos with pagination
    const query = `
      SELECT 
        id, nome, slug, descricao, urls, ativo, criado_em,
        json_array_length(urls) as total_urls
      FROM redirecionamentos 
      ${whereClause}
      ORDER BY criado_em DESC
      LIMIT ? OFFSET ?
    `;
    
    db.all(query, [...params, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar redirecionamentos:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'FETCH_ERROR'
        });
      }
      
      // Parse URLs JSON for each redirecionamento
      const redirecionamentos = rows.map(row => ({
        ...row,
        urls: JSON.parse(row.urls || '[]'),
        total_urls: row.total_urls || 0
      }));
      
      res.json({
        success: true,
        data: redirecionamentos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        },
        timestamp: new Date().toISOString()
      });
    });
  });
});

/**
 * GET /api/redirecionamentos/:id
 * Obter redirecionamento específico
 */
router.get('/:id', requirePermission('visualizar_redirecionamentos'), (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT * FROM redirecionamentos WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error('Erro ao buscar redirecionamento:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'FETCH_ERROR'
        });
      }
      
      if (!row) {
        return res.status(404).json({
          error: messages.ERROR.NOT_FOUND,
          code: 'REDIRECIONAMENTO_NOT_FOUND'
        });
      }
      
      res.json({
        success: true,
        data: {
          ...row,
          urls: JSON.parse(row.urls || '[]')
        }
      });
    }
  );
});

/**
 * POST /api/redirecionamentos
 * Criar novo redirecionamento
 */
router.post('/', requirePermission('criar_redirecionamento'), auditLog('criar_redirecionamento', 'Criando novo redirecionamento', 'redirecionamento'), (req, res) => {
  const { nome, slug, descricao, urls = [] } = req.body;
  
  // Validate input
  if (!nome || !slug) {
    return res.status(400).json({
      error: messages.ERROR.MISSING_FIELDS,
      code: 'MISSING_FIELDS'
    });
  }
  
  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return res.status(400).json({
      error: messages.ERROR.INVALID_SLUG,
      code: 'INVALID_SLUG'
    });
  }
  
  // Validate URLs
  if (!Array.isArray(urls)) {
    return res.status(400).json({
      error: 'URLs deve ser um array',
      code: 'INVALID_URLS'
    });
  }
  
  // Validate each URL
  const urlRegex = /^https?:\/\/.+/;
  for (const url of urls) {
    if (!urlRegex.test(url)) {
      return res.status(400).json({
        error: `URL inválida: ${url}`,
        code: 'INVALID_URL'
      });
    }
  }
  
  // Check if slug already exists
  db.get('SELECT id FROM redirecionamentos WHERE slug = ?', [slug], (err, existing) => {
    if (err) {
      console.error('Erro ao verificar slug:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'CHECK_ERROR'
      });
    }
    
    if (existing) {
      return res.status(409).json({
        error: 'Slug já existe',
        code: 'SLUG_EXISTS'
      });
    }
    
    // Create redirecionamento
    db.run(
      'INSERT INTO redirecionamentos (nome, slug, descricao, urls) VALUES (?, ?, ?, ?)',
      [nome, slug, descricao, JSON.stringify(urls)],
      function(err) {
        if (err) {
          console.error('Erro ao criar redirecionamento:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'CREATE_ERROR'
          });
        }
        
        res.status(201).json({
          success: true,
          message: messages.SUCCESS.REDIRECIONAMENTO_CREATED,
          data: {
            id: this.lastID,
            nome,
            slug,
            descricao,
            urls,
            ativo: 1,
            criado_em: new Date().toISOString()
          }
        });
      }
    );
  });
});

/**
 * PATCH /api/redirecionamentos/:id/toggle
 * Alternar status ativo/inativo do redirecionamento
 */
router.patch('/:id/toggle', requirePermission('editar_redirecionamento'), auditLog('editar_redirecionamento', 'Alternando status do redirecionamento', 'redirecionamento'), (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;
  
  // Validate input
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({
      error: 'Campo ativo deve ser um boolean',
      code: 'INVALID_ATIVO'
    });
  }
  
  // Check if redirecionamento exists
  db.get('SELECT id, ativo FROM redirecionamentos WHERE id = ?', [id], (err, existing) => {
    if (err) {
      console.error('Erro ao verificar redirecionamento:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'CHECK_ERROR'
      });
    }
    
    if (!existing) {
      return res.status(404).json({
        error: messages.ERROR.NOT_FOUND,
        code: 'REDIRECIONAMENTO_NOT_FOUND'
      });
    }
    
    // Update only the ativo field
    db.run(
      'UPDATE redirecionamentos SET ativo = ? WHERE id = ?',
      [ativo ? 1 : 0, id],
      function(err) {
        if (err) {
          console.error('Erro ao atualizar status do redirecionamento:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'UPDATE_ERROR'
          });
        }
        
        res.json({
          success: true,
          message: `Redirecionamento ${ativo ? 'ativado' : 'desativado'} com sucesso`,
          data: {
            id: parseInt(id),
            ativo: ativo ? 1 : 0
          }
        });
      }
    );
  });
});

/**
 * PATCH /api/redirecionamentos/:id/urls/:urlIndex/toggle
 * Alternar status ativo/inativo de uma URL específica
 */
router.patch('/:id/urls/:urlIndex/toggle', requirePermission('editar_redirecionamento'), auditLog('editar_redirecionamento', 'Alternando status de URL', 'redirecionamento'), (req, res) => {
  const { id, urlIndex } = req.params;
  const { ativo } = req.body;
  
  // Validate input
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({
      error: 'Campo ativo deve ser um boolean',
      code: 'INVALID_ATIVO'
    });
  }
  
  const urlIndexNum = parseInt(urlIndex);
  if (isNaN(urlIndexNum) || urlIndexNum < 0) {
    return res.status(400).json({
      error: 'Índice da URL inválido',
      code: 'INVALID_URL_INDEX'
    });
  }
  
  // Check if redirecionamento exists
  db.get('SELECT id, urls FROM redirecionamentos WHERE id = ?', [id], (err, existing) => {
    if (err) {
      console.error('Erro ao verificar redirecionamento:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'CHECK_ERROR'
      });
    }
    
    if (!existing) {
      return res.status(404).json({
        error: messages.ERROR.NOT_FOUND,
        code: 'REDIRECIONAMENTO_NOT_FOUND'
      });
    }
    
    // Parse URLs
    const urls = JSON.parse(existing.urls || '[]');
    
    // Check if URL index is valid
    if (urlIndexNum >= urls.length) {
      return res.status(400).json({
        error: 'Índice da URL fora do range',
        code: 'URL_INDEX_OUT_OF_RANGE'
      });
    }
    
    // Update URL status in the array
    // We'll store the status as a property of each URL
    if (!urls[urlIndexNum].hasOwnProperty('ativo')) {
      urls[urlIndexNum] = { url: urls[urlIndexNum], ativo: true };
    }
    urls[urlIndexNum].ativo = ativo;
    
    // Update in database
    db.run(
      'UPDATE redirecionamentos SET urls = ? WHERE id = ?',
      [JSON.stringify(urls), id],
      function(err) {
        if (err) {
          console.error('Erro ao atualizar status da URL:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'UPDATE_ERROR'
          });
        }
        
        res.json({
          success: true,
          message: `URL ${ativo ? 'ativada' : 'desativada'} com sucesso`,
          data: {
            id: parseInt(id),
            urlIndex: urlIndexNum,
            ativo: ativo,
            urls: urls
          }
        });
      }
    );
  });
});

/**
 * PUT /api/redirecionamentos/:id
 * Atualizar redirecionamento
 */
router.put('/:id', requirePermission('editar_redirecionamento'), auditLog('editar_redirecionamento', 'Atualizando redirecionamento', 'redirecionamento'), (req, res) => {
  const { id } = req.params;
  const { nome, slug, descricao, urls = [], ativo = null } = req.body;
  
  // Validate input
  if (!nome || !slug) {
    return res.status(400).json({
      error: messages.ERROR.MISSING_FIELDS,
      code: 'MISSING_FIELDS'
    });
  }
  
  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return res.status(400).json({
      error: messages.ERROR.INVALID_SLUG,
      code: 'INVALID_SLUG'
    });
  }
  
  // Validate URLs
  if (!Array.isArray(urls)) {
    return res.status(400).json({
      error: 'URLs deve ser um array',
      code: 'INVALID_URLS'
    });
  }
  
  // Validate each URL
  const urlRegex = /^https?:\/\/.+/;
  for (const url of urls) {
    if (!urlRegex.test(url)) {
      return res.status(400).json({
        error: `URL inválida: ${url}`,
        code: 'INVALID_URL'
      });
    }
  }
  
  // Check if redirecionamento exists
  db.get('SELECT id FROM redirecionamentos WHERE id = ?', [id], (err, existing) => {
    if (err) {
      console.error('Erro ao verificar redirecionamento:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'CHECK_ERROR'
      });
    }
    
    if (!existing) {
      return res.status(404).json({
        error: messages.ERROR.NOT_FOUND,
        code: 'REDIRECIONAMENTO_NOT_FOUND'
      });
    }
    
    // Check if slug is taken by another redirecionamento
    db.get('SELECT id FROM redirecionamentos WHERE slug = ? AND id != ?', [slug, id], (err, slugExists) => {
      if (err) {
        console.error('Erro ao verificar slug:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'CHECK_ERROR'
        });
      }
      
      if (slugExists) {
        return res.status(409).json({
          error: 'Slug já existe',
          code: 'SLUG_EXISTS'
        });
      }
      
      // Update redirecionamento
      const updateFields = ['nome = ?', 'slug = ?', 'descricao = ?', 'urls = ?'];
      const updateValues = [nome, slug, descricao, JSON.stringify(urls)];
      
      if (ativo !== null) {
        updateFields.push('ativo = ?');
        updateValues.push(ativo ? 1 : 0);
      }
      
      updateValues.push(id);
      
      db.run(
        `UPDATE redirecionamentos SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues,
        function(err) {
          if (err) {
            console.error('Erro ao atualizar redirecionamento:', err);
            return res.status(500).json({
              error: messages.ERROR.DATABASE_ERROR,
              code: 'UPDATE_ERROR'
            });
          }
          
          res.json({
            success: true,
            message: messages.SUCCESS.REDIRECIONAMENTO_UPDATED,
            data: {
              id: parseInt(id),
              nome,
              slug,
              descricao,
              urls,
              ativo: ativo !== null ? (ativo ? 1 : 0) : undefined
            }
          });
        }
      );
    });
  });
});

/**
 * DELETE /api/redirecionamentos/:id
 * Excluir redirecionamento
 */
router.delete('/:id', requirePermission('excluir_redirecionamento'), auditLog('excluir_redirecionamento', 'Excluindo redirecionamento', 'redirecionamento'), (req, res) => {
  const { id } = req.params;
  
  // Check if redirecionamento exists
  db.get('SELECT id FROM redirecionamentos WHERE id = ?', [id], (err, existing) => {
    if (err) {
      console.error('Erro ao verificar redirecionamento:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'CHECK_ERROR'
      });
    }
    
    if (!existing) {
      return res.status(404).json({
        error: messages.ERROR.NOT_FOUND,
        code: 'REDIRECIONAMENTO_NOT_FOUND'
      });
    }
    
    // Delete redirecionamento
    db.run('DELETE FROM redirecionamentos WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Erro ao excluir redirecionamento:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'DELETE_ERROR'
        });
      }
      
      res.json({
        success: true,
        message: messages.SUCCESS.REDIRECIONAMENTO_DELETED
      });
    });
  });
});

/**
 * POST /api/redirecionamentos/:id/testar
 * Testar redirecionamento
 */
router.post('/:id/testar', requirePermission('testar_redirecionamento'), auditLog('testar_redirecionamento', 'Testando redirecionamento', 'redirecionamento'), (req, res) => {
  const { id } = req.params;
  const { payload = { teste: 'webhook de teste' } } = req.body;
  
  // Get redirecionamento
  db.get('SELECT * FROM redirecionamentos WHERE id = ? AND ativo = 1', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar redirecionamento:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'FETCH_ERROR'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        error: messages.ERROR.NOT_FOUND,
        code: 'REDIRECIONAMENTO_NOT_FOUND'
      });
    }
    
    const urls = JSON.parse(row.urls || '[]');
    
    if (urls.length === 0) {
      return res.status(400).json({
        error: 'Redirecionamento não possui URLs configuradas',
        code: 'NO_URLS'
      });
    }
    
    // Test each URL
    const axios = require('axios');
    const results = [];
    let completed = 0;
    
    urls.forEach((url, index) => {
      const startTime = Date.now();
      
      axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhook-Redistributor/1.0',
          'X-Test-At': new Date().toISOString(),
          'X-Test-From': 'webhook-redistributor'
        },
        timeout: 10000
      })
      .then(response => {
        const responseTime = Date.now() - startTime;
        results[index] = {
          url,
          success: true,
          status: response.status,
          responseTime,
          responseData: response.data
        };
        
        completed++;
        if (completed === urls.length) {
          res.json({
            success: true,
            message: 'Teste de redirecionamento concluído',
            redirecionamento: {
              id: row.id,
              nome: row.nome,
              slug: row.slug
            },
            results
          });
        }
      })
      .catch(error => {
        const responseTime = Date.now() - startTime;
        results[index] = {
          url,
          success: false,
          error: error.message,
          responseTime,
          status: error.response?.status || 0
        };
        
        completed++;
        if (completed === urls.length) {
          res.json({
            success: true,
            message: 'Teste de redirecionamento concluído',
            redirecionamento: {
              id: row.id,
              nome: row.nome,
              slug: row.slug
            },
            results
          });
        }
      });
    });
  });
});

module.exports = router;
