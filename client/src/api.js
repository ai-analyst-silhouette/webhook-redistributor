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
    return Promise.reject(error);
  }
);

export default api;
