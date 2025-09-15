-- =====================================================
-- Migração: Migrar URLs da coluna 'urls' para tabela 'destinos'
-- =====================================================

-- Script para migrar dados existentes
DO $$
DECLARE
    rec RECORD;
    url_array TEXT[];
    url_item TEXT;
    url_index INTEGER;
    urls_ativas_obj JSON;
    is_active BOOLEAN;
BEGIN
    -- Para cada redirecionamento existente
    FOR rec IN SELECT id, nome, urls, urls_ativas FROM redirecionamentos WHERE urls IS NOT NULL AND urls != ''
    LOOP
        RAISE NOTICE 'Migrando redirecionamento ID: %, Nome: %', rec.id, rec.nome;
        
        -- Dividir URLs por vírgula
        url_array := string_to_array(rec.urls, ',');
        
        -- Parse do JSON urls_ativas (se existir)
        BEGIN
            IF rec.urls_ativas IS NOT NULL AND rec.urls_ativas != '' THEN
                urls_ativas_obj := rec.urls_ativas::JSON;
            ELSE
                urls_ativas_obj := '{}'::JSON;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            urls_ativas_obj := '{}'::JSON;
        END;
        
        -- Inserir cada URL como um destino
        url_index := 0;
        FOREACH url_item IN ARRAY url_array
        LOOP
            -- Limpar espaços em branco
            url_item := TRIM(url_item);
            
            -- Verificar se a URL está ativa (padrão: true)
            BEGIN
                is_active := COALESCE((urls_ativas_obj->>url_index::TEXT)::BOOLEAN, true);
            EXCEPTION WHEN OTHERS THEN
                is_active := true;
            END;
            
            -- Inserir destino se a URL não estiver vazia
            IF url_item != '' THEN
                INSERT INTO destinos (redirecionamento_id, url, ativo, ordem)
                VALUES (rec.id, url_item, is_active, url_index);
                
                RAISE NOTICE 'Inserido destino: % (ativo: %)', url_item, is_active;
            END IF;
            
            url_index := url_index + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migração de URLs concluída!';
END $$;

-- Verificar resultados da migração
SELECT 
    r.id as redirecionamento_id,
    r.nome,
    COUNT(d.id) as total_destinos,
    COUNT(CASE WHEN d.ativo THEN 1 END) as destinos_ativos
FROM redirecionamentos r
LEFT JOIN destinos d ON r.id = d.redirecionamento_id
GROUP BY r.id, r.nome
ORDER BY r.id;
