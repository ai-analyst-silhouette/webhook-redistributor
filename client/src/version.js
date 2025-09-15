// Versão da aplicação - atualizada automaticamente durante o build
export const VERSION = '1.0.2';

// Informações adicionais da versão
export const VERSION_INFO = {
  version: VERSION,
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
};

export default VERSION;
