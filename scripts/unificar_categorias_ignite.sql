-- ===========================================================
-- SCRIPT PARA UNIFICAR CATEGORIAS IGNITE DUPLICADAS
-- Execute este script no Supabase SQL Editor
-- ===========================================================

-- 1. PRIMEIRO: Verificar as categorias duplicadas
SELECT id, name, slug, is_active, display_order 
FROM categories 
WHERE LOWER(name) LIKE '%ignite%';

-- 2. VERIFICAR: Quantos produtos cada categoria tem
SELECT 
  c.id AS category_id,
  c.name AS category_name,
  COUNT(p.id) AS total_produtos
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE LOWER(c.name) LIKE '%ignite%'
GROUP BY c.id, c.name;

-- ===========================================================
-- 3. EXECUTAR A UNIFICAÇÃO
-- Substitua os IDs corretos após verificar acima
-- ===========================================================

-- Identifique:
-- - ID_MANTER: o ID da categoria que você quer manter (ex: a que tem "Ignite" com 8 produtos)  
-- - ID_DELETAR: o ID da categoria duplicada (ex: a que tem "IGNITE" com 2 produtos)

-- PASSO 3A: Mover todos os produtos da categoria duplicada para a principal
-- UPDATE products 
-- SET category_id = <ID_MANTER>
-- WHERE category_id = <ID_DELETAR>;

-- PASSO 3B: Deletar a categoria duplicada (só execute após confirmar que não há mais produtos)
-- DELETE FROM categories WHERE id = <ID_DELETAR>;

-- ===========================================================
-- VERSÃO AUTOMÁTICA (mais arriscada, use com cuidado)
-- ===========================================================

-- Esta versão identifica automaticamente e faz a unificação
-- Ela mantém a categoria com MENOR ID e move os produtos das outras

DO $$
DECLARE
    v_main_category_id INTEGER;
    v_duplicate_ids INTEGER[];
BEGIN
    -- Encontrar a categoria principal (menor ID entre as duplicadas)
    SELECT MIN(id) INTO v_main_category_id
    FROM categories 
    WHERE LOWER(name) LIKE '%ignite%';
    
    -- Encontrar as categorias duplicadas (todas exceto a principal)
    SELECT ARRAY_AGG(id) INTO v_duplicate_ids
    FROM categories 
    WHERE LOWER(name) LIKE '%ignite%' AND id != v_main_category_id;
    
    IF v_duplicate_ids IS NOT NULL THEN
        -- Mover produtos das categorias duplicadas para a principal
        UPDATE products 
        SET category_id = v_main_category_id
        WHERE category_id = ANY(v_duplicate_ids);
        
        RAISE NOTICE 'Produtos movidos para categoria ID %', v_main_category_id;
        
        -- Deletar categorias duplicadas
        DELETE FROM categories WHERE id = ANY(v_duplicate_ids);
        
        RAISE NOTICE 'Categorias duplicadas deletadas: %', v_duplicate_ids;
    ELSE
        RAISE NOTICE 'Nenhuma categoria duplicada encontrada';
    END IF;
END $$;

-- 4. VERIFICAR resultado final
SELECT id, name, slug, is_active 
FROM categories 
WHERE LOWER(name) LIKE '%ignite%';

-- Verificar produtos
SELECT id, name, category_id 
FROM products 
WHERE category_id IN (SELECT id FROM categories WHERE LOWER(name) LIKE '%ignite%');
