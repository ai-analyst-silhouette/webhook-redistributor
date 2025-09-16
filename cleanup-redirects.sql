-- =====================================================
-- Script de Limpeza de Redirecionamentos Órfãos
-- Execute este script para limpar registros órfãos
-- =====================================================

-- ATENÇÃO: Este script irá deletar dados. Faça backup antes de executar!

-- 1. Primeiro, vamos ver o que será deletado (EXECUTE PRIMEIRO PARA VER)
-- Descomente as linhas abaixo para ver o que será deletado antes de executar a limpeza

/*
-- Ver logs que serão deletados
SELECT 'LOGS QUE SERÃO DELETADOS:' as info;
SELECT l.id, l.slug_redirecionamento, l.recebido_em, l.status
FROM logs_webhook l
LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug
WHERE r.slug IS NULL
ORDER BY l.recebido_em DESC;

-- Ver destinos que serão deletados
SELECT 'DESTINOS QUE SERÃO DELETADOS:' as info;
SELECT d.id, d.redirecionamento_id, d.url
FROM destinos d
LEFT JOIN redirecionamentos r ON d.redirecionamento_id = r.id
WHERE r.id IS NULL;

-- Ver redirecionamento_destinos que serão deletados
SELECT 'REDIRECIONAMENTO_DESTINOS QUE SERÃO DELETADOS:' as info;
SELECT rd.id, rd.redirecionamento_id, rd.url
FROM redirecionamento_destinos rd
LEFT JOIN redirecionamentos r ON rd.redirecionamento_id = r.id
WHERE r.id IS NULL;
*/

-- 2. LIMPEZA REAL (descomente para executar)

-- Deletar logs de webhook com slugs órfãos
DELETE FROM logs_webhook 
WHERE slug_redirecionamento NOT IN (
    SELECT slug FROM redirecionamentos WHERE ativo = true
);

-- Deletar destinos órfãos (se existir tabela destinos)
DELETE FROM destinos 
WHERE redirecionamento_id NOT IN (
    SELECT id FROM redirecionamentos WHERE ativo = true
);

-- Deletar redirecionamento_destinos órfãos (se existir)
DELETE FROM redirecionamento_destinos 
WHERE redirecionamento_id NOT IN (
    SELECT id FROM redirecionamentos WHERE ativo = true
);

-- 3. Verificar resultado após limpeza
SELECT 'RESULTADO APÓS LIMPEZA:' as info;

-- Redirecionamentos ativos
SELECT 'REDIRECIONAMENTOS ATIVOS:' as info;
SELECT id, nome, slug, ativo, criado_em 
FROM redirecionamentos 
WHERE ativo = true 
ORDER BY id;

-- Logs restantes por slug
SELECT 'LOGS RESTANTES POR SLUG:' as info;
SELECT 
    l.slug_redirecionamento,
    COUNT(*) as total_logs,
    MAX(l.recebido_em) as ultimo_log
FROM logs_webhook l
GROUP BY l.slug_redirecionamento
ORDER BY total_logs DESC;

-- 4. Estatísticas finais
SELECT 'ESTATÍSTICAS FINAIS:' as info;
SELECT 
    (SELECT COUNT(*) FROM redirecionamentos WHERE ativo = true) as redirecionamentos_ativos,
    (SELECT COUNT(*) FROM logs_webhook) as total_logs,
    (SELECT COUNT(DISTINCT slug_redirecionamento) FROM logs_webhook) as slugs_unicos_com_logs;
