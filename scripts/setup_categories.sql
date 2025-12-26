-- SQL para garantir que as categorias estejam corretas no banco de dados
-- Execute este SQL ANTES de importar os produtos

-- Verificar categorias existentes
SELECT DISTINCT category FROM products ORDER BY category;

-- Se necessário, atualizar categorias antigas para as novas
UPDATE products SET category = 'IGNITE' WHERE category ILIKE '%ignite%' AND category != 'IGNITE';
UPDATE products SET category = 'GEEK BAR' WHERE category ILIKE '%geek%' AND category != 'GEEK BAR';
UPDATE products SET category = 'LOST MARY' WHERE category ILIKE '%lost%' AND category != 'LOST MARY';
UPDATE products SET category = 'ELF BAR' WHERE category ILIKE '%elf%' AND category != 'ELF BAR';
UPDATE products SET category = 'PODS' WHERE category ILIKE '%pod%' AND category != 'PODS';

-- Verificar resultado
SELECT category, COUNT(*) as total 
FROM products 
GROUP BY category 
ORDER BY category;

-- Categorias válidas para o sistema:
-- IGNITE
-- GEEK BAR
-- LOST MARY
-- ELF BAR
-- PODS
-- ACESSÓRIOS
