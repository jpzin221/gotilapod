-- ============================================
-- ADICIONAR COLUNA BADGE_COLOR NA TABELA PRODUCTS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Adicionar coluna badge_color se não existir
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS badge_color VARCHAR(20) DEFAULT 'purple';

-- Comentário explicativo
COMMENT ON COLUMN products.badge_color IS 'Cor do badge: purple (roxo), red (vermelho), gold (dourado)';

-- Verificação
SELECT 'Coluna badge_color adicionada com sucesso!' as status;

-- Mostrar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'badge_color';
