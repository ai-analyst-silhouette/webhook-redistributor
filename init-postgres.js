#!/usr/bin/env node

/**
 * Script de Inicialização do Banco PostgreSQL
 * Webhook Redistributor
 * 
 * Este script inicializa o banco PostgreSQL com dados padrão
 * Execute: node init-postgres.js
 */

const { query, testConnection, closePool } = require('./postgres-config');
const bcrypt = require('bcryptjs');

// Dados padrão para inserir
const defaultData = {
  usuarios: [
    {
      nome: 'Administrador',
      email: 'admin@localhost',
      hash_senha: bcrypt.hashSync('admin123', 10),
      funcao: 'admin',
      ativo: true
    }
  ],
  redirecionamentos: [
    {
      nome: 'Redirecionamento Padrão',
      slug: 'default',
      descricao: 'Redirecionamento padrão do sistema',
      urls: 'http://localhost:3001/webhook/default',
      ativo: true
    }
  ],
  configuracoes: [
    { chave: 'webhook_timeout', valor: '5000', tipo: 'number', descricao: 'Timeout padrão para webhooks em ms' },
    { chave: 'max_retries', valor: '3', tipo: 'number', descricao: 'Número máximo de tentativas de reenvio' },
    { chave: 'log_level', valor: 'info', tipo: 'string', descricao: 'Nível de log do sistema' },
    { chave: 'rate_limit_per_minute', valor: '1000', tipo: 'number', descricao: 'Limite de requisições por minuto' },
    { chave: 'enable_audit_log', valor: 'true', tipo: 'boolean', descricao: 'Habilitar log de auditoria' },
    { chave: 'timezone', valor: 'America/Sao_Paulo', tipo: 'string', descricao: 'Fuso horário do sistema' }
  ]
};

// Função para inserir dados padrão
async function insertDefaultData() {
  try {
    console.log('🔄 Inserindo dados padrão...\n');

    // Inserir usuário admin
    console.log('👤 Criando usuário administrador...');
    await query(
      `INSERT INTO usuarios (nome, email, hash_senha, funcao, ativo) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING`,
      [defaultData.usuarios[0].nome, defaultData.usuarios[0].email, defaultData.usuarios[0].hash_senha, defaultData.usuarios[0].funcao, defaultData.usuarios[0].ativo]
    );
    console.log('✅ Usuário administrador criado');

    // Inserir redirecionamento padrão
    console.log('🔗 Criando redirecionamento padrão...');
    await query(
      `INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (slug) DO NOTHING`,
      [defaultData.redirecionamentos[0].nome, defaultData.redirecionamentos[0].slug, defaultData.redirecionamentos[0].descricao, defaultData.redirecionamentos[0].urls, defaultData.redirecionamentos[0].ativo]
    );
    console.log('✅ Redirecionamento padrão criado');

    // Inserir configurações
    console.log('⚙️ Criando configurações padrão...');
    for (const config of defaultData.configuracoes) {
      await query(
        `INSERT INTO configuracoes (chave, valor, tipo, descricao) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (chave) DO NOTHING`,
        [config.chave, config.valor, config.tipo, config.descricao]
      );
    }
    console.log('✅ Configurações padrão criadas');

    console.log('\n🎉 Dados padrão inseridos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inserir dados padrão:', error);
    throw error;
  }
}

// Função para verificar se o banco está vazio
async function isDatabaseEmpty() {
  try {
    const result = await query('SELECT COUNT(*) as count FROM usuarios');
    return result.rows[0].count === '0';
  } catch (error) {
    console.error('❌ Erro ao verificar se o banco está vazio:', error);
    return false;
  }
}

// Função para mostrar estatísticas do banco
async function showDatabaseStats() {
  try {
    console.log('\n📊 Estatísticas do banco:');
    
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM redirecionamentos) as redirecionamentos,
        (SELECT COUNT(*) FROM logs_webhook) as logs_webhook,
        (SELECT COUNT(*) FROM audit_log) as audit_log,
        (SELECT COUNT(*) FROM configuracoes) as configuracoes
    `);
    
    const row = stats.rows[0];
    console.log(`👥 Usuários: ${row.usuarios}`);
    console.log(`🔗 Redirecionamentos: ${row.redirecionamentos}`);
    console.log(`📝 Logs de webhook: ${row.logs_webhook}`);
    console.log(`🔍 Logs de auditoria: ${row.audit_log}`);
    console.log(`⚙️ Configurações: ${row.configuracoes}`);

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
  }
}

// Função principal
async function init() {
  try {
    console.log('🚀 Inicializando banco PostgreSQL...\n');

    // Testar conexão
    await testConnection();

    // Verificar se o banco está vazio
    const isEmpty = await isDatabaseEmpty();
    
    if (isEmpty) {
      console.log('📭 Banco vazio detectado, inserindo dados padrão...');
      await insertDefaultData();
    } else {
      console.log('📊 Banco já contém dados, pulando inserção de dados padrão');
    }

    // Mostrar estatísticas
    await showDatabaseStats();

    console.log('\n✅ Inicialização concluída com sucesso!');
    console.log('\n🔑 Credenciais padrão:');
    console.log('   Email: admin@localhost');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('\n❌ Erro durante inicialização:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  init();
}

module.exports = { init, insertDefaultData, showDatabaseStats };
