-- =====================================================
-- Script para Verificar os 2 Redirecionamentos Ativos
-- =====================================================

-- 1. Verificar redirecionamentos ativos
SELECT '=== REDIRECIONAMENTOS ATIVOS ===' as info;
SELECT 
    id, 
    nome, 
    slug, 
    ativo, 
    criado_em,
    CASE 
        WHEN urls IS NOT NULL AND urls != '' THEN 'Tem URLs'
        ELSE 'Sem URLs'
    END as tem_urls
FROM redirecionamentos 
WHERE ativo = true 
ORDER BY id;

-- 2. Verificar se há redirecionamentos inativos
SELECT '=== REDIRECIONAMENTOS INATIVOS ===' as info;
SELECT 
    id, 
    nome, 
    slug, 
    ativo, 
    criado_em
FROM redirecionamentos 
WHERE ativo = false 
ORDER BY id;

-- 3. Verificar logs para cada redirecionamento ativo
SELECT '=== LOGS POR REDIRECIONAMENTO ATIVO ===' as info;
SELECT 
    r.id,
    r.nome,
    r.slug,
    COUNT(l.id) as total_logs,
    COUNT(CASE WHEN l.status = 200 THEN 1 END) as sucessos,
    COUNT(CASE WHEN l.status != 200 THEN 1 END) as erros,
    MAX(l.recebido_em) as ultimo_webhook,
    MIN(l.recebido_em) as primeiro_webhook
FROM redirecionamentos r
LEFT JOIN logs_webhook l ON r.slug = l.slug_redirecionamento
WHERE r.ativo = true
GROUP BY r.id, r.nome, r.slug
ORDER BY r.id;

-- 4. Verificar destinos para cada redirecionamento ativo (se existir)
SELECT '=== DESTINOS POR REDIRECIONAMENTO ATIVO ===' as info;
SELECT 
    r.id,
    r.nome,
    r.slug,
    COUNT(d.id) as total_destinos,
    COUNT(CASE WHEN d.ativo = true THEN 1 END) as destinos_ativos
FROM redirecionamentos r
LEFT JOIN destinos d ON r.id = d.redirecionamento_id
WHERE r.ativo = true
GROUP BY r.id, r.nome, r.slug
ORDER BY r.id;

-- 5. Verificar redirecionamento_destinos para cada redirecionamento ativo (se existir)
SELECT '=== REDIRECIONAMENTO_DESTINOS POR REDIRECIONAMENTO ATIVO ===' as info;
SELECT 
    r.id,
    r.nome,
    r.slug,
    COUNT(rd.id) as total_destinos,
    COUNT(CASE WHEN rd.ativo = true THEN 1 END) as destinos_ativos
FROM redirecionamentos r
LEFT JOIN redirecionamento_destinos rd ON r.id = rd.redirecionamento_id
WHERE r.ativo = true
GROUP BY r.id, r.nome, r.slug
ORDER BY r.id;

-- 6. Verificar se há logs órfãos (slugs que não existem mais)
SELECT '=== LOGS ÓRFÃOS (slugs que não existem mais) ===' as info;
SELECT 
    l.slug_redirecionamento,
    COUNT(*) as total_logs,
    MAX(l.recebido_em) as ultimo_log
FROM logs_webhook l
LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug
WHERE r.slug IS NULL
GROUP BY l.slug_redirecionamento
ORDER BY total_logs DESC;

-- 7. Resumo final
SELECT '=== RESUMO FINAL ===' as info;
SELECT 
    (SELECT COUNT(*) FROM redirecionamentos WHERE ativo = true) as redirecionamentos_ativos,
    (SELECT COUNT(*) FROM redirecionamentos WHERE ativo = false) as redirecionamentos_inativos,
    (SELECT COUNT(*) FROM logs_webhook) as total_logs,
    (SELECT COUNT(DISTINCT slug_redirecionamento) FROM logs_webhook) as slugs_unicos_com_logs,
    (SELECT COUNT(*) FROM logs_webhook l LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug WHERE r.slug IS NULL) as logs_orfaos;
