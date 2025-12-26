-- ========================================
-- REMOVER COLUNA badgeColor
-- ========================================

-- Remover coluna badgeColor da tabela products
ALTER TABLE products 
DROP COLUMN IF EXISTS badgeColor;

-- Verificação
SELECT 'Coluna badgeColor removida com sucesso!' as status;

-- Mostrar colunas restantes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
