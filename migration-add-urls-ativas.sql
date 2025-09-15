-- =====================================================
-- Migração: Adicionar coluna urls_ativas à tabela redirecionamentos
-- =====================================================

-- Adicionar coluna urls_ativas como JSON para armazenar status individual das URLs
ALTER TABLE redirecionamentos 
ADD COLUMN IF NOT EXISTS urls_ativas TEXT DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN redirecionamentos.urls_ativas IS 'JSON object storing active status for each URL by index: {"0": true, "1": false, ...}';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'redirecionamentos' 
AND column_name = 'urls_ativas';
