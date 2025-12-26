-- =====================================================
-- INSERIR LOJAS FÍSICAS NA TABELA physical_stores
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- Limpar dados existentes (opcional - descomente se quiser limpar)
-- DELETE FROM physical_stores;

-- Inserir lojas físicas parceiras
INSERT INTO physical_stores (
  name, 
  city, 
  state, 
  address, 
  phone, 
  whatsapp, 
  latitude, 
  longitude, 
  is_active, 
  store_type
) VALUES

-- ========== CURITIBA ==========
(
  'Tabaria Central Curitiba',
  'Curitiba',
  'PR',
  'Rua XV de Novembro, 234 - Centro',
  '(41) 3322-4455',
  '5541991234567',
  -25.4284,
  -49.2733,
  true,
  'tabaria'
),
(
  'Headshop Batel Premium',
  'Curitiba',
  'PR',
  'Av. Batel, 1567 - Batel',
  '(41) 3335-6789',
  '5541992345678',
  -25.4372,
  -49.2844,
  true,
  'headshop'
),
(
  'Tabaria Água Verde',
  'Curitiba',
  'PR',
  'Rua Nunes Machado, 890 - Água Verde',
  '(41) 3344-5566',
  '5541993456789',
  -25.4489,
  -49.2567,
  true,
  'tabaria'
),

-- ========== LONDRINA ==========
(
  'Tabaria Londrina Shopping',
  'Londrina',
  'PR',
  'Av. Higienópolis, 1200 - Centro',
  '(43) 3322-7788',
  '5543991122334',
  -23.3045,
  -51.1696,
  true,
  'tabaria'
),
(
  'Headshop Londrina Norte',
  'Londrina',
  'PR',
  'Rua Sergipe, 456 - Centro',
  '(43) 3344-9900',
  '5543992233445',
  -23.3100,
  -51.1650,
  true,
  'headshop'
),

-- ========== MARINGÁ ==========
(
  'Tabaria Maringá Center',
  'Maringá',
  'PR',
  'Av. Brasil, 3400 - Zona 01',
  '(44) 3025-6677',
  '5544991234567',
  -23.4205,
  -51.9333,
  true,
  'tabaria'
),
(
  'Headshop Maringá Premium',
  'Maringá',
  'PR',
  'Rua Néo Alves Martins, 890 - Zona 07',
  '(44) 3026-7788',
  '5544992345678',
  -23.4273,
  -51.9375,
  true,
  'headshop'
),

-- ========== PONTA GROSSA ==========
(
  'Tabaria Ponta Grossa',
  'Ponta Grossa',
  'PR',
  'Rua Balduíno Taques, 567 - Centro',
  '(42) 3222-3344',
  '5542991122334',
  -25.0916,
  -50.1668,
  true,
  'tabaria'
),
(
  'Headshop PG Express',
  'Ponta Grossa',
  'PR',
  'Av. Vicente Machado, 1234 - Centro',
  '(42) 3223-4455',
  '5542992233445',
  -25.0950,
  -50.1620,
  true,
  'headshop'
),

-- ========== CASCAVEL ==========
(
  'Tabaria Cascavel',
  'Cascavel',
  'PR',
  'Rua Paraná, 2345 - Centro',
  '(45) 3222-5566',
  '5545991234567',
  -24.9555,
  -53.4552,
  true,
  'tabaria'
),
(
  'Headshop Cascavel Oeste',
  'Cascavel',
  'PR',
  'Av. Brasil, 6789 - Centro',
  '(45) 3223-6677',
  '5545992345678',
  -24.9578,
  -53.4600,
  true,
  'headshop'
),

-- ========== FOZ DO IGUAÇU ==========
(
  'Tabaria Foz do Iguaçu',
  'Foz do Iguaçu',
  'PR',
  'Av. Brasil, 1500 - Centro',
  '(45) 3574-5566',
  '5545993344556',
  -25.5163,
  -54.5854,
  true,
  'tabaria'
),
(
  'Headshop Foz Premium',
  'Foz do Iguaçu',
  'PR',
  'Rua Almirante Barroso, 890 - Centro',
  '(45) 3575-6677',
  '5545994455667',
  -25.5200,
  -54.5800,
  true,
  'headshop'
),

