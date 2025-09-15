/**
 * Configuração de permissões do sistema
 * Define quais ações cada tipo de usuário pode realizar
 */

const PERMISSIONS = {
  ADMIN: [
    'criar_redirecionamento',
    'editar_redirecionamento', 
    'excluir_redirecionamento',
    'ativar_desativar_redirecionamento',
    'gerenciar_usuarios',
    'visualizar_redirecionamentos',
    'visualizar_logs',
    'visualizar_estatisticas',
    'testar_redirecionamento',
    'exportar_dados'
  ],
  USER: [
    'visualizar_redirecionamentos',
    'visualizar_logs',
    'visualizar_estatisticas',
    'testar_redirecionamento'
  ]
};

/**
 * Verifica se um usuário tem uma permissão específica
 * @param {Object} user - Objeto do usuário com role
 * @param {string} permission - Nome da permissão
 * @returns {boolean} - True se tem permissão
 */
function hasPermission(user, permission) {
  if (!user || !user.role) {
    return false;
  }
  
  const userPermissions = PERMISSIONS[user.role.toUpperCase()];
  return userPermissions && userPermissions.includes(permission);
}

/**
 * Obtém todas as permissões de um tipo de usuário
 * @param {string} role - Role do usuário (admin, user)
 * @returns {Array} - Array de permissões
 */
function getPermissionsByRole(role) {
  return PERMISSIONS[role.toUpperCase()] || [];
}

/**
 * Verifica se um usuário é administrador
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} - True se é admin
 */
function isAdmin(user) {
  return user && user.role === 'admin';
}

/**
 * Verifica se um usuário é usuário comum
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} - True se é user
 */
function isUser(user) {
  return user && user.role === 'user';
}

module.exports = {
  PERMISSIONS,
  hasPermission,
  getPermissionsByRole,
  isAdmin,
  isUser
};
