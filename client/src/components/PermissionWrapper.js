import PropTypes from 'prop-types';

/**
 * Componente PermissionWrapper
 * Controla a exibição de elementos baseado nas permissões do usuário
 */
const PermissionWrapper = ({ 
  permission, 
  user, 
  children, 
  fallback = null, 
  requireAll = false,
  permissions = []
}) => {
  // Se não há usuário logado, não exibe nada
  if (!user) {
    return fallback;
  }

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = (perm) => {
    if (!user || !user.funcao) {
      return false;
    }

    // Permissões por role
    const rolePermissions = {
      admin: [
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
      user: [
        'visualizar_redirecionamentos',
        'visualizar_logs',
        'visualizar_estatisticas',
        'testar_redirecionamento'
      ]
    };

    const userPermissions = rolePermissions[user.funcao.toLowerCase()] || [];
    return userPermissions.includes(perm);
  };

  // Verificar se o usuário é admin
  // Funções auxiliares para verificação de roles (mantidas para uso futuro)
  // const isAdmin = () => {
  //   return user && user.role === 'admin';
  // };

  // const isUser = () => {
  //   return user && user.role === 'user';
  // };

  // Se foi passada uma permissão específica
  if (permission) {
    if (hasPermission(permission)) {
      return children;
    }
    return fallback;
  }

  // Se foi passado um array de permissões
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      // Requer todas as permissões
      const hasAllPermissions = permissions.every(perm => hasPermission(perm));
      return hasAllPermissions ? children : fallback;
    } else {
      // Requer pelo menos uma permissão
      const hasAnyPermission = permissions.some(perm => hasPermission(perm));
      return hasAnyPermission ? children : fallback;
    }
  }

  // Se não há permissões especificadas, exibe o conteúdo
  return children;
};

PermissionWrapper.propTypes = {
  permission: PropTypes.string,
  permissions: PropTypes.arrayOf(PropTypes.string),
  user: PropTypes.object,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  requireAll: PropTypes.bool
};

export default PermissionWrapper;
