/**
 * Authentication Middleware
 * 
 * This module provides authentication and authorization middleware for the webhook redistributor.
 * It includes JWT token verification, role-based access control, and rate limiting.
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { db } = require('../database/init');
const messages = require('../config/messages');

// Configurações de segurança
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas em ms
  MAX_LOGIN_ATTEMPTS: 10, // Aumentado para desenvolvimento
  LOCKOUT_DURATION: 2 * 60 * 1000, // 2 minutos em ms (reduzido para desenvolvimento)
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000 // 30 dias em ms
};

// Cache para tentativas de login
const loginAttempts = new Map();

// Função para limpar bloqueios de IP (útil para desenvolvimento)
const clearIPBlock = (ip) => {
  if (loginAttempts.has(ip)) {
    loginAttempts.delete(ip);
    console.log(`🔓 IP ${ip} desbloqueado manualmente`);
  }
};

// Função para limpar todos os bloqueios (útil para desenvolvimento)
const clearAllBlocks = () => {
  loginAttempts.clear();
  console.log('🔓 Todos os bloqueios de IP foram limpos');
};

// JWT secret key (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'webhook-redistributor-secret-key-2024';

/**
 * Valida força da senha
 * @param {string} password - Senha para validar
 * @returns {Object} - { valid: boolean, message: string }
 */
function validatePassword(password) {
  if (!password || password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `A senha deve ter pelo menos ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} caracteres`
    };
  }
  
  // Verificar se contém pelo menos uma letra e um número
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      message: 'A senha deve conter pelo menos uma letra e um número'
    };
  }
  
  return { valid: true, message: 'Senha válida' };
}

/**
 * Verifica se o IP está bloqueado por tentativas excessivas
 * @param {string} ip - Endereço IP
 * @returns {boolean} - True se está bloqueado
 */
function isIPBlocked(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > SECURITY_CONFIG.LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
}

/**
 * Registra tentativa de login
 * @param {string} ip - Endereço IP
 * @param {boolean} success - Se o login foi bem-sucedido
 */
function recordLoginAttempt(ip, success) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  
  if (success) {
    loginAttempts.delete(ip);
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(ip, attempts);
  }
}

/**
 * Gera senha temporária
 * @returns {string} - Senha temporária
 */
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Rate limiter for authentication endpoints
 * Limits to 100 requests per hour per IP
 */
const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: messages.ERROR.RATE_LIMIT_EXCEEDED,
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for API endpoints
 * Limits to 1000 requests per hour per IP
 */
const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: messages.ERROR.RATE_LIMIT_EXCEEDED,
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to authenticate JWT token
 * Verifies the token and adds user information to the request object
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: messages.ERROR.MISSING_TOKEN,
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: messages.ERROR.INVALID_TOKEN,
        code: 'INVALID_TOKEN'
      });
    }

    // Verificar se o token não expirou por inatividade
    const now = Date.now();
    const tokenAge = now - (decoded.iat * 1000);
    const maxAge = decoded.rememberMe ? SECURITY_CONFIG.REMEMBER_ME_DURATION : SECURITY_CONFIG.SESSION_TIMEOUT;
    
    if (tokenAge > maxAge) {
      return res.status(401).json({
        error: 'Sessão expirada. Faça login novamente',
        code: 'SESSION_EXPIRED'
      });
    }

    // Verify user still exists and is active using Portuguese table
    db.get(
      'SELECT id, nome, email, funcao, ativo FROM usuarios WHERE id = ? AND ativo = 1',
      [decoded.userId],
      (err, user) => {
        if (err) {
          console.error('Erro no banco de dados durante autenticação:', err);
          return res.status(500).json({ 
            error: messages.ERROR.DATABASE_ERROR,
            code: 'AUTH_ERROR'
          });
        }

        if (!user) {
          return res.status(403).json({ 
            error: messages.ERROR.USER_NOT_FOUND,
            code: 'USER_NOT_FOUND'
          });
        }

        // Add user information to request object
        req.user = {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.funcao
        };

        next();
      }
    );
  });
};

/**
 * Middleware to require admin role
 * Must be used after authenticateToken middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: messages.ERROR.AUTH_REQUIRED,
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: messages.ERROR.ADMIN_REQUIRED,
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware to require user role (admin or user)
 * Must be used after authenticateToken middleware
 */
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: messages.ERROR.AUTH_REQUIRED,
      code: 'AUTH_REQUIRED'
    });
  }

  if (!['admin', 'user'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: messages.ERROR.USER_ACCESS_REQUIRED,
      code: 'USER_ACCESS_REQUIRED'
    });
  }

  next();
};

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, email, and role
 * @param {boolean} rememberMe - Se deve lembrar o usuário por 30 dias
 * @returns {string} JWT token
 */
const generateToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '8h';
  
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      rememberMe: rememberMe
    },
    JWT_SECRET,
    { expiresIn: expiresIn }
  );
};

/**
 * Update user's last login timestamp
 * @param {number} userId - User ID
 */
const updateLastLogin = (userId) => {
  db.run(
    'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
    [userId],
    (err) => {
      if (err) {
        console.error('Erro ao atualizar último login:', err);
      }
    }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
  generateToken,
  updateLastLogin,
  authRateLimiter,
  apiRateLimiter,
  JWT_SECRET,
  validatePassword,
  isIPBlocked,
  recordLoginAttempt,
  generateTemporaryPassword,
  clearIPBlock,
  clearAllBlocks,
  SECURITY_CONFIG
};
