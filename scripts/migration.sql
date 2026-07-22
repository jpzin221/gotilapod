-- =============================================
-- MIGRAÇÃO COMPLETA: Execute no SQL Editor do Supabase Dashboard
-- =============================================

-- 1. FIX: Storage policies — permitir upload de imagens (resolve erro ao subir logo/fotos)
-- O bucket product-images é público mas não tinha política de INSERT para anon
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
  CREATE POLICY "Allow anon uploads" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Adicionar colunas faltantes na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_color text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS puff_count integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_discount_percent numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS detailed_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images jsonb;

-- 3. Migrar dados existentes: copiar image_url para o array images
UPDATE products SET images = jsonb_build_array(image_url) WHERE image_url IS NOT NULL AND images IS NULL;

-- 4. Garantir que a tabela flavors tenha a coluna emoji
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS emoji text DEFAULT '';
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 5. Garantir que a tabela product_flavors exista com as colunas corretas
CREATE TABLE IF NOT EXISTS product_flavors (
  id bigserial PRIMARY KEY,
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  flavor_id bigint REFERENCES flavors(id) ON DELETE CASCADE,
  stock integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, flavor_id)
);

-- 6. Habilitar RLS
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors ENABLE ROW LEVEL SECURITY;

-- 7. Políticas para tabelas
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

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read flavors" ON flavors;
  CREATE POLICY "Public read flavors" ON flavors FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
