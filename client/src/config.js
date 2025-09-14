// Configuração da API
const config = {
  // URL da API baseada no ambiente
  apiUrl: process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3002'  // Fallback para localhost em produção
      : 'http://localhost:3002'),
  
  // Timeout para requisições
  timeout: 10000,
  
  // Headers padrão
  defaultHeaders: {
    'Content-Type': 'application/json',
  }
};

export default config;
