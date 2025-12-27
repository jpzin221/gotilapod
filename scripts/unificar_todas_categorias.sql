-- ===========================================================
-- SCRIPT COMPLETO PARA UNIFICAR TODAS AS CATEGORIAS DUPLICADAS
-- Execute este script no Supabase SQL Editor
-- ===========================================================

-- ===== PASSO 1: VERIFICAR SITUAÇÃO ATUAL =====
-- Listar todas as categorias e quantos produtos têm
SELECT 
  c.id AS category_id,
  c.name AS category_name,
  c.slug,
  c.is_active,
  COUNT(p.id) AS total_produtos
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.is_active
ORDER BY c.name;

-- Listar produtos com campo category (string) para ver inconsistências
SELECT DISTINCT category, COUNT(*) as qtd FROM products GROUP BY category ORDER BY category;

-- ===== PASSO 2: NORMALIZAR O CAMPO CATEGORY (STRING) =====
-- Isso vai padronizar os nomes das categorias nos produtos

-- IGNITE (Ignite, ignite, IGNITE -> Ignite)
UPDATE products 
SET category = 'Ignite' 
WHERE LOWER(category) = 'ignite' AND category != 'Ignite';

-- ELF BAR (ElfBar, ELF BAR, Elf Bar -> Elf Bar)
UPDATE products 
SET category = 'Elf Bar' 
WHERE LOWER(REPLACE(category, ' ', '')) = 'elfbar' AND category != 'Elf Bar';

-- GEEK BAR (GeekBar, GEEK BAR, Geek Bar -> Geek Bar)
UPDATE products 
SET category = 'Geek Bar' 
WHERE LOWER(REPLACE(category, ' ', '')) = 'geekbar' AND category != 'Geek Bar';

-- LOST MARY (LostMary, LOST MARY -> Lost Mary)
UPDATE products 
SET category = 'Lost Mary' 
WHERE LOWER(REPLACE(category, ' ', '')) = 'lostmary' AND category != 'Lost Mary';

-- OXBAR (OxBar, OXBAR, Ox Bar -> OxBar)
UPDATE products 
SET category = 'OxBar' 
WHERE LOWER(REPLACE(category, ' ', '')) IN ('oxbar', 'oxbar') AND category != 'OxBar';

-- LIFEPOD (LifePod, LIFEPOD -> LifePod)
UPDATE products 
SET category = 'LifePod' 
WHERE LOWER(category) = 'lifepod' AND category != 'LifePod';

-- WAKA
UPDATE products 
SET category = 'Waka' 
WHERE LOWER(category) = 'waka' AND category != 'Waka';

-- RABBEATS (RabBeats)
UPDATE products 
SET category = 'RabBeats' 
WHERE LOWER(category) = 'rabbeats' AND category != 'RabBeats';

-- GORILA BOLADOR
UPDATE products 
SET category = 'Gorila Bolador' 
WHERE LOWER(REPLACE(category, ' ', '')) = 'gorilabolador' AND category != 'Gorila Bolador';

-- ===== PASSO 3: ASSOCIAR PRODUTOS ÀS CATEGORIAS DO BANCO =====
-- Atualizar category_id para cada produto baseado no category (string)

-- Primeiro, vamos ver quais categorias existem no banco
SELECT id, name, slug FROM categories WHERE is_active = true ORDER BY name;

-- Agora associar os produtos às categorias corretas
-- (Execute após verificar os IDs das categorias acima)

-- Ignite
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'ignite' 
  AND LOWER(p.category) = 'ignite'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- Elf Bar
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'elf bar' 
  AND LOWER(p.category) = 'elf bar'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- Geek Bar
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'geek bar' 
  AND LOWER(p.category) = 'geek bar'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- Lost Mary
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'lost mary' 
  AND LOWER(p.category) = 'lost mary'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- OxBar
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'oxbar' 
  AND LOWER(p.category) = 'oxbar'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- LifePod
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'lifepod' 
  AND LOWER(p.category) = 'lifepod'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- Waka
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'waka' 
  AND LOWER(p.category) = 'waka'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- RabBeats
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) = 'rabbeats' 
  AND LOWER(p.category) = 'rabbeats'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- Gorila Bolador
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(c.name) LIKE '%bolador%' 
  AND LOWER(p.category) LIKE '%bolador%'
  AND (p.category_id IS NULL OR p.category_id != c.id);

-- ===== PASSO 4: DELETAR CATEGORIAS DUPLICADAS =====
-- Depois de mover os produtos, deletar as categorias vazias/duplicadas

-- Primeiro verificar quais categorias estão vazias
SELECT c.id, c.name, COUNT(p.id) as produtos
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(p.id) = 0
ORDER BY c.name;

-- CUIDADO: Só execute isso após confirmar que as categorias estão vazias!
-- DELETE FROM categories WHERE id IN (SELECT c.id FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id HAVING COUNT(p.id) = 0);

-- ===== PASSO 5: VERIFICAR RESULTADO FINAL =====
SELECT 
  c.name AS categoria,
  COUNT(p.id) AS produtos
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;

-- Verificar se ainda há produtos sem categoria
SELECT id, name, category, category_id 
FROM products 
WHERE category_id IS NULL;
