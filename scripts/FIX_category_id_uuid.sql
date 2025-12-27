-- ===========================================================
-- FIX: CRIAR category_id COMO INTEGER (mesmo tipo que categories.id)
-- ===========================================================

-- ===== PASSO 1: VER ESTRUTURA DA TABELA CATEGORIES =====
SELECT id, name FROM categories ORDER BY name;

-- ===== PASSO 2: CRIAR COLUNA category_id COMO INTEGER =====
-- Primeiro, dropar a coluna antiga se existir com tipo errado
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

-- Criar coluna correta como INTEGER
ALTER TABLE products 
ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- ===== PASSO 3: MIGRAR DADOS BASEADO NO CAMPO CATEGORY (STRING) =====
-- Ignite
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(name) = 'ignite' LIMIT 1)
WHERE LOWER(p.category) = 'ignite' OR LOWER(p.category) LIKE '%ignite%';

-- Elf Bar / ElfBar
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(REPLACE(name, ' ', '')) = 'elfbar' LIMIT 1)
WHERE LOWER(REPLACE(p.category, ' ', '')) = 'elfbar';

-- Geek Bar / GeekBar
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(REPLACE(name, ' ', '')) = 'geekbar' LIMIT 1)
WHERE LOWER(REPLACE(p.category, ' ', '')) = 'geekbar';

-- Lost Mary
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(REPLACE(name, ' ', '')) = 'lostmary' LIMIT 1)
WHERE LOWER(REPLACE(p.category, ' ', '')) = 'lostmary';

-- OxBar
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(name) = 'oxbar' LIMIT 1)
WHERE LOWER(p.category) = 'oxbar' OR LOWER(p.category) LIKE '%oxbar%';

-- LifePod
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(name) = 'lifepod' LIMIT 1)
WHERE LOWER(p.category) = 'lifepod' OR LOWER(p.category) LIKE '%lifepod%';

-- Waka
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(name) = 'waka' LIMIT 1)
WHERE LOWER(p.category) = 'waka' OR LOWER(p.category) LIKE '%waka%';

-- RabBeats
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(name) = 'rabbeats' LIMIT 1)
WHERE LOWER(p.category) LIKE '%rabbeat%';

-- Gorila Bolador
UPDATE products p
SET category_id = (SELECT id FROM categories WHERE LOWER(name) LIKE '%bolador%' LIMIT 1)
WHERE LOWER(p.category) LIKE '%bolador%' OR LOWER(p.category) LIKE '%gorila%';

-- ===== PASSO 4: VERIFICAR RESULTADO =====
SELECT 
  p.id, 
  p.name, 
  p.category as category_string, 
  p.category_id,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
ORDER BY c.name NULLS LAST, p.name;

-- Verificar produtos sem categoria
SELECT id, name, category 
FROM products 
WHERE category_id IS NULL;
