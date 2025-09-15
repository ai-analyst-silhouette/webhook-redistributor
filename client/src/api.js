import axios from 'axios';
import config from './config';

// Configurar axios com URL base
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout,
  headers: config.defaultHeaders
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    // Adicionar token JWT automaticamente se disponível
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Se for erro 401 (não autorizado) ou 403 (proibido), disparar evento de erro de autenticação
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Erro de autenticação detectado, disparando evento global...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Disparar evento global para que o App.js possa lidar com o redirecionamento
      window.dispatchEvent(new CustomEvent('authError'));
    }
    
    return Promise.reject(error);
  }
);

export default api;
