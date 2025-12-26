-- ========================================
-- SISTEMA DE VENDA POR CAIXAS
-- ========================================

-- Adicionar colunas para venda por caixa
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS units_per_box INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS box_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS box_discount_percent DECIMAL(5,2);

-- Comentários nas colunas
COMMENT ON COLUMN products.units_per_box IS 'Quantidade de unidades por caixa (padrão: 10)';
COMMENT ON COLUMN products.box_price IS 'Preço da caixa (se null, calcula automaticamente)';
COMMENT ON COLUMN products.box_discount_percent IS 'Desconto percentual ao comprar caixa (ex: 15 = 15% off)';

-- Atualizar produtos existentes com valores padrão
UPDATE products 
SET 
  units_per_box = 10,
  box_discount_percent = 15.0
WHERE units_per_box IS NULL;

-- Verificação
SELECT 'Colunas de caixa adicionadas com sucesso!' as status;
SELECT id, name, price, units_per_box, box_price, box_discount_percent 
FROM products 
LIMIT 5;
