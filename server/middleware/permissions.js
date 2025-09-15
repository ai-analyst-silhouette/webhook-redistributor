const { hasPermission, isAdmin, isUser } = require('../config/permissions');
const messages = require('../config/messages');
const auditService = require('../services/auditService');

/**
 * Middleware para verificar se o usuário tem uma permissão específica
 * @param {string} permission - Nome da permissão necessária
 * @returns {Function} - Middleware function
 */
function requirePermission(permission) {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: messages.ERROR.UNAUTHORIZED,
          code: 'UNAUTHORIZED'
        });
      }

      if (!hasPermission(user, permission)) {
        return res.status(403).json({
          error: `Acesso negado. Permissão necessária: ${permission}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de permissão:', error);
      res.status(500).json({
        error: messages.ERROR.INTERNAL_SERVER_ERROR,
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário é administrador
 * @returns {Function} - Middleware function
 */
function requireAdmin() {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: messages.ERROR.UNAUTHORIZED,
          code: 'UNAUTHORIZED'
        });
      }

      if (!isAdmin(user)) {
        return res.status(403).json({
          error: 'Acesso de administrador obrigatório',
          code: 'ADMIN_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de admin:', error);
      res.status(500).json({
        error: messages.ERROR.INTERNAL_SERVER_ERROR,
        code: 'ADMIN_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário é usuário comum ou admin
 * @returns {Function} - Middleware function
 */
function requireUser() {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: messages.ERROR.UNAUTHORIZED,
          code: 'UNAUTHORIZED'
        });
      }

      if (!isUser(user) && !isAdmin(user)) {
        return res.status(403).json({
          error: 'Acesso de usuário obrigatório',
          code: 'USER_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de usuário:', error);
      res.status(500).json({
        error: messages.ERROR.INTERNAL_SERVER_ERROR,
        code: 'USER_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário pode acessar recursos de outros usuários
 * Admins podem acessar tudo, usuários comuns só podem acessar seus próprios recursos
 * @param {string} resourceField - Campo que identifica o proprietário do recurso
 * @returns {Function} - Middleware function
 */
function requireOwnershipOrAdmin(resourceField = 'user_id') {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: messages.ERROR.UNAUTHORIZED,
          code: 'UNAUTHORIZED'
        });
      }

      // Admins podem acessar tudo
      if (isAdmin(user)) {
        return next();
      }

      // Usuários comuns só podem acessar seus próprios recursos
      const resourceUserId = req.params[resourceField] || req.body[resourceField];
      
      if (resourceUserId && resourceUserId !== user.id.toString()) {
        return res.status(403).json({
          error: 'Acesso negado. Você só pode acessar seus próprios recursos.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de propriedade:', error);
      res.status(500).json({
        error: messages.ERROR.INTERNAL_SERVER_ERROR,
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware para logging de auditoria
 * Registra ações importantes no banco de dados
 * @param {string} action - Ação sendo realizada
 * @param {string} description - Descrição da ação
 * @param {string} resourceType - Tipo do recurso (opcional)
 * @param {string} resourceId - ID do recurso (opcional)
 * @returns {Function} - Middleware function
 */
function auditLog(action, description, resourceType = null, resourceId = null) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (user) {
        // Log da ação de auditoria
        const auditData = {
          usuario_id: user.id,
          acao: action,
          descricao: description,
          recurso_tipo: resourceType,
          recurso_id: resourceId,
          ip: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        };

        // Salva no banco de dados
        try {
          await auditService.logAction(auditData);
        } catch (auditError) {
          console.error('Erro ao salvar log de auditoria:', auditError);
          // Não interrompe o fluxo em caso de erro no log
        }
      }

      next();
    } catch (error) {
      console.error('Erro no log de auditoria:', error);
      // Não interrompe o fluxo em caso de erro no log
      next();
    }
  };
}

module.exports = {
  requirePermission,
  requireAdmin,
  requireUser,
  requireOwnershipOrAdmin,
  auditLog
};
