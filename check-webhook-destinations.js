const { Pool } = require('pg');
require('dotenv').config({ path: './postgres.env' });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkData() {
  try {
    console.log('🔍 Verificando dados nas tabelas...\n');
    
    // Verificar redirecionamentos
    const redirecionamentos = await pool.query('SELECT id, nome, slug, urls FROM redirecionamentos LIMIT 5');
    console.log('📊 REDIRECIONAMENTOS:');
    console.table(redirecionamentos.rows);
    
    // Verificar webhook_destinations
    const destinations = await pool.query('SELECT * FROM webhook_destinations LIMIT 5');
    console.log('\n📊 WEBHOOK_DESTINATIONS:');
    console.table(destinations.rows);
    
    // Verificar webhook_endpoints
    const endpoints = await pool.query('SELECT * FROM webhook_endpoints LIMIT 5');
    console.log('\n📊 WEBHOOK_ENDPOINTS:');
    console.table(endpoints.rows);
    
    // Contadores
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM redirecionamentos) as redirecionamentos_count,
        (SELECT COUNT(*) FROM webhook_destinations) as destinations_count,
        (SELECT COUNT(*) FROM webhook_endpoints) as endpoints_count
    `);
    console.log('\n📈 CONTADORES:');
    console.table(counts.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkData();
