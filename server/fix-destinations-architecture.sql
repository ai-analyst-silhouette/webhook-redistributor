-- =====================================================
-- Correção da Arquitetura de Destinos
-- =====================================================

-- 1. Adicionar coluna redirecionamento_id na tabela webhook_destinations
-- (Para relacionar com a tabela redirecionamentos existente)
ALTER TABLE webhook_destinations 
ADD COLUMN IF NOT EXISTS redirecionamento_id INTEGER REFERENCES redirecionamentos(id) ON DELETE CASCADE;

-- 2. Criar índice para a nova relação
CREATE INDEX IF NOT EXISTS idx_webhook_destinations_redirecionamento_id 
ON webhook_destinations(redirecionamento_id);

-- 3. Migrar dados existentes da coluna urls para webhook_destinations
DO $$
DECLARE
    rec RECORD;
    url_item TEXT;
    url_index INTEGER := 0;
    clean_url TEXT;
    parsed_json JSONB;
BEGIN
    -- Para cada redirecionamento existente
    FOR rec IN SELECT id, nome, slug, urls FROM redirecionamentos WHERE urls IS NOT NULL AND urls != ''
    LOOP
        RAISE NOTICE 'Migrando redirecionamento ID: %, Nome: %', rec.id, rec.nome;
        url_index := 0;
        
        -- Verificar se é JSON ou string simples
        BEGIN
            -- Tentar fazer parse como JSON
            parsed_json := rec.urls::JSONB;
            
            -- Se é JSON, processar cada item
            IF jsonb_typeof(parsed_json) = 'array' THEN
                -- Array JSON
                FOR url_item IN SELECT jsonb_array_elements_text(parsed_json)
                LOOP
                    clean_url := TRIM(url_item);
                    IF clean_url != '' THEN
                        INSERT INTO webhook_destinations (redirecionamento_id, url, ativo, ordem, nome)
                        VALUES (rec.id, clean_url, true, url_index, 'Destino ' || (url_index + 1));
                        url_index := url_index + 1;
                    END IF;
                END LOOP;
            ELSE
                -- JSON object (caso malformado)
                clean_url := TRIM(parsed_json::TEXT, '"');
                IF clean_url != '' AND clean_url != 'null' THEN
                    INSERT INTO webhook_destinations (redirecionamento_id, url, ativo, ordem, nome)
                    VALUES (rec.id, clean_url, true, 0, 'Destino Principal');
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Não é JSON válido, tratar como string separada por vírgulas
            RAISE NOTICE 'Tratando como string separada por vírgulas: %', rec.urls;
            
            -- Dividir por vírgulas e inserir cada URL
            FOR url_item IN SELECT UNNEST(string_to_array(rec.urls, ','))
            LOOP
                clean_url := TRIM(url_item);
                IF clean_url != '' THEN
                    INSERT INTO webhook_destinations (redirecionamento_id, url, ativo, ordem, nome)
                    VALUES (rec.id, clean_url, true, url_index, 'Destino ' || (url_index + 1));
                    url_index := url_index + 1;
                END IF;
            END LOOP;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migração concluída!';
END $$;

-- 4. Verificar resultados da migração
SELECT 
    r.id as redirecionamento_id,
    r.nome,
    r.slug,
    COUNT(wd.id) as total_destinos,
    COUNT(CASE WHEN wd.ativo THEN 1 END) as destinos_ativos,
    STRING_AGG(wd.url, ', ' ORDER BY wd.ordem) as urls_migradas
FROM redirecionamentos r
LEFT JOIN webhook_destinations wd ON r.id = wd.redirecionamento_id
GROUP BY r.id, r.nome, r.slug
ORDER BY r.id;
