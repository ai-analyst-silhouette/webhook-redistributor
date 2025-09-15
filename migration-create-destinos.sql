-- =====================================================
-- Migração: Criar tabela destinos e migrar dados
-- =====================================================

-- 1. Criar tabela destinos
CREATE TABLE IF NOT EXISTS destinos (
    id SERIAL PRIMARY KEY,
    redirecionamento_id INTEGER NOT NULL REFERENCES redirecionamentos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    timeout INTEGER DEFAULT 5000,
    max_tentativas INTEGER DEFAULT 3,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_destinos_redirecionamento_id ON destinos(redirecionamento_id);
CREATE INDEX IF NOT EXISTS idx_destinos_ativo ON destinos(ativo);
CREATE INDEX IF NOT EXISTS idx_destinos_ordem ON destinos(redirecionamento_id, ordem);

-- 3. Comentários
COMMENT ON TABLE destinos IS 'URLs de destino para cada redirecionamento';
COMMENT ON COLUMN destinos.redirecionamento_id IS 'ID do redirecionamento pai';
COMMENT ON COLUMN destinos.url IS 'URL de destino para onde o webhook será enviado';
COMMENT ON COLUMN destinos.ativo IS 'Se este destino está ativo';
COMMENT ON COLUMN destinos.ordem IS 'Ordem de envio (para envio sequencial)';
COMMENT ON COLUMN destinos.timeout IS 'Timeout específico para este destino em ms';
COMMENT ON COLUMN destinos.max_tentativas IS 'Número máximo de tentativas para este destino';

-- 4. Verificar se a tabela foi criada
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'destinos' 
ORDER BY ordinal_position;
