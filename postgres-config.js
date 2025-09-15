/**
 * Configuração do Banco de Dados PostgreSQL
 * Webhook Redistributor
 */

const { Pool } = require('pg');

// Configurações do banco PostgreSQL
const postgresConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'webhook_redistributor',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
};

// Criar pool de conexões
const pool = new Pool(postgresConfig);

// Event listeners para o pool
pool.on('connect', (client) => {
  console.log('✅ Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado no cliente PostgreSQL:', err);
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexão PostgreSQL testada com sucesso:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', err);
    return false;
  }
};

// Função para executar queries
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executada em ${duration}ms:`, text.substring(0, 50) + '...');
    return result;
  } catch (err) {
    console.error('❌ Erro na query:', err);
    throw err;
  }
};

// Função para executar transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Função para fechar o pool
const closePool = async () => {
  await pool.end();
  console.log('🔒 Pool de conexões PostgreSQL fechado');
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
  config: postgresConfig
};
