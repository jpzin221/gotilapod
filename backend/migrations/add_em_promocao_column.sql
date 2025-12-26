-- Adicionar coluna em_promocao na tabela products
-- Esta coluna permite marcar produtos para exibir na seção de promoções

ALTER TABLE products 
ADD COLUMN em_promocao BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance ao filtrar produtos em promoção
CREATE INDEX idx_products_em_promocao ON products(em_promocao);

-- Comentário na coluna
COMMENT ON COLUMN products.em_promocao IS 'Indica se o produto está em promoção de fim de ano';
