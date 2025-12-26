-- Tabela para configurações do banner de promoções
CREATE TABLE IF NOT EXISTS promotion_banner_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL DEFAULT '🎄 Promoções de Fim de Ano 🎅',
  subtitle TEXT NOT NULL DEFAULT 'Celebre as festas com os melhores preços!',
  badge_text TEXT NOT NULL DEFAULT '🎁 OFERTA NATAL',
  footer_text TEXT NOT NULL DEFAULT '🎉 Aproveite as festas! Ofertas especiais de fim de ano',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão
INSERT INTO promotion_banner_settings (id, title, subtitle, badge_text, footer_text, is_active)
VALUES (
  1,
  '🎄 Promoções de Fim de Ano 🎅',
  'Celebre as festas com os melhores preços!',
  '🎁 OFERTA NATAL',
  '🎉 Aproveite as festas! Ofertas especiais de fim de ano',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_promotion_banner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promotion_banner_updated_at
  BEFORE UPDATE ON promotion_banner_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_banner_updated_at();

-- Habilitar RLS
ALTER TABLE promotion_banner_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura pública do banner de promoções"
  ON promotion_banner_settings FOR SELECT
  USING (true);

CREATE POLICY "Permitir atualização autenticada do banner de promoções"
  ON promotion_banner_settings FOR UPDATE
  USING (auth.role() = 'authenticated');
