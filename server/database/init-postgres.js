/**
 * Inicialização do Banco de Dados PostgreSQL
 * Webhook Redistributor
 */

const { query, testConnection } = require('./postgres');
const bcrypt = require('bcryptjs');

// Função para criar tabelas se não existirem
const createTables = async () => {
  try {
    console.log('🔄 Verificando/criando tabelas...');

    // Tabela redirecionamentos
    await query(`
      CREATE TABLE IF NOT EXISTS redirecionamentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        descricao TEXT,
        urls TEXT NOT NULL,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela logs_webhook
    await query(`
      CREATE TABLE IF NOT EXISTS logs_webhook (
        id SERIAL PRIMARY KEY,
        payload TEXT NOT NULL,
        recebido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status INTEGER NOT NULL,
        destinos_enviados INTEGER DEFAULT 0,
        mensagem_erro TEXT,
        slug_redirecionamento VARCHAR(255),
        tempo_resposta INTEGER DEFAULT 0,
        ip_origem INET,
        user_agent TEXT,
        headers TEXT
      )
    `);

    // Tabela usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        hash_senha VARCHAR(255) NOT NULL,
        funcao VARCHAR(50) DEFAULT 'user' CHECK (funcao IN ('admin', 'user', 'viewer')),
        ativo BOOLEAN DEFAULT true,
        ultimo_login TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP
      )
    `);

    // Tabela audit_log
    await query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        acao VARCHAR(100) NOT NULL,
        descricao TEXT,
        recurso_tipo VARCHAR(50),
        recurso_id INTEGER,
        ip INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dados_anteriores JSONB,
        dados_novos JSONB,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // Tabela configuracoes
    await query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT,
        tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
        descricao TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabelas verificadas/criadas com sucesso');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
};

// Função para criar índices
const createIndexes = async () => {
  try {
    console.log('🔄 Criando índices...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_redirecionamentos_slug ON redirecionamentos(slug)',
      'CREATE INDEX IF NOT EXISTS idx_redirecionamentos_ativo ON redirecionamentos(ativo)',
      'CREATE INDEX IF NOT EXISTS idx_logs_webhook_recebido_em ON logs_webhook(recebido_em)',
      'CREATE INDEX IF NOT EXISTS idx_logs_webhook_status ON logs_webhook(status)',
      'CREATE INDEX IF NOT EXISTS idx_logs_webhook_slug ON logs_webhook(slug_redirecionamento)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id ON audit_log(usuario_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)'
    ];

    for (const indexQuery of indexes) {
      await query(indexQuery);
    }

    console.log('✅ Índices criados com sucesso');

  } catch (error) {
    console.error('❌ Erro ao criar índices:', error);
    throw error;
  }
};

// Função para inserir dados padrão
const insertDefaultData = async () => {
  try {
    console.log('🔄 Inserindo dados padrão...');

    // Verificar se já existem dados
    const userCount = await query('SELECT COUNT(*) as count FROM usuarios');
    if (userCount.rows[0].count > 0) {
      console.log('📊 Dados já existem, pulando inserção');
      return;
    }

    // Inserir usuário admin
    const adminPassword = bcrypt.hashSync('admin123', 10);
    await query(
      `INSERT INTO usuarios (nome, email, hash_senha, funcao, ativo) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', 'admin@localhost', adminPassword, 'admin', true]
    );

    // Inserir redirecionamento padrão
    await query(
      `INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (slug) DO NOTHING`,
      ['Redirecionamento Padrão', 'default', 'Redirecionamento padrão do sistema', 'http://localhost:3001/webhook/default', true]
    );

    // Inserir configurações padrão
    const configs = [
      ['webhook_timeout', '5000', 'number', 'Timeout padrão para webhooks em ms'],
      ['max_retries', '3', 'number', 'Número máximo de tentativas de reenvio'],
      ['log_level', 'info', 'string', 'Nível de log do sistema'],
      ['rate_limit_per_minute', '1000', 'number', 'Limite de requisições por minuto'],
      ['enable_audit_log', 'true', 'boolean', 'Habilitar log de auditoria'],
      ['timezone', 'America/Sao_Paulo', 'string', 'Fuso horário do sistema']
    ];

    for (const [chave, valor, tipo, descricao] of configs) {
      await query(
        `INSERT INTO configuracoes (chave, valor, tipo, descricao) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (chave) DO NOTHING`,
        [chave, valor, tipo, descricao]
      );
    }

    console.log('✅ Dados padrão inseridos com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inserir dados padrão:', error);
    throw error;
  }
};

// Função principal de inicialização
const initializeDatabase = async () => {
  try {
    console.log('🚀 Inicializando banco PostgreSQL...');

    // Testar conexão
    await testConnection();

    // Criar tabelas
    await createTables();

    // Criar índices
    await createIndexes();

    // Inserir dados padrão
    await insertDefaultData();

    console.log('✅ Banco PostgreSQL inicializado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco PostgreSQL:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  createTables,
  createIndexes,
  insertDefaultData
};
