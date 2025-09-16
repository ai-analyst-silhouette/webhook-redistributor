-- =====================================================
-- Script SEGURO de Limpeza de Redirecionamentos Órfãos
-- Execute este script para ver o que será deletado ANTES de fazer a limpeza
-- =====================================================

-- 1. VERIFICAR REDIRECIONAMENTOS ATIVOS
SELECT '=== REDIRECIONAMENTOS ATIVOS ===' as info;
SELECT id, nome, slug, ativo, criado_em 
FROM redirecionamentos 
WHERE ativo = true 
ORDER BY id;

-- 2. VERIFICAR LOGS ÓRFÃOS (que serão deletados)
SELECT '=== LOGS ÓRFÃOS QUE SERÃO DELETADOS ===' as info;
SELECT 
    l.id,
    l.slug_redirecionamento,
    l.recebido_em,
    l.status,
    l.destinos_enviados
FROM logs_webhook l
LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug
WHERE r.slug IS NULL
ORDER BY l.recebido_em DESC
LIMIT 20;

-- 3. CONTAR LOGS ÓRFÃOS
SELECT '=== CONTAGEM DE LOGS ÓRFÃOS ===' as info;
SELECT COUNT(*) as total_logs_orfaos
FROM logs_webhook l
LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug
WHERE r.slug IS NULL;

-- 4. VERIFICAR DESTINOS ÓRFÃOS (se existir)
SELECT '=== DESTINOS ÓRFÃOS (se existir) ===' as info;
SELECT COUNT(*) as total_destinos_orfaos
FROM destinos d
LEFT JOIN redirecionamentos r ON d.redirecionamento_id = r.id
WHERE r.id IS NULL;

-- 5. VERIFICAR REDIRECIONAMENTO_DESTINOS ÓRFÃOS (se existir)
SELECT '=== REDIRECIONAMENTO_DESTINOS ÓRFÃOS (se existir) ===' as info;
SELECT COUNT(*) as total_redirecionamento_destinos_orfaos
FROM redirecionamento_destinos rd
LEFT JOIN redirecionamentos r ON rd.redirecionamento_id = r.id
WHERE r.id IS NULL;

-- 6. VERIFICAR LOGS POR SLUG (antes da limpeza)
SELECT '=== LOGS POR SLUG (ANTES DA LIMPEZA) ===' as info;
SELECT 
    l.slug_redirecionamento,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN l.status = 200 THEN 1 END) as sucessos,
    COUNT(CASE WHEN l.status != 200 THEN 1 END) as erros,
    MAX(l.recebido_em) as ultimo_webhook,
    CASE 
        WHEN r.slug IS NULL THEN 'ÓRFÃO - SERÁ DELETADO'
        ELSE 'VÁLIDO - SERÁ MANTIDO'
    END as status
FROM logs_webhook l
LEFT JOIN redirecionamentos r ON l.slug_redirecionamento = r.slug
GROUP BY l.slug_redirecionamento, r.slug
ORDER BY total_logs DESC;

-- 7. VERIFICAR REDIRECIONAMENTOS INATIVOS COM LOGS
SELECT '=== REDIRECIONAMENTOS INATIVOS COM LOGS ===' as info;
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
