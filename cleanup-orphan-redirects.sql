-- =====================================================
-- Script de Limpeza de Redirecionamentos Órfãos
-- =====================================================

-- 1. Verificar redirecionamentos ativos na tabela redirecionamentos
SELECT 'REDIRECIONAMENTOS ATIVOS:' as info;
SELECT id, nome, slug, ativo, criado_em 
FROM redirecionamentos 
WHERE ativo = true 
ORDER BY id;

-- 2. Verificar logs de webhook com slugs que não existem mais
SELECT 'LOGS COM SLUGS ÓRFÃOS:' as info;
SELECT DISTINCT l.slug_redirecionamento, COUNT(*) as total_logs
FROM logs_webhook l
LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug
WHERE r.slug IS NULL
GROUP BY l.slug_redirecionamento
ORDER BY total_logs DESC;

-- 3. Verificar destinos órfãos (se existir tabela destinos)
SELECT 'DESTINOS ÓRFÃOS:' as info;
SELECT d.id, d.redirecionamento_id, d.url, d.ativo
FROM destinos d
LEFT JOIN redirecionamentos r ON d.redirecionamento_id = r.id
WHERE r.id IS NULL;

-- 4. Verificar redirecionamento_destinos órfãos (se existir)
SELECT 'REDIRECIONAMENTO_DESTINOS ÓRFÃOS:' as info;
SELECT rd.id, rd.redirecionamento_id, rd.url, rd.ativo
FROM redirecionamento_destinos rd
LEFT JOIN redirecionamentos r ON rd.redirecionamento_id = r.id
WHERE r.id IS NULL;

-- 5. Contar total de logs por slug
SELECT 'TOTAL DE LOGS POR SLUG:' as info;
SELECT 
    l.slug_redirecionamento,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN l.status = 200 THEN 1 END) as sucessos,
    COUNT(CASE WHEN l.status != 200 THEN 1 END) as erros,
    MAX(l.recebido_em) as ultimo_webhook
FROM logs_webhook l
GROUP BY l.slug_redirecionamento
ORDER BY total_logs DESC;

-- 6. Verificar se há redirecionamentos inativos que ainda têm logs recentes
SELECT 'REDIRECIONAMENTOS INATIVOS COM LOGS RECENTES:' as info;
SELECT 
    r.id, 
    r.nome, 
    r.slug, 
    r.ativo,
    COUNT(l.id) as total_logs,
    MAX(l.recebido_em) as ultimo_log
FROM redirecionamentos r
LEFT JOIN logs_webhook l ON r.slug = l.slug_redirecionamento
WHERE r.ativo = false
GROUP BY r.id, r.nome, r.slug, r.ativo
HAVING COUNT(l.id) > 0
ORDER BY ultimo_log DESC;
