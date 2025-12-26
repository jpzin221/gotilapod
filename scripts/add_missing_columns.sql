-- ========================================
-- ADICIONAR COLUNAS FALTANTES
-- ========================================

-- Adicionar badgeColor se não existir
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS badgeColor VARCHAR(20) DEFAULT 'red';

-- Adicionar outras colunas que podem estar faltando
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS detailedDescription TEXT,
ADD COLUMN IF NOT EXISTS serves VARCHAR(100),
ADD COLUMN IF NOT EXISTS size VARCHAR(100);

-- Comentários
COMMENT ON COLUMN products.badgeColor IS 'Cor do badge: red, purple, gold';
COMMENT ON COLUMN products.detailedDescription IS 'Descrição detalhada do produto';
COMMENT ON COLUMN products.serves IS 'Informação de porções/uso';
COMMENT ON COLUMN products.size IS 'Tamanho/tipo do produto';

-- Verificação
SELECT 'Colunas adicionadas com sucesso!' as status;

-- Mostrar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
