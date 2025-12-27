-- ===========================================================
-- SCRIPT PARA VERIFICAR E CORRIGIR ESTRUTURA DE PRODUCTS
-- Execute PRIMEIRO este script no Supabase SQL Editor
-- ===========================================================

-- ===== PASSO 1: VERIFICAR SE A COLUNA category_id EXISTE =====
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- ===== PASSO 2: ADICIONAR COLUNA category_id SE NÃO EXISTIR =====
-- Se a coluna não aparecer acima, execute este comando:
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- ===== PASSO 3: ATUALIZAR category_id BASEADO NO CAMPO category EXISTENTE =====
-- Este comando atualiza todos os produtos que têm category (string) mas não têm category_id

-- Para Ignite
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'ignite' 
  AND LOWER(p.category) = 'ignite'
  AND p.category_id IS NULL;

-- Para Elf Bar
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(REPLACE(c.name, ' ', '')) = 'elfbar' 
  AND LOWER(REPLACE(p.category, ' ', '')) = 'elfbar'
  AND p.category_id IS NULL;

-- Para Geek Bar
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(REPLACE(c.name, ' ', '')) = 'geekbar' 
  AND LOWER(REPLACE(p.category, ' ', '')) = 'geekbar'
  AND p.category_id IS NULL;

-- Para Lost Mary
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(REPLACE(c.name, ' ', '')) = 'lostmary' 
  AND LOWER(REPLACE(p.category, ' ', '')) = 'lostmary'
  AND p.category_id IS NULL;

-- Para OxBar
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'oxbar' 
  AND LOWER(p.category) = 'oxbar'
  AND p.category_id IS NULL;

-- Para LifePod
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'lifepod' 
  AND LOWER(p.category) = 'lifepod'
  AND p.category_id IS NULL;

-- Para Waka
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'waka' 
  AND LOWER(p.category) = 'waka'
  AND p.category_id IS NULL;

-- Para RabBeats
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'rabbeats' 
  AND LOWER(p.category) = 'rabbeats'
  AND p.category_id IS NULL;

-- Para Gorila Bolador
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) LIKE '%bolador%' 
  AND LOWER(p.category) LIKE '%bolador%'
  AND p.category_id IS NULL;

-- ===== PASSO 4: VERIFICAR RESULTADO =====
SELECT id, name, category, category_id 
FROM products 
ORDER BY category NULLS LAST;

-- Verificar quais produtos ainda estão sem categoria
SELECT id, name, category, category_id 
FROM products 
WHERE category_id IS NULL OR category IS NULL OR category = '';
