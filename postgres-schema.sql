-- =====================================================
-- Script de Criação do Banco de Dados PostgreSQL
-- Webhook Redistributor
-- =====================================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: redirecionamentos
-- =====================================================
CREATE TABLE IF NOT EXISTS redirecionamentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descricao TEXT,
    urls TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para redirecionamentos
CREATE INDEX IF NOT EXISTS idx_redirecionamentos_slug ON redirecionamentos(slug);
CREATE INDEX IF NOT EXISTS idx_redirecionamentos_ativo ON redirecionamentos(ativo);
CREATE INDEX IF NOT EXISTS idx_redirecionamentos_criado_em ON redirecionamentos(criado_em);

-- =====================================================
-- TABELA: logs_webhook
-- =====================================================
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
);

-- Índices para logs_webhook
CREATE INDEX IF NOT EXISTS idx_logs_webhook_recebido_em ON logs_webhook(recebido_em);
CREATE INDEX IF NOT EXISTS idx_logs_webhook_status ON logs_webhook(status);
CREATE INDEX IF NOT EXISTS idx_logs_webhook_slug ON logs_webhook(slug_redirecionamento);
CREATE INDEX IF NOT EXISTS idx_logs_webhook_destinos_enviados ON logs_webhook(destinos_enviados);

-- =====================================================
-- TABELA: usuarios
-- =====================================================
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
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ultimo_login ON usuarios(ultimo_login);

-- =====================================================
-- TABELA: audit_log
-- =====================================================
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
);

-- Índices para audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_acao ON audit_log(acao);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_recurso ON audit_log(recurso_tipo, recurso_id);

-- =====================================================
-- TABELA: configuracoes (nova tabela para configurações do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para configuracoes
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);

-- =====================================================
-- TABELA: webhook_endpoints (para endpoints personalizados)
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descricao TEXT,
    url_padrao TEXT,
    ativo BOOLEAN DEFAULT true,
    rate_limit INTEGER DEFAULT 1000,
    timeout INTEGER DEFAULT 5000,
    retry_attempts INTEGER DEFAULT 3,
    headers_personalizados JSONB,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para webhook_endpoints
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_slug ON webhook_endpoints(slug);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_ativo ON webhook_endpoints(ativo);

-- =====================================================
-- TABELA: webhook_destinations (para destinos de webhook)
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_destinations (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    timeout INTEGER DEFAULT 5000,
    retry_attempts INTEGER DEFAULT 3,
    headers_personalizados JSONB,
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
);

-- Índices para webhook_destinations
CREATE INDEX IF NOT EXISTS idx_webhook_destinations_endpoint_id ON webhook_destinations(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_destinations_ativo ON webhook_destinations(ativo);
CREATE INDEX IF NOT EXISTS idx_webhook_destinations_ordem ON webhook_destinations(ordem);

-- =====================================================
-- TRIGGERS para atualizar updated_at automaticamente
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_redirecionamentos_updated_at 
    BEFORE UPDATE ON redirecionamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON configuracoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at 
    BEFORE UPDATE ON webhook_endpoints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_destinations_updated_at 
    BEFORE UPDATE ON webhook_destinations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios (nome, email, hash_senha, funcao, ativo) 
VALUES ('Administrador', 'admin@localhost', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir redirecionamento padrão
INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo) 
VALUES ('Redirecionamento Padrão', 'default', 'Redirecionamento padrão do sistema', 'http://localhost:3001/webhook/default', true)
ON CONFLICT (slug) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
('webhook_timeout', '5000', 'number', 'Timeout padrão para webhooks em ms'),
('max_retries', '3', 'number', 'Número máximo de tentativas de reenvio'),
('log_level', 'info', 'string', 'Nível de log do sistema'),
('rate_limit_per_minute', '1000', 'number', 'Limite de requisições por minuto'),
('enable_audit_log', 'true', 'boolean', 'Habilitar log de auditoria'),
('timezone', 'America/Sao_Paulo', 'string', 'Fuso horário do sistema')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas de webhooks
CREATE OR REPLACE VIEW v_webhook_stats AS
SELECT 
    DATE_TRUNC('day', recebido_em) as data,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN status = 200 THEN 1 END) as sucessos,
    COUNT(CASE WHEN status != 200 THEN 1 END) as erros,
    AVG(tempo_resposta) as tempo_resposta_medio,
    SUM(destinos_enviados) as total_destinos_enviados
FROM logs_webhook
GROUP BY DATE_TRUNC('day', recebido_em)
ORDER BY data DESC;

-- View para estatísticas por redirecionamento
CREATE OR REPLACE VIEW v_redirecionamento_stats AS
SELECT 
    r.id,
    r.nome,
    r.slug,
    r.ativo,
    COUNT(l.id) as total_webhooks,
    COUNT(CASE WHEN l.status = 200 THEN 1 END) as sucessos,
    COUNT(CASE WHEN l.status != 200 THEN 1 END) as erros,
    AVG(l.tempo_resposta) as tempo_resposta_medio,
    MAX(l.recebido_em) as ultimo_webhook
FROM redirecionamentos r
LEFT JOIN logs_webhook l ON r.slug = l.slug_redirecionamento
GROUP BY r.id, r.nome, r.slug, r.ativo;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE redirecionamentos IS 'Tabela principal para armazenar configurações de redirecionamento de webhooks';
COMMENT ON TABLE logs_webhook IS 'Log de todos os webhooks recebidos e processados';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com diferentes níveis de acesso';
COMMENT ON TABLE audit_log IS 'Log de auditoria para rastrear ações dos usuários';
COMMENT ON TABLE configuracoes IS 'Configurações gerais do sistema';
COMMENT ON TABLE webhook_endpoints IS 'Endpoints personalizados de webhook';
COMMENT ON TABLE webhook_destinations IS 'Destinos de webhook para cada endpoint';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
