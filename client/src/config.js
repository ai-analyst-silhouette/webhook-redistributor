// Configuração da API
const config = {
  // URL da API baseada no ambiente
  apiUrl: process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://redistribuidor-back.silhouetteexperts.com.br' 
      : 'http://localhost:3002'),
  
  // Função para obter a URL base do backend
  getBackendUrl: () => {
    return process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://redistribuidor-back.silhouetteexperts.com.br' 
        : 'http://localhost:3002');
  },
  
  // Timeout para requisições
  timeout: 10000,
  
  // Headers padrão
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Rotas da API atualizadas para redirecionamentos
  routes: {
    redirecionamentos: '/api/redirecionamentos',
    autenticacao: '/api/autenticacao',
    logs: '/api/logs-webhook',
    webhook: '/api/webhook'
  }
};

export default config;