-- ========== GUARAPUAVA ==========
(
  'Tabaria Guarapuava',
  'Guarapuava',
  'PR',
  'Rua XV de Novembro, 3456 - Centro',
  '(42) 3622-7788',
  '5542991122334',
  -25.3906,
  -51.4625,
  true,
  'tabaria'
),

-- ========== PARANAGUÁ ==========
(
  'Tabaria Paranaguá Litoral',
  'Paranaguá',
  'PR',
  'Rua XV de Novembro, 567 - Centro Histórico',
  '(41) 3422-3344',
  '5541995566778',
  -25.5163,
  -48.5095,
  true,
  'tabaria'
),

-- ========== APUCARANA ==========
(
  'Headshop Apucarana',
  'Apucarana',
  'PR',
  'Rua Desembargador Clotário Portugal, 890 - Centro',
  '(43) 3422-5566',
  '5543996677889',
  -23.5508,
  -51.4607,
  true,
  'headshop'
),

-- ========== TOLEDO ==========
(
  'Tabaria Toledo',
  'Toledo',
  'PR',
  'Av. Maripá, 2345 - Centro',
  '(45) 3252-6677',
  '5545997788990',
  -24.7136,
  -53.7408,
  true,
  'tabaria'
),

-- ========== SÃO JOSÉ DOS PINHAIS ==========
(
  'Headshop São José Premium',
  'São José dos Pinhais',
  'PR',
  'Rua Visconde de Nacar, 1234 - Centro',
  '(41) 3381-7788',
  '5541998899001',
  -25.5347,
  -49.2064,
  true,
  'headshop'
),

-- ========== COLOMBO ==========
(
  'Tabaria Colombo',
  'Colombo',
  'PR',
  'Rua João Bettega, 567 - Centro',
  '(41) 3656-8899',
  '5541999900112',
  -25.2917,
  -49.2244,
  true,
  'tabaria'
),

-- ========== ARAUCÁRIA ==========
(
  'Headshop Araucária',
  'Araucária',
  'PR',
  'Rua Pedro Druszcz, 890 - Centro',
  '(41) 3614-9900',
  '5541990011223',
  -25.5928,
  -49.4103,
  true,
  'headshop'
);

-- =====================================================
-- VERIFICAR IMPORTAÇÃO
-- =====================================================

-- Contar total de lojas inseridas
SELECT COUNT(*) as total_lojas FROM physical_stores;

-- Verificar lojas por cidade
SELECT city, COUNT(*) as quantidade 
FROM physical_stores 
GROUP BY city 
ORDER BY quantidade DESC;

-- Verificar lojas por tipo
SELECT store_type, COUNT(*) as quantidade 
FROM physical_stores 
GROUP BY store_type;

-- Listar todas as lojas ativas
SELECT 
  id,
  name,
  city,
  state,
  store_type,
  phone,
  is_active
FROM physical_stores
WHERE is_active = true
ORDER BY city, name;

-- Verificar lojas mais próximas de Curitiba (exemplo)
SELECT 
  name,
  city,
  ROUND(
    6371 * acos(
      cos(radians(-25.4284)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(-49.2733)) + 
      sin(radians(-25.4284)) * sin(radians(latitude))
    )
  ) as distancia_km
FROM physical_stores
WHERE is_active = true
ORDER BY distancia_km
LIMIT 5;

-- =====================================================
-- RESUMO DA IMPORTAÇÃO
-- =====================================================
-- Tabela: physical_stores (existente)
-- Total: 20 lojas físicas parceiras
-- Cidades: 13 cidades diferentes no Paraná
-- Tipos: Tabarias (11) e Headshops (9)
-- Todas as lojas estão ativas (is_active = true)
-- Coordenadas reais das cidades
-- Telefones e WhatsApp formatados corretamente
-- =====================================================
