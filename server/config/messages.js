/**
 * Mensagens do Sistema - Português Brasileiro
 * 
 * Este módulo centraliza todas as mensagens do sistema em português brasileiro.
 * Facilita a manutenção e tradução das mensagens.
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

module.exports = {
  SUCCESS: {
    // Autenticação
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso',
    USER_CREATED: 'Usuário criado com sucesso',
    PROFILE_UPDATED: 'Perfil atualizado com sucesso',
    PASSWORD_CHANGED: 'Senha alterada com sucesso',
    TEMP_PASSWORD_GENERATED: 'Nova senha temporária gerada com sucesso',
    
    // Webhooks
    WEBHOOK_RECEIVED: 'Webhook recebido com sucesso',
    WEBHOOK_PROCESSED: 'Webhook processado com sucesso',
    WEBHOOK_REDISTRIBUTED: 'Webhook redistribuído com sucesso',
    
    // Redirecionamentos
    REDIRECIONAMENTO_CREATED: 'Redirecionamento criado com sucesso! URL: {url}',
    REDIRECIONAMENTO_UPDATED: 'Redirecionamento atualizado com sucesso',
    REDIRECIONAMENTO_DELETED: 'Redirecionamento excluído com sucesso',
    REDIRECIONAMENTO_ACTIVATED: 'Redirecionamento ativado com sucesso',
    REDIRECIONAMENTO_DEACTIVATED: 'Redirecionamento desativado com sucesso',
    
    // Logs
    LOGS_EXPORTED: 'Logs exportados com sucesso',
    LOGS_CLEARED: 'Logs limpos com sucesso',
    
    // Configuração
    CONFIG_EXPORTED: 'Configuração exportada com sucesso',
    CONFIG_IMPORTED: 'Configuração importada com sucesso',
    BACKUP_CREATED: 'Backup criado com sucesso',
    BACKUP_RESTORED: 'Backup restaurado com sucesso'
  },

  ERROR: {
    // Autenticação
    INVALID_CREDENTIALS: 'Email ou senha incorretos',
    MISSING_CREDENTIALS: 'Email e senha são obrigatórios',
    MISSING_TOKEN: 'Token de acesso obrigatório',
    INVALID_TOKEN: 'Token inválido ou expirado',
    USER_NOT_FOUND: 'Usuário não encontrado',
    USER_EXISTS: 'Usuário com este email já existe',
    ACCOUNT_DEACTIVATED: 'Conta desativada',
    AUTH_REQUIRED: 'Autenticação obrigatória',
    ADMIN_REQUIRED: 'Acesso de administrador obrigatório',
    USER_ACCESS_REQUIRED: 'Acesso de usuário válido obrigatório',
    EMAIL_TAKEN: 'Email já está sendo usado por outro usuário',
    INVALID_EMAIL: 'Formato de email inválido',
    WEAK_PASSWORD: 'Senha deve ter pelo menos 6 caracteres',
    INVALID_CURRENT_PASSWORD: 'Senha atual incorreta',
    INVALID_ROLE: 'Função inválida. Deve ser "admin" ou "user"',
    MISSING_FIELDS: 'Campos obrigatórios não fornecidos',
    SESSION_EXPIRED: 'Sessão expirada. Faça login novamente',
    IP_BLOCKED: 'Muitas tentativas de login. Tente novamente em 15 minutos',
    PASSWORD_TOO_WEAK: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números',
    INVALID_PASSWORD_FORMAT: 'A senha deve conter pelo menos uma letra e um número',
    
    // Permissões
    INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
    PERMISSION_DENIED: 'Acesso negado',
    OWNERSHIP_REQUIRED: 'Você só pode acessar seus próprios recursos',
    PERMISSION_CHECK_ERROR: 'Erro na verificação de permissão',
    ADMIN_CHECK_ERROR: 'Erro na verificação de administrador',
    USER_CHECK_ERROR: 'Erro na verificação de usuário',
    OWNERSHIP_CHECK_ERROR: 'Erro na verificação de propriedade',
    
    // Webhooks
    WEBHOOK_NOT_FOUND: 'Webhook não encontrado',
    WEBHOOK_PROCESSING_ERROR: 'Erro ao processar webhook',
    WEBHOOK_REDISTRIBUTION_ERROR: 'Erro ao redistribuir webhook',
    INVALID_WEBHOOK_DATA: 'Dados do webhook inválidos',
    
    // Endpoints
    ENDPOINT_NOT_FOUND: 'Endpoint não encontrado',
    ENDPOINT_ALREADY_EXISTS: 'Endpoint já existe',
    INVALID_ENDPOINT_SLUG: 'Slug do endpoint inválido',
    ENDPOINT_CREATION_ERROR: 'Erro ao criar endpoint',
    ENDPOINT_UPDATE_ERROR: 'Erro ao atualizar endpoint',
    ENDPOINT_DELETE_ERROR: 'Erro ao excluir endpoint',
    
    // Destinos
    DESTINATION_NOT_FOUND: 'Destino não encontrado',
    DESTINATION_ALREADY_EXISTS: 'Destino já existe',
    INVALID_DESTINATION_URL: 'URL do destino inválida',
    DESTINATION_CREATION_ERROR: 'Erro ao criar destino',
    DESTINATION_UPDATE_ERROR: 'Erro ao atualizar destino',
    DESTINATION_DELETE_ERROR: 'Erro ao excluir destino',
    DESTINATION_TEST_ERROR: 'Erro ao testar destino',
    
    // Logs
    LOGS_NOT_FOUND: 'Logs não encontrados',
    LOGS_EXPORT_ERROR: 'Erro ao exportar logs',
    LOGS_CLEAR_ERROR: 'Erro ao limpar logs',
    
    // Configuração
    CONFIG_EXPORT_ERROR: 'Erro ao exportar configuração',
    CONFIG_IMPORT_ERROR: 'Erro ao importar configuração',
    BACKUP_CREATION_ERROR: 'Erro ao criar backup',
    BACKUP_RESTORE_ERROR: 'Erro ao restaurar backup',
    INVALID_CONFIG_FORMAT: 'Formato de configuração inválido',
    
    // Sistema
    DATABASE_ERROR: 'Erro no banco de dados',
    INTERNAL_ERROR: 'Erro interno do servidor',
    VALIDATION_ERROR: 'Erro de validação',
    RATE_LIMIT_EXCEEDED: 'Muitas tentativas, tente novamente mais tarde',
    UNAUTHORIZED: 'Acesso não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    BAD_REQUEST: 'Requisição inválida',
    CONFLICT: 'Conflito de dados',
    MISSING_DATA: 'Dados obrigatórios não fornecidos',
    INVALID_DATA: 'Dados inválidos',
    OPERATION_FAILED: 'Operação falhou',
    NETWORK_ERROR: 'Erro de rede',
    TIMEOUT_ERROR: 'Tempo limite excedido'
  },

  VALIDATION: {
    REQUIRED_FIELD: 'Campo obrigatório',
    INVALID_EMAIL: 'Email inválido',
    INVALID_URL: 'URL inválida',
    INVALID_SLUG: 'Slug inválido (apenas letras, números e hífens)',
    PASSWORD_TOO_SHORT: 'Senha muito curta (mínimo 6 caracteres)',
    PASSWORD_TOO_LONG: 'Senha muito longa (máximo 128 caracteres)',
    NAME_TOO_SHORT: 'Nome muito curto (mínimo 2 caracteres)',
    NAME_TOO_LONG: 'Nome muito longo (máximo 100 caracteres)',
    DESCRIPTION_TOO_LONG: 'Descrição muito longa (máximo 500 caracteres)',
    INVALID_ROLE: 'Função inválida',
    INVALID_STATUS: 'Status inválido',
    INVALID_ID: 'ID inválido',
    INVALID_TIMESTAMP: 'Timestamp inválido',
    INVALID_JSON: 'JSON inválido',
    INVALID_HEADERS: 'Cabeçalhos inválidos',
    INVALID_QUERY: 'Parâmetros de consulta inválidos'
  },

  INFO: {
    SERVER_STARTED: 'Servidor iniciado',
    DATABASE_CONNECTED: 'Conectado ao banco de dados',
    DATABASE_INITIALIZED: 'Banco de dados inicializado',
    ENDPOINT_ACCESSED: 'Endpoint acessado',
    WEBHOOK_RECEIVED: 'Webhook recebido',
    WEBHOOK_PROCESSING: 'Processando webhook',
    WEBHOOK_REDISTRIBUTING: 'Redistribuindo webhook',
    USER_LOGIN: 'Usuário fez login',
    USER_LOGOUT: 'Usuário fez logout',
    USER_CREATED: 'Usuário criado',
    USER_UPDATED: 'Usuário atualizado',
    ENDPOINT_CREATED: 'Endpoint criado',
    ENDPOINT_UPDATED: 'Endpoint atualizado',
    DESTINATION_CREATED: 'Destino criado',
    DESTINATION_UPDATED: 'Destino atualizado',
    RATE_LIMIT_APPLIED: 'Rate limit aplicado',
    BACKUP_CREATED: 'Backup criado',
    CONFIG_EXPORTED: 'Configuração exportada'
  },

  LABELS: {
    // Campos
    NAME: 'Nome',
    EMAIL: 'Email',
    PASSWORD: 'Senha',
    CURRENT_PASSWORD: 'Senha Atual',
    NEW_PASSWORD: 'Nova Senha',
    CONFIRM_PASSWORD: 'Confirmar Senha',
    ROLE: 'Função',
    STATUS: 'Status',
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    DESCRIPTION: 'Descrição',
    URL: 'URL',
    SLUG: 'Slug',
    ENDPOINT: 'Endpoint',
    DESTINATION: 'Destino',
    CREATED_AT: 'Criado em',
    UPDATED_AT: 'Atualizado em',
    LAST_LOGIN: 'Último Login',
    
    // Funções
    ADMIN: 'Administrador',
    USER: 'Usuário',
    
    // Status
    SUCCESS: 'Sucesso',
    ERROR: 'Erro',
    WARNING: 'Aviso',
    INFO: 'Informação',
    
    // Operações
    CREATE: 'Criar',
    UPDATE: 'Atualizar',
    DELETE: 'Excluir',
    VIEW: 'Visualizar',
    EDIT: 'Editar',
    SAVE: 'Salvar',
    CANCEL: 'Cancelar',
    CONFIRM: 'Confirmar',
    LOGIN: 'Entrar',
    LOGOUT: 'Sair',
    REGISTER: 'Registrar',
    SEARCH: 'Pesquisar',
    FILTER: 'Filtrar',
    EXPORT: 'Exportar',
    IMPORT: 'Importar',
    BACKUP: 'Backup',
    RESTORE: 'Restaurar',
    TEST: 'Testar',
    ACTIVATE: 'Ativar',
    DEACTIVATE: 'Desativar'
  },

  // Mensagens de UX
  UX: {
    // Confirmações
    CONFIRM_DELETE: 'Tem certeza que deseja excluir este item?',
    CONFIRM_DELETE_REDIRECIONAMENTO: 'Tem certeza que deseja excluir este redirecionamento?',
    CONFIRM_DELETE_USER: 'Tem certeza que deseja excluir este usuário?',
    CONFIRM_LOGOUT: 'Tem certeza que deseja sair?',
    CONFIRM_CLEAR_LOGS: 'Tem certeza que deseja limpar todos os logs?',
    
    // Status
    LOADING: 'Carregando...',
    SAVING: 'Salvando...',
    PROCESSING: 'Processando...',
    CONNECTING: 'Conectando...',
    UNSAVED_CHANGES: 'Você tem alterações não salvas',
    SESSION_WILL_EXPIRE: 'Sua sessão expirará em {minutes} minutos',
    
    // Permissões
    NO_PERMISSION: 'Você não tem permissão para esta ação',
    ADMIN_ONLY: 'Apenas administradores podem realizar esta ação',
    LOGIN_REQUIRED: 'Faça login para continuar',
    
    // Validações
    REQUIRED_FIELD: 'Este campo é obrigatório',
    INVALID_EMAIL_FORMAT: 'Formato de email inválido',
    PASSWORD_MISMATCH: 'As senhas não coincidem',
    URL_INVALID: 'URL inválida',
    SLUG_INVALID: 'Slug deve conter apenas letras, números e hífens',
    
    // Feedback
    SUCCESS_SAVED: 'Salvo com sucesso!',
    SUCCESS_CREATED: 'Criado com sucesso!',
    SUCCESS_UPDATED: 'Atualizado com sucesso!',
    SUCCESS_DELETED: 'Excluído com sucesso!',
    ERROR_SAVE: 'Erro ao salvar',
    ERROR_CREATE: 'Erro ao criar',
    ERROR_UPDATE: 'Erro ao atualizar',
    ERROR_DELETE: 'Erro ao excluir',
    ERROR_LOAD: 'Erro ao carregar dados',
    
    // Webhooks
    WEBHOOK_URL_COPIED: 'URL do webhook copiada para a área de transferência',
    WEBHOOK_TEST_SUCCESS: 'Teste do webhook realizado com sucesso',
    WEBHOOK_TEST_FAILED: 'Falha no teste do webhook',
    
    // Status dos destinos
    DESTINATION_ONLINE: 'Online',
    DESTINATION_OFFLINE: 'Offline',
    DESTINATION_UNKNOWN: 'Status desconhecido',
    DESTINATION_TESTING: 'Testando...',
    
    // Formulários
    FORM_UNSAVED: 'Formulário não salvo',
    FORM_SAVING: 'Salvando formulário...',
    FORM_SAVED: 'Formulário salvo',
    FORM_ERROR: 'Erro no formulário',
    
    // Progress
    PROGRESS_UPLOADING: 'Enviando arquivo...',
    PROGRESS_PROCESSING: 'Processando dados...',
    PROGRESS_EXPORTING: 'Exportando dados...',
    PROGRESS_IMPORTING: 'Importando dados...'
  }
};
