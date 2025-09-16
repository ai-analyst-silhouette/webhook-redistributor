/**
 * Rotas de Autenticação - PostgreSQL
 * 
 * Este módulo gerencia todos os endpoints relacionados à autenticação:
 * - Login e logout de usuários
 * - Registro de usuários (apenas admin)
 * - Gerenciamento de perfil
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database/postgres');
const messages = require('../config/messages');
const { 
  authenticateToken, 
  requireAdmin, 
  generateToken, 
  updateLastLogin,
  authRateLimiter,
  validatePassword,
  isIPBlocked,
  recordLoginAttempt,
  generateTemporaryPassword,
  clearIPBlock,
  clearAllBlocks
} = require('../middleware/auth');
const { requirePermission, auditLog } = require('../middleware/permissions');
const { logLogin, logLogout } = require('../utils/auditLogger');

const router = express.Router();

/**
 * POST /api/autenticacao/login
 * Autenticar usuário com email e senha
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Verificar se o IP está bloqueado
    if (isIPBlocked(clientIP)) {
      return res.status(429).json({
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos',
        code: 'IP_BLOCKED'
      });
    }

    // Validar entrada
    if (!email || !password) {
      recordLoginAttempt(clientIP, false, 'Dados incompletos');
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuário no banco
    const result = await query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      recordLoginAttempt(clientIP, false, 'Usuário não encontrado');
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar senha
    const passwordMatch = bcrypt.compareSync(password, user.hash_senha);
    if (!passwordMatch) {
      recordLoginAttempt(clientIP, false, 'Senha incorreta');
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Atualizar último login
    await query(
      'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Gerar token JWT
    const token = generateToken(user, rememberMe);

    // Limpar bloqueios de IP em caso de sucesso
    clearIPBlock(clientIP);

    // Log de auditoria
    await logLogin(user.id, clientIP, req.get('User-Agent'));

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
        ultimo_login: user.ultimo_login
      },
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no login:', error);
    recordLoginAttempt(req.ip, false, 'Erro interno');
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/autenticacao/logout
 * Logout do usuário
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log de auditoria
    await logLogout(req.user.id, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/autenticacao/me
 * Obter dados do usuário logado
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, nome, email, funcao, ativo, ultimo_login, criado_em FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/autenticacao/change-password
 * Alterar senha do usuário
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias',
        code: 'MISSING_PASSWORDS'
      });
    }

    // Validar nova senha
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.message,
        code: 'INVALID_PASSWORD'
      });
    }

    // Buscar usuário atual
    const result = await query(
      'SELECT hash_senha FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar senha atual
    const currentPasswordMatch = bcrypt.compareSync(currentPassword, result.rows[0].hash_senha);
    if (!currentPasswordMatch) {
      return res.status(401).json({
        error: 'Senha atual incorreta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Gerar hash da nova senha
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);

    // Atualizar senha
    await query(
      'UPDATE usuarios SET hash_senha = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    // Log de auditoria
    await auditLog(req.user.id, 'change_password', 'Senha alterada com sucesso', 'usuario', req.user.id, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/autenticacao/users
 * Listar usuários (apenas admin)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', ativo = null } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (nome ILIKE $${paramCount} OR email ILIKE $${paramCount + 1})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
      paramCount += 2;
    }

    if (ativo !== null) {
      whereClause += ` AND ativo = $${paramCount}`;
      params.push(ativo === 'true');
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM usuarios ${whereClause}`;
    const countResult = await query(countQuery, params);

    // Get users with pagination
    const dataQuery = `
      SELECT id, nome, email, funcao, ativo, ultimo_login, criado_em
      FROM usuarios 
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
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
