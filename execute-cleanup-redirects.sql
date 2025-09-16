-- =====================================================
-- SCRIPT DE LIMPEZA DEFINITIVO
-- Execute APENAS após verificar com o script safe-cleanup-redirects.sql
-- =====================================================

-- ATENÇÃO: Este script irá DELETAR dados permanentemente!
-- Faça backup do banco antes de executar!

BEGIN;

-- 1. Deletar logs de webhook com slugs órfãos
DELETE FROM logs_webhook 
WHERE slug_redirecionamento NOT IN (
    SELECT slug FROM redirecionamentos WHERE ativo = true
);

-- 2. Deletar destinos órfãos (se existir tabela destinos)
DELETE FROM destinos 
WHERE redirecionamento_id NOT IN (
    SELECT id FROM redirecionamentos WHERE ativo = true
);

-- 3. Deletar redirecionamento_destinos órfãos (se existir)
DELETE FROM redirecionamento_destinos 
WHERE redirecionamento_id NOT IN (
    SELECT id FROM redirecionamentos WHERE ativo = true
);

-- 4. Verificar resultado
SELECT '=== RESULTADO APÓS LIMPEZA ===' as info;

-- Redirecionamentos ativos
SELECT 'Redirecionamentos ativos:' as info;
SELECT id, nome, slug, ativo, criado_em 
FROM redirecionamentos 
WHERE ativo = true 
ORDER BY id;

-- Logs restantes por slug
SELECT 'Logs restantes por slug:' as info;
SELECT 
    l.slug_redirecionamento,
    COUNT(*) as total_logs,
    MAX(l.recebido_em) as ultimo_log
FROM logs_webhook l
GROUP BY l.slug_redirecionamento
ORDER BY total_logs DESC;

-- Estatísticas finais
SELECT 'Estatísticas finais:' as info;
SELECT 
    (SELECT COUNT(*) FROM redirecionamentos WHERE ativo = true) as redirecionamentos_ativos,
    (SELECT COUNT(*) FROM logs_webhook) as total_logs,
    (SELECT COUNT(DISTINCT slug_redirecionamento) FROM logs_webhook) as slugs_unicos_com_logs;

-- Se tudo estiver correto, descomente a linha abaixo para confirmar as mudanças
-- COMMIT;

-- Se algo estiver errado, descomente a linha abaixo para reverter
-- ROLLBACK;
