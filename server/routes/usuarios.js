/**
 * Usuários Routes
 * 
 * Handles user management (CRUD operations)
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { query } = require('../database/postgres');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

/**
 * GET /api/usuarios - Get all users
 */
router.get('/', authenticateToken, requirePermission('visualizar_usuarios'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [limit, offset];
    
    if (search) {
      whereClause = 'WHERE nome ILIKE $3 OR email ILIKE $3';
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM usuarios ${whereClause}`,
      search ? [`%${search}%`] : []
    );
    
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const result = await query(
      `SELECT id, nome, email, funcao, ativo, criado_em, ultimo_login 
       FROM usuarios ${whereClause} 
       ORDER BY criado_em DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GET /api/usuarios/:id - Get user by ID
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_usuarios'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, nome, email, funcao, ativo, criado_em, ultimo_login FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

/**
 * POST /api/usuarios - Create new user
 */
router.post('/', authenticateToken, requirePermission('criar_usuarios'), async (req, res) => {
  try {
    const { nome, email, senha, funcao = 'user' } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Create user
    const result = await query(
      `INSERT INTO usuarios (nome, email, hash_senha, funcao, ativo, criado_em) 
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP) 
       RETURNING id, nome, email, funcao, ativo, criado_em`,
      [nome, email, hashedPassword, funcao]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

/**
 * PUT /api/usuarios/:id - Update user
 */
router.put('/:id', authenticateToken, requirePermission('editar_usuarios'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, funcao, ativo } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is being changed and if it's already in use
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso por outro usuário'
        });
      }
    }

    // Update user
    const result = await query(
      `UPDATE usuarios 
       SET nome = COALESCE($2, nome), 
           email = COALESCE($3, email), 
           funcao = COALESCE($4, funcao), 
           ativo = COALESCE($5, ativo),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING id, nome, email, funcao, ativo, criado_em, atualizado_em`,
      [id, nome, email, funcao, ativo]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/**
 * DELETE /api/usuarios/:id - Delete user
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_usuarios'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deleting the admin user
    if (id === '1') {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir o usuário administrador'
      });
    }

    // Delete user
    await query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

/**
 * PUT /api/usuarios/:id/password - Update user password
 */
router.put('/:id/password', authenticateToken, requirePermission('editar_usuarios'), async (req, res) => {
  try {
    const { id } = req.params;
    const { senha } = req.body;

    if (!senha) {
      return res.status(400).json({
        success: false,
        error: 'Senha é obrigatória'
      });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Update password
    await query(
      'UPDATE usuarios SET hash_senha = $2, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1',
      [id, hashedPassword]
    );

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password',
      message: error.message
    });
  }
});

module.exports = router;
