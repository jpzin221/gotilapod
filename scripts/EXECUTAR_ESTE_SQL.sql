-- ========================================
-- COPIE E COLE ESTE SQL COMPLETO NO SUPABASE
-- ========================================

-- 1. CRIAR TABELA (se não existir)
CREATE TABLE IF NOT EXISTS carousel_slides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  badge VARCHAR(100),
  image_mobile_url TEXT NOT NULL,
  image_desktop_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON carousel_slides(display_order);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_active ON carousel_slides(is_active);

-- 3. CRIAR TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_carousel_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER trigger_update_carousel_slides_updated_at
  BEFORE UPDATE ON carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_slides_updated_at();

-- 4. INSERIR DADOS INICIAIS (apenas se a tabela estiver vazia)
INSERT INTO carousel_slides (title, subtitle, badge, image_mobile_url, image_desktop_url, display_order, is_active)
SELECT * FROM (VALUES
  ('Promoção 1', 'Confira nossas ofertas', 'Destaque', '/src/Imagens/Fotos-site/foto-carrosel-celular.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop.webp', 1, true),
  ('Promoção 2', 'Produtos selecionados', 'Oferta', '/src/Imagens/Fotos-site/foto-carrosel-celular2.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop2.webp', 2, true),
  ('Promoção 3', 'Não perca essa chance', 'Novidade', '/src/Imagens/Fotos-site/foto-carrosel-celular3.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 3, true),
  ('Promoção 4', 'Aproveite agora', 'Especial', '/src/Imagens/Fotos-site/foto-carrosel-celular4.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 4, true),
  ('Promoção 5', 'Melhores preços', 'Imperdível', '/src/Imagens/Fotos-site/foto-carrosel-celular5.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 5, true),
  ('Promoção 6', 'Últimas unidades', 'Queima', '/src/Imagens/Fotos-site/foto-carrosel-celular6.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 6, true)
) AS v(title, subtitle, badge, image_mobile_url, image_desktop_url, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM carousel_slides LIMIT 1);

-- 5. HABILITAR RLS
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

-- 6. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Permitir leitura pública de slides ativos" ON carousel_slides;
DROP POLICY IF EXISTS "Permitir admin gerenciar slides" ON carousel_slides;
DROP POLICY IF EXISTS "public_read_active_slides" ON carousel_slides;
DROP POLICY IF EXISTS "authenticated_manage_slides" ON carousel_slides;

-- 7. CRIAR POLÍTICAS CORRETAS
-- Política 1: Permitir QUALQUER PESSOA ler slides ativos (sem login)
CREATE POLICY "allow_public_read_active_slides"
  ON carousel_slides
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Política 2: Permitir usuários autenticados gerenciar todos os slides
CREATE POLICY "allow_authenticated_all_operations"
  ON carousel_slides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. VERIFICAR SE FUNCIONOU
SELECT 'Tabela criada com sucesso!' as status;
SELECT COUNT(*) as total_slides FROM carousel_slides;
SELECT id, title, badge, is_active FROM carousel_slides ORDER BY display_order;
