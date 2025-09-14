// Configuração da API
const config = {
  // URL da API baseada no ambiente
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3002',
  
  // Timeout para requisições
  timeout: 10000,
  
  // Headers padrão
  defaultHeaders: {
    'Content-Type': 'application/json',
  }
};

export default config;
