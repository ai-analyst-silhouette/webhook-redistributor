const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: './postgres.env' });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🚀 Conectando ao PostgreSQL...');
    
    // Ler o arquivo de migração
    const migrationSQL = fs.readFileSync('./migration-add-urls-ativas.sql', 'utf8');
    
    console.log('📋 Executando migração...');
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await pool.end();
    console.log('🔚 Conexão fechada.');
  }
}

runMigration();
