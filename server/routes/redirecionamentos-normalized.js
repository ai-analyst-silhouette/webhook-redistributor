const express = require('express');
const router = express.Router();
const { query } = require('../database/postgres');
const messages = require('../config/messages');
const { requirePermission, auditLog } = require('../middleware/permissions');

/**
 * GET /api/redirecionamentos
 * Listar todos os redirecionamentos com seus destinos
 */
router.get('/', requirePermission('visualizar_redirecionamentos'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.id, r.nome, r.slug, r.descricao, r.ativo,
        r.criado_em, r.atualizado_em,
        COALESCE(
          JSON_AGG(
            CASE WHEN rd.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', rd.id,
                'nome', rd.nome,
                'url', rd.url,
                'ativo', rd.ativo,
                'ordem', rd.ordem,
                'timeout', rd.timeout,
                'max_tentativas', rd.max_tentativas
              )
            END
            ORDER BY rd.ordem
          ) FILTER (WHERE rd.id IS NOT NULL), 
          '[]'::json
        ) as destinos
      FROM redirecionamentos r
      LEFT JOIN redirecionamento_destinos rd ON r.id = rd.redirecionamento_id
      WHERE r.ativo = true
      GROUP BY r.id, r.nome, r.slug, r.descricao, r.ativo, r.criado_em, r.atualizado_em
      ORDER BY r.criado_em DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
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
 * Buscar redirecionamento específico com destinos
 */
router.get('/:id', requirePermission('visualizar_redirecionamentos'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(`
      SELECT 
        r.id, r.nome, r.slug, r.descricao, r.ativo,
        r.criado_em, r.atualizado_em,
        COALESCE(
          JSON_AGG(
            CASE WHEN rd.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', rd.id,
                'nome', rd.nome,
                'url', rd.url,
                'ativo', rd.ativo,
                'ordem', rd.ordem,
                'timeout', rd.timeout,
                'max_tentativas', rd.max_tentativas
              )
            END
            ORDER BY rd.ordem
          ) FILTER (WHERE rd.id IS NOT NULL), 
          '[]'::json
        ) as destinos
      FROM redirecionamentos r
      LEFT JOIN redirecionamento_destinos rd ON r.id = rd.redirecionamento_id
      WHERE r.id = $1
      GROUP BY r.id, r.nome, r.slug, r.descricao, r.ativo, r.criado_em, r.atualizado_em
    `, [id]);

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
 * Criar novo redirecionamento com destinos
 */
router.post('/', requirePermission('criar_redirecionamentos'), auditLog('criar_redirecionamento', 'Criando novo redirecionamento', 'redirecionamento'), async (req, res) => {
  try {
    const { nome, slug, descricao, destinos = [], ativo = true } = req.body;
    
    // Validar dados obrigatórios
    if (!nome || !slug) {
      return res.status(400).json({
        error: messages.ERROR.MISSING_REQUIRED_FIELDS,
        code: 'VALIDATION_ERROR'
      });
    }

    if (!destinos || destinos.length === 0) {
      return res.status(400).json({
        error: 'Pelo menos um destino é obrigatório',
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
        error: messages.ERROR.SLUG_EXISTS,
        code: 'SLUG_EXISTS'
      });
    }
    
    // Iniciar transação
    await query('BEGIN');

    try {
      // Inserir redirecionamento (sem coluna urls)
      const redirecionamentoResult = await query(
        `INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [nome, slug, descricao, '', ativo] // urls vazio pois agora usa tabela normalizada
      );

      const redirecionamentoId = redirecionamentoResult.rows[0].id;

      // Inserir destinos
      for (let i = 0; i < destinos.length; i++) {
        const destino = destinos[i];
        await query(
          `INSERT INTO redirecionamento_destinos 
           (redirecionamento_id, nome, url, ativo, ordem, timeout, max_tentativas) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            redirecionamentoId,
            destino.nome || `Destino ${i + 1}`,
            destino.url,
            destino.ativo !== undefined ? destino.ativo : true,
            destino.ordem !== undefined ? destino.ordem : i,
            destino.timeout || 5000,
            destino.max_tentativas || 3
          ]
        );
      }

      await query('COMMIT');

      // Buscar o redirecionamento completo criado
      const completedResult = await query(`
        SELECT 
          r.id, r.nome, r.slug, r.descricao, r.ativo,
          r.criado_em, r.atualizado_em,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', rd.id,
              'nome', rd.nome,
              'url', rd.url,
              'ativo', rd.ativo,
              'ordem', rd.ordem,
              'timeout', rd.timeout,
              'max_tentativas', rd.max_tentativas
            )
            ORDER BY rd.ordem
          ) as destinos
        FROM redirecionamentos r
        JOIN redirecionamento_destinos rd ON r.id = rd.redirecionamento_id
        WHERE r.id = $1
        GROUP BY r.id, r.nome, r.slug, r.descricao, r.ativo, r.criado_em, r.atualizado_em
      `, [redirecionamentoId]);

      res.status(201).json({
        success: true,
        data: completedResult.rows[0],
        message: 'Redirecionamento criado com sucesso!'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

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
 * Atualizar redirecionamento e seus destinos
 */
router.put('/:id', requirePermission('editar_redirecionamentos'), auditLog('editar_redirecionamento', 'Atualizando redirecionamento', 'redirecionamento'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, slug, descricao, destinos, ativo } = req.body;
    
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

    // Verificar se slug já existe em outro redirecionamento
    if (slug) {
      const existingSlug = await query(
        'SELECT id FROM redirecionamentos WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (existingSlug.rows.length > 0) {
        return res.status(400).json({
          error: messages.ERROR.SLUG_EXISTS,
          code: 'SLUG_EXISTS'
        });
      }
    }

    // Iniciar transação
    await query('BEGIN');

    try {
      // Atualizar redirecionamento
      const result = await query(
        `UPDATE redirecionamentos 
         SET nome = COALESCE($1, nome),
             slug = COALESCE($2, slug),
             descricao = COALESCE($3, descricao),
             ativo = COALESCE($4, ativo),
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [nome, slug, descricao, ativo, id]
      );

      // Se destinos foram fornecidos, atualizar
      if (destinos && Array.isArray(destinos)) {
        // Remover destinos existentes
        await query('DELETE FROM redirecionamento_destinos WHERE redirecionamento_id = $1', [id]);

        // Inserir novos destinos
        for (let i = 0; i < destinos.length; i++) {
          const destino = destinos[i];
          await query(
            `INSERT INTO redirecionamento_destinos 
             (redirecionamento_id, nome, url, ativo, ordem, timeout, max_tentativas) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              id,
              destino.nome || `Destino ${i + 1}`,
              destino.url,
              destino.ativo !== undefined ? destino.ativo : true,
              destino.ordem !== undefined ? destino.ordem : i,
              destino.timeout || 5000,
              destino.max_tentativas || 3
            ]
          );
        }
      }

      await query('COMMIT');

      // Buscar redirecionamento completo atualizado
      const completedResult = await query(`
        SELECT 
          r.id, r.nome, r.slug, r.descricao, r.ativo,
          r.criado_em, r.atualizado_em,
          COALESCE(
            JSON_AGG(
              CASE WHEN rd.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', rd.id,
                  'nome', rd.nome,
                  'url', rd.url,
                  'ativo', rd.ativo,
                  'ordem', rd.ordem,
                  'timeout', rd.timeout,
                  'max_tentativas', rd.max_tentativas
                )
              END
              ORDER BY rd.ordem
            ) FILTER (WHERE rd.id IS NOT NULL), 
            '[]'::json
          ) as destinos
        FROM redirecionamentos r
        LEFT JOIN redirecionamento_destinos rd ON r.id = rd.redirecionamento_id
        WHERE r.id = $1
        GROUP BY r.id, r.nome, r.slug, r.descricao, r.ativo, r.criado_em, r.atualizado_em
      `, [id]);

      res.json({
        success: true,
        data: completedResult.rows[0],
        message: 'Redirecionamento atualizado com sucesso!'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Erro ao atualizar redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * PATCH /api/redirecionamentos/:id/toggle
 * Alternar status ativo/inativo do redirecionamento
 */
router.patch('/:id/toggle', requirePermission('editar_redirecionamento'), auditLog('editar_redirecionamento', 'Alternando status do redirecionamento', 'redirecionamento'), async (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;
  
  // Validate input
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({
      error: 'Campo "ativo" deve ser um boolean',
      code: 'INVALID_INPUT'
    });
  }
  
  try {
    const result = await query(
      'UPDATE redirecionamentos SET ativo = $1 WHERE id = $2 RETURNING *',
      [ativo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: messages.ERROR.REDIRECIONAMENTO_NOT_FOUND,
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: `Redirecionamento ${ativo ? 'ativado' : 'desativado'} com sucesso!`
    });
    
  } catch (error) {
    console.error('Erro ao alternar status do redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'TOGGLE_ERROR'
    });
  }
});

/**
 * PATCH /api/redirecionamentos/:id/destinos/:destinoId/toggle
 * Alternar status ativo/inativo de um destino específico
 */
router.patch('/:id/destinos/:destinoId/toggle', requirePermission('editar_redirecionamento'), auditLog('editar_redirecionamento', 'Alternando status de destino', 'redirecionamento'), async (req, res) => {
  const { id, destinoId } = req.params;
  const { ativo } = req.body;
  
  // Validate input
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({
      error: 'Campo "ativo" deve ser um boolean',
      code: 'INVALID_INPUT'
    });
  }
  
  try {
    // Verificar se o destino pertence ao redirecionamento
    const result = await query(
      `UPDATE redirecionamento_destinos 
       SET ativo = $1 
       WHERE id = $2 AND redirecionamento_id = $3 
       RETURNING *`,
      [ativo, destinoId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Destino não encontrado',
        code: 'DESTINO_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: `Destino ${ativo ? 'ativado' : 'desativado'} com sucesso!`
    });
    
  } catch (error) {
    console.error('Erro ao alternar status do destino:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'DESTINO_TOGGLE_ERROR'
    });
  }
});

/**
 * DELETE /api/redirecionamentos/:id
 * Excluir redirecionamento (e todos os destinos via CASCADE)
 */
router.delete('/:id', requirePermission('excluir_redirecionamentos'), auditLog('excluir_redirecionamento', 'Excluindo redirecionamento', 'redirecionamento'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      'DELETE FROM redirecionamentos WHERE id = $1 RETURNING *',
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
      message: 'Redirecionamento excluído com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao excluir redirecionamento:', error);
    res.status(500).json({
      error: messages.ERROR.DATABASE_ERROR,
      code: 'DELETE_ERROR'
    });
  }
});

module.exports = router;
