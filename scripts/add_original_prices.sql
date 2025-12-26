-- Script para adicionar preços originais aos produtos
-- Isso permitirá exibir o valor original riscado e o valor com desconto

-- Primeiro, verificar se a coluna original_price existe
-- Se não existir, criar a coluna
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Atualizar produtos com preços originais para simular descontos
-- Exemplo: produtos de R$ 85 teriam preço original de R$ 95 (desconto de ~10%)

-- Atualizar produtos com preço R$ 85,00 (desconto de 10,5%)
UPDATE products 
SET original_price = 95.00 
WHERE price = 85.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 65,00 (desconto de 13%)
UPDATE products 
SET original_price = 75.00 
WHERE price = 65.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 120,00 (desconto de 14%)
UPDATE products 
SET original_price = 140.00 
WHERE price = 120.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 45,00 (desconto de 10%)
UPDATE products 
SET original_price = 50.00 
WHERE price = 45.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 80,00 (desconto de 11%)
UPDATE products 
SET original_price = 90.00 
WHERE price = 80.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 55,00 (desconto de 15%)
UPDATE products 
SET original_price = 65.00 
WHERE price = 55.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 70,00 (desconto de 12,5%)
UPDATE products 
SET original_price = 80.00 
WHERE price = 70.00 AND (original_price IS NULL OR original_price = 0);

-- Atualizar produtos com preço R$ 100,00 (desconto de 16%)
UPDATE products 
SET original_price = 120.00 
WHERE price = 100.00 AND (original_price IS NULL OR original_price = 0);

-- Verificar os produtos atualizados
SELECT 
  id,
  name,
  price as "Preço Atual",
  original_price as "Preço Original",
  CASE 
    WHEN original_price > 0 THEN 
      ROUND(((original_price - price) / original_price * 100)::numeric, 0)
    ELSE 0 
  END as "Desconto %"
FROM products
WHERE original_price IS NOT NULL AND original_price > 0
ORDER BY price DESC;
