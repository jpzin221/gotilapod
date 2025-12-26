-- Inserir slides do carrossel com imagens locais
-- Execute este SQL no Supabase SQL Editor

-- Limpar slides existentes (opcional)
-- DELETE FROM carousel_slides;

-- Inserir slides com caminhos corretos
INSERT INTO carousel_slides (
  title,
  subtitle,
  badge,
  image_mobile_url,
  image_desktop_url,
  display_order,
  is_active
) VALUES
(
  'O POD que redefine o prazer do vapor!',
  'Confira nossas ofertas',
  'Destaque',
  '/images/Fotos-site/foto-carrosel-celular.webp',
  '/images/Fotos-site/foto-carrosel-desktop.webp',
  1,
  true
),
(
  'Até 40.000 puffs de pura intensidade 🔥',
  'Últimas unidades disponíveis',
  'Promoção',
  '/images/Fotos-site/foto-carrosel-celular2.webp',
  '/images/Fotos-site/foto-carrosel-desktop2.webp',
  2,
  true
),
(
  'Variedade de sabores incríveis',
  'Encontre seu favorito',
  'Novidade',
  '/images/Fotos-site/foto-carrosel-celular3.webp',
  '/images/Fotos-site/foto-carrosel-desktop3.webp',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  badge = EXCLUDED.badge,
  image_mobile_url = EXCLUDED.image_mobile_url,
  image_desktop_url = EXCLUDED.image_desktop_url,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Verificar os slides inseridos
SELECT id, title, image_mobile_url, image_desktop_url, is_active 
FROM carousel_slides 
ORDER BY display_order;
