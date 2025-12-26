-- ========================================
-- SISTEMA DE SABORES E ESTOQUE DE PODS
-- ========================================

-- 1. TABELA DE SABORES DISPONÍVEIS
CREATE TABLE IF NOT EXISTS flavors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_flavors_active ON flavors(is_active);
CREATE INDEX IF NOT EXISTS idx_flavors_name ON flavors(name);

-- 3. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_flavors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_flavors_updated_at ON flavors;
CREATE TRIGGER trigger_update_flavors_updated_at
  BEFORE UPDATE ON flavors
  FOR EACH ROW
  EXECUTE FUNCTION update_flavors_updated_at();

-- 4. INSERIR SABORES POPULARES (Baseado em marcas reais)
INSERT INTO flavors (name, description) VALUES
-- Ignite V5000
('Banana Ice', 'Banana com toque gelado'),
('Blueberry Ice', 'Mirtilo refrescante'),
('Grape Ice', 'Uva gelada'),
('Lush Ice', 'Melancia gelada'),
('Mango Ice', 'Manga tropical gelada'),
('Mint Ice', 'Menta refrescante'),
('Passion Fruit', 'Maracujá'),
('Peach Ice', 'Pêssego gelado'),
('Pineapple Ice', 'Abacaxi gelado'),
('Strawberry Ice', 'Morango gelado'),
('Watermelon Ice', 'Melancia refrescante'),

-- Geek Bar
('Blue Razz Ice', 'Framboesa azul gelada'),
('Cotton Candy', 'Algodão doce'),
('Energy Drink', 'Energético'),
('Lemon Mint', 'Limão com menta'),
('Mixed Berries', 'Frutas vermelhas'),
('Pink Lemonade', 'Limonada rosa'),
('Sour Apple', 'Maçã verde azeda'),
('Strawberry Banana', 'Morango com banana'),
('Tropical Fruit', 'Frutas tropicais'),

-- Lost Mary
('Blueberry Raspberry', 'Mirtilo com framboesa'),
('Cherry Ice', 'Cereja gelada'),
('Kiwi Passion Fruit', 'Kiwi com maracujá'),
('Mango Peach', 'Manga com pêssego'),
('Red Apple Ice', 'Maçã vermelha gelada'),
('Strawberry Kiwi', 'Morango com kiwi'),
('Triple Berry', 'Três frutas vermelhas'),
('Watermelon Lemon', 'Melancia com limão'),

-- Elf Bar
('Blueberry Sour Raspberry', 'Mirtilo com framboesa azeda'),
('Cola', 'Refrigerante de cola'),
('Cream Tobacco', 'Tabaco cremoso'),
('Grape', 'Uva'),
('Kiwi Strawberry', 'Kiwi com morango'),
('Lychee Ice', 'Lichia gelada'),
('Peach Mango', 'Pêssego com manga'),
('Pineapple Coconut', 'Abacaxi com coco'),
('Strawberry Ice Cream', 'Sorvete de morango'),
('Watermelon Bubblegum', 'Melancia com chiclete'),

-- Sabores Clássicos
('Classic Tobacco', 'Tabaco clássico'),
('Menthol', 'Mentol'),
('Virginia Tobacco', 'Tabaco Virginia'),
('Cool Mint', 'Menta gelada'),
('Spearmint', 'Hortelã'),

-- Sabores Exóticos
('Acai Berry', 'Açaí'),
('Dragon Fruit', 'Pitaya'),
('Guava Ice', 'Goiaba gelada'),
('Lychee Lemonade', 'Limonada de lichia'),
('Passion Fruit Orange', 'Maracujá com laranja'),
('Pina Colada', 'Piña colada'),
('Raspberry Lemonade', 'Limonada de framboesa'),
('Strawberry Lemonade', 'Limonada de morango'),
('Tropical Punch', 'Ponche tropical')

ON CONFLICT (name) DO NOTHING;

-- 5. ADICIONAR COLUNAS NA TABELA PRODUCTS
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS puff_count INTEGER,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- 6. CRIAR TABELA DE RELAÇÃO PRODUTO-SABOR (Muitos para Muitos)
CREATE TABLE IF NOT EXISTS product_flavors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  flavor_id INTEGER NOT NULL REFERENCES flavors(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, flavor_id)
);

-- 7. ÍNDICES PARA PRODUCT_FLAVORS
CREATE INDEX IF NOT EXISTS idx_product_flavors_product ON product_flavors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_flavors_flavor ON product_flavors(flavor_id);
CREATE INDEX IF NOT EXISTS idx_product_flavors_available ON product_flavors(is_available);

-- 8. HABILITAR RLS
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS PARA FLAVORS
DROP POLICY IF EXISTS "public_read_flavors" ON flavors;
CREATE POLICY "public_read_flavors"
  ON flavors
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "authenticated_manage_flavors" ON flavors;
CREATE POLICY "authenticated_manage_flavors"
  ON flavors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. POLÍTICAS RLS PARA PRODUCT_FLAVORS
DROP POLICY IF EXISTS "public_read_product_flavors" ON product_flavors;
CREATE POLICY "public_read_product_flavors"
  ON product_flavors
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_manage_product_flavors" ON product_flavors;
CREATE POLICY "authenticated_manage_product_flavors"
  ON product_flavors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 11. VERIFICAÇÃO
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT COUNT(*) as total_sabores FROM flavors;
SELECT * FROM flavors ORDER BY name LIMIT 10;
