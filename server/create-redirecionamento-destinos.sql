-- =====================================================
-- Criação da Tabela Normalizada para Destinos de Redirecionamentos
-- =====================================================

-- 1. Criar tabela redirecionamento_destinos
CREATE TABLE IF NOT EXISTS redirecionamento_destinos (
    id SERIAL PRIMARY KEY,
    redirecionamento_id INTEGER NOT NULL REFERENCES redirecionamentos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL DEFAULT 'Destino',
    url TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    timeout INTEGER DEFAULT 5000,
    max_tentativas INTEGER DEFAULT 3,
    headers_personalizados JSONB,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_redirecionamento_destinos_redirecionamento_id 
ON redirecionamento_destinos(redirecionamento_id);
CREATE INDEX IF NOT EXISTS idx_redirecionamento_destinos_ativo 
ON redirecionamento_destinos(ativo);
CREATE INDEX IF NOT EXISTS idx_redirecionamento_destinos_ordem 
ON redirecionamento_destinos(redirecionamento_id, ordem);

-- 3. Trigger para atualizar updated_at
CREATE TRIGGER update_redirecionamento_destinos_updated_at 
    BEFORE UPDATE ON redirecionamento_destinos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Migrar dados existentes
DO $$
DECLARE
    rec RECORD;
    url_item TEXT;
    url_index INTEGER := 0;
    clean_url TEXT;
    parsed_json JSONB;
    url_array TEXT[];
BEGIN
    RAISE NOTICE 'Iniciando migração de dados...';
    
    -- Para cada redirecionamento existente
    FOR rec IN SELECT id, nome, slug, urls FROM redirecionamentos WHERE urls IS NOT NULL AND urls != ''
    LOOP
        RAISE NOTICE 'Migrando redirecionamento ID: %, Nome: %', rec.id, rec.nome;
        url_index := 0;
        
        -- Verificar se já existem destinos para este redirecionamento
        IF EXISTS (SELECT 1 FROM redirecionamento_destinos WHERE redirecionamento_id = rec.id) THEN
            RAISE NOTICE 'Destinos já existem para redirecionamento ID: %, pulando...', rec.id;
            CONTINUE;
        END IF;
        
        -- Tentar diferentes formatos de dados
        BEGIN
            -- Primeiro, tentar JSON
            parsed_json := rec.urls::JSONB;
            
            IF jsonb_typeof(parsed_json) = 'array' THEN
                -- Array JSON válido
                FOR url_item IN SELECT jsonb_array_elements_text(parsed_json)
                LOOP
                    clean_url := TRIM(url_item);
                    IF clean_url != '' AND clean_url != 'null' THEN
                        INSERT INTO redirecionamento_destinos (redirecionamento_id, nome, url, ativo, ordem)
                        VALUES (rec.id, 'Destino ' || (url_index + 1), clean_url, true, url_index);
                        RAISE NOTICE 'Inserido destino JSON: %', clean_url;
                        url_index := url_index + 1;
                    END IF;
                END LOOP;
            ELSE
                -- JSON object ou string
                clean_url := TRIM(parsed_json::TEXT, '"');
                IF clean_url != '' AND clean_url != 'null' THEN
                    INSERT INTO redirecionamento_destinos (redirecionamento_id, nome, url, ativo, ordem)
                    VALUES (rec.id, 'Destino Principal', clean_url, true, 0);
                    RAISE NOTICE 'Inserido destino JSON object: %', clean_url;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Não é JSON, tentar como string separada por vírgulas
            RAISE NOTICE 'Não é JSON válido, tentando string separada por vírgulas...';
            
            -- Limpar possível JSON malformado
            clean_url := rec.urls;
            clean_url := REPLACE(clean_url, '"{\"', '');
            clean_url := REPLACE(clean_url, '\"}"', '');
            clean_url := REPLACE(clean_url, '\\"', '"');
            
            -- Tentar novamente como JSON após limpeza
            BEGIN
                parsed_json := clean_url::JSONB;
                IF jsonb_typeof(parsed_json) = 'object' AND parsed_json ? 'url' THEN
                    clean_url := parsed_json->>'url';
                    IF clean_url != '' THEN
                        INSERT INTO redirecionamento_destinos (redirecionamento_id, nome, url, ativo, ordem)
                        VALUES (rec.id, 'Destino Principal', clean_url, 
                               COALESCE((parsed_json->>'ativo')::BOOLEAN, true), 0);
                        RAISE NOTICE 'Inserido destino JSON limpo: %', clean_url;
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Última tentativa: string separada por vírgulas
                url_array := string_to_array(clean_url, ',');
                
                FOREACH url_item IN ARRAY url_array
                LOOP
                    clean_url := TRIM(url_item);
                    IF clean_url != '' THEN
                        INSERT INTO redirecionamento_destinos (redirecionamento_id, nome, url, ativo, ordem)
                        VALUES (rec.id, 'Destino ' || (url_index + 1), clean_url, true, url_index);
                        RAISE NOTICE 'Inserido destino string: %', clean_url;
                        url_index := url_index + 1;
                    END IF;
                END LOOP;
            END;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migração concluída!';
END $$;

-- 5. Verificar resultados da migração
SELECT 
    r.id as redirecionamento_id,
    r.nome,
    r.slug,
    r.ativo as redirecionamento_ativo,
    COUNT(rd.id) as total_destinos,
    COUNT(CASE WHEN rd.ativo THEN 1 END) as destinos_ativos,
    STRING_AGG(rd.url, ', ' ORDER BY rd.ordem) as urls_migradas
FROM redirecionamentos r
LEFT JOIN redirecionamento_destinos rd ON r.id = rd.redirecionamento_id
GROUP BY r.id, r.nome, r.slug, r.ativo
ORDER BY r.id;

-- 6. Comentários
COMMENT ON TABLE redirecionamento_destinos IS 'Destinos normalizados para cada redirecionamento de webhook';
COMMENT ON COLUMN redirecionamento_destinos.redirecionamento_id IS 'ID do redirecionamento pai';
COMMENT ON COLUMN redirecionamento_destinos.url IS 'URL de destino para onde o webhook será enviado';
COMMENT ON COLUMN redirecionamento_destinos.ativo IS 'Se este destino específico está ativo';
COMMENT ON COLUMN redirecionamento_destinos.ordem IS 'Ordem de envio dos destinos';
COMMENT ON COLUMN redirecionamento_destinos.timeout IS 'Timeout específico para este destino em ms';
COMMENT ON COLUMN redirecionamento_destinos.max_tentativas IS 'Número máximo de tentativas para este destino';
