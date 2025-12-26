-- Tabela para gerenciar slides do carrossel
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

-- Índice para ordenação
CREATE INDEX idx_carousel_slides_order ON carousel_slides(display_order);

-- Índice para slides ativos
CREATE INDEX idx_carousel_slides_active ON carousel_slides(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_carousel_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_carousel_slides_updated_at
  BEFORE UPDATE ON carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_slides_updated_at();

-- Inserir slides iniciais (baseado nas imagens existentes)
INSERT INTO carousel_slides (title, subtitle, badge, image_mobile_url, image_desktop_url, display_order, is_active) VALUES
('Promoção 1', 'Confira nossas ofertas', 'Destaque', '/src/Imagens/Fotos-site/foto-carrosel-celular.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop.webp', 1, true),
('Promoção 2', 'Produtos selecionados', 'Oferta', '/src/Imagens/Fotos-site/foto-carrosel-celular2.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop2.webp', 2, true),
('Promoção 3', 'Não perca essa chance', 'Novidade', '/src/Imagens/Fotos-site/foto-carrosel-celular3.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 3, true),
('Promoção 4', 'Aproveite agora', 'Especial', '/src/Imagens/Fotos-site/foto-carrosel-celular4.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 4, true),
('Promoção 5', 'Melhores preços', 'Imperdível', '/src/Imagens/Fotos-site/foto-carrosel-celular5.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 5, true),
('Promoção 6', 'Últimas unidades', 'Queima', '/src/Imagens/Fotos-site/foto-carrosel-celular6.webp', '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp', 6, true);

-- Habilitar RLS (Row Level Security)
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (QUALQUER PESSOA pode ler slides ativos)
CREATE POLICY "Permitir leitura pública de slides ativos"
  ON carousel_slides
  FOR SELECT
  USING (is_active = true);

-- Política para admin gerenciar slides (apenas usuários autenticados)
CREATE POLICY "Permitir admin gerenciar slides"
  ON carousel_slides
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
