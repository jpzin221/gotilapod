-- =============================================
-- MIGRAÇÃO: Adicionar colunas faltantes na tabela products
-- Execute este script no SQL Editor do Supabase Dashboard
-- =============================================

-- Adicionar colunas que o código espera mas não existem no banco
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_color text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS puff_count integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_discount_percent numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS detailed_description text;

-- Verificar se a coluna image existe (o código usa image_url)
-- Se image_url não existir, criar a partir de uma coluna image se houver
-- (O código já foi atualizado para usar image_url)

-- Garantir que a tabela flavors tenha a coluna emoji
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS emoji text DEFAULT '';
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Garantir que a tabela product_flavors exista com as colunas corretas
CREATE TABLE IF NOT EXISTS product_flavors (
  id bigserial PRIMARY KEY,
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  flavor_id bigint REFERENCES flavors(id) ON DELETE CASCADE,
  stock integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, flavor_id)
);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (service_role pode fazer tudo)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for service role" ON flavors;
  CREATE POLICY "Allow all for service role" ON flavors FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for service role" ON product_flavors;
  CREATE POLICY "Allow all for service role" ON product_flavors FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Permitir leitura pública de sabores
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read flavors" ON flavors;
  CREATE POLICY "Public read flavors" ON flavors FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
