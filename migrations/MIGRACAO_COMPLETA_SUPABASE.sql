-- ============================================
-- MIGRAÇÃO COMPLETA DO BANCO DE DADOS
-- Supabase - Sistema de E-commerce de Vapes/Pods
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Crie um novo projeto no Supabase
-- 2. Vá em SQL Editor → New Query
-- 3. Cole TODO este script
-- 4. Execute (Run)
-- 5. Configure as variáveis de ambiente no .env com a nova URL e ANON_KEY
--
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TABELA DE PRODUTOS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  em_promocao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_promocao ON products(em_promocao);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- ============================================
-- 2. TABELA DE CONFIGURAÇÕES DA LOJA
-- ============================================

CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "14:00", "closed": false},
    "sunday": {"open": "09:00", "close": "14:00", "closed": true}
  }'::jsonb,
  
  -- Geolocalização
  delivery_radius_km INTEGER DEFAULT 50,
  nearby_cities_radius_km INTEGER DEFAULT 100,
  show_distance_banner BOOLEAN DEFAULT true,
  sede_latitude DECIMAL(10, 6) DEFAULT -25.4284,
  sede_longitude DECIMAL(10, 6) DEFAULT -49.2733,
  sede_cidade VARCHAR(100) DEFAULT 'Curitiba',
  sede_estado VARCHAR(2) DEFAULT 'PR',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN store_settings.delivery_radius_km IS 'Raio de entrega em quilômetros';
COMMENT ON COLUMN store_settings.nearby_cities_radius_km IS 'Raio para considerar cidades próximas';
COMMENT ON COLUMN store_settings.show_distance_banner IS 'Exibir banner de distância no site';
COMMENT ON COLUMN store_settings.sede_latitude IS 'Latitude da sede principal';
COMMENT ON COLUMN store_settings.sede_longitude IS 'Longitude da sede principal';

-- ============================================
-- 3. TABELA DE LOJAS FÍSICAS
-- ============================================

CREATE TABLE IF NOT EXISTS physical_stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'PR',
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  store_type TEXT DEFAULT 'Tabaria',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physical_stores_active ON physical_stores(is_active);
CREATE INDEX IF NOT EXISTS idx_physical_stores_city ON physical_stores(city);

-- Inserir lojas de exemplo
INSERT INTO physical_stores (name, city, address, phone, whatsapp, latitude, longitude, is_active, store_type)
VALUES 
  ('Pod Express Curitiba Centro', 'Curitiba', 'Rua XV de Novembro, 123', '(41) 3333-4444', '41999887766', -25.4284, -49.2733, true, 'Tabaria'),
  ('Pod Express Londrina', 'Londrina', 'Av. Higienópolis, 456', '(43) 3333-5555', '43999776655', -23.3045, -51.1696, true, 'Headshop'),
  ('Pod Express Maringá', 'Maringá', 'Av. Brasil, 789', '(44) 3333-6666', '44999665544', -23.4205, -51.9333, true, 'Tabaria')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. TABELA DE SLIDES DO CARROSSEL
-- ============================================

CREATE TABLE IF NOT EXISTS carousel_slides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  badge VARCHAR(100),
  image_mobile_url TEXT NOT NULL,
  image_desktop_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON carousel_slides(display_order);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_active ON carousel_slides(is_active);

-- ============================================
-- 5. TABELA DE USUÁRIOS (CLIENTES)
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT UNIQUE NOT NULL,
  pin TEXT,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  endereco_completo JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);

-- ============================================
-- 6. TABELA DE PEDIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_pedido TEXT UNIQUE NOT NULL,
  
  -- PIX
  txid TEXT UNIQUE,
  e2e_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmado',
  
  -- Valores
  valor_total DECIMAL(10,2) NOT NULL,
  valor_entrega DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  
  -- Dados
  itens JSONB NOT NULL,
  endereco_entrega JSONB NOT NULL,
  
  -- Pagamento
  forma_pagamento TEXT DEFAULT 'pix',
  pago BOOLEAN DEFAULT FALSE,
  pago_em TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  estimativa_entrega TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  
  -- Dados do cliente (duplicados para histórico)
  cliente_nome TEXT,
  cliente_telefone TEXT,
  cliente_cpf TEXT
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_txid ON pedidos(txid);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);

-- ============================================
-- 7. HISTÓRICO DE STATUS (TIMELINE)
-- ============================================

CREATE TABLE IF NOT EXISTS status_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  observacao TEXT,
  automatico BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_pedido ON status_historico(pedido_id);
CREATE INDEX IF NOT EXISTS idx_status_created ON status_historico(created_at DESC);

-- ============================================
-- 8. CONFIGURAÇÕES DE TEMPO (MUDANÇA AUTOMÁTICA)
-- ============================================

CREATE TABLE IF NOT EXISTS config_status_tempo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_atual TEXT NOT NULL,
  proximo_status TEXT NOT NULL,
  minutos_espera INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(status_atual, proximo_status)
);

-- Inserir configurações iniciais
INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera) VALUES
  ('confirmado', 'preparando', 5),
  ('preparando', 'guardando', 10),
  ('guardando', 'motoboy_caminho', 5),
  ('motoboy_caminho', 'coleta', 10),
  ('coleta', 'em_rota', 5),
  ('em_rota', 'entregue', 30)
ON CONFLICT (status_atual, proximo_status) DO NOTHING;

-- ============================================
-- 9. TABELA DE DEPOIMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do cliente
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(100),
  
  -- Depoimento
  depoimento TEXT NOT NULL,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  imagens JSONB DEFAULT NULL,
  
  -- Pedido relacionado
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE SET NULL,
  
  -- Status de aprovação
  aprovado BOOLEAN DEFAULT FALSE,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  
  -- Visibilidade
  visivel BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_aprovado ON testimonials(aprovado);
CREATE INDEX IF NOT EXISTS idx_testimonials_visivel ON testimonials(visivel);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_pedido ON testimonials(pedido_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_imagens ON testimonials USING GIN (imagens);

COMMENT ON TABLE testimonials IS 'Depoimentos de clientes sobre produtos e serviços';
COMMENT ON COLUMN testimonials.imagens IS 'Array JSON com URLs das imagens do depoimento (máximo 3 imagens)';
COMMENT ON COLUMN testimonials.aprovado IS 'Depoimento aprovado pelo administrador';
COMMENT ON COLUMN testimonials.visivel IS 'Depoimento visível no site (pode ser ocultado sem deletar)';

-- Inserir depoimentos de exemplo
INSERT INTO testimonials (nome, depoimento, avaliacao, aprovado, aprovado_em, visivel) VALUES 
  ('Maria Silva', 'Produto excelente! Chegou rápido e bem embalado. O sabor é incrível, exatamente como esperava. Super recomendo!', 5, true, NOW(), true),
  ('João Santos', 'Melhor loja de pods que já comprei! Atendimento nota 10 e entrega super rápida. Virei cliente fiel!', 5, true, NOW(), true),
  ('Ana Costa', 'Adorei! Os sabores são maravilhosos e a qualidade é top. Já fiz 3 pedidos e sempre perfeito!', 5, true, NOW(), true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_physical_stores_updated_at ON physical_stores;
CREATE TRIGGER update_physical_stores_updated_at
  BEFORE UPDATE ON physical_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER update_carousel_slides_updated_at
  BEFORE UPDATE ON carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar histórico de status automaticamente
CREATE OR REPLACE FUNCTION criar_historico_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_historico (pedido_id, status, observacao, automatico)
    VALUES (NEW.id, NEW.status, 'Status atualizado', FALSE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_historico_status ON pedidos;
CREATE TRIGGER trigger_historico_status
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION criar_historico_status();

-- Função para gerar número do pedido
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
  numero TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    numero := '#' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM pedidos WHERE numero_pedido = numero) INTO existe;
    IF NOT existe THEN
      RETURN numero;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para hash do PIN
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(pin, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. VIEWS
-- ============================================

-- View para pedidos completos
CREATE OR REPLACE VIEW pedidos_completos AS
SELECT 
  p.*,
  u.telefone,
  u.nome as usuario_nome,
  u.email as usuario_email
FROM pedidos p
LEFT JOIN usuarios u ON p.usuario_id = u.id;

-- ============================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Desabilitar RLS para acesso público (você pode habilitar depois para mais segurança)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_historico DISABLE ROW LEVEL SECURITY;
ALTER TABLE config_status_tempo DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. CONFIGURAÇÃO DE STORAGE (BUCKET)
-- ============================================

-- Criar bucket para uploads de imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Nota: As políticas de storage podem já existir
-- Se necessário, configure manualmente no painel Storage

-- ============================================
-- 14. DADOS DE TESTE
-- ============================================

-- Criar usuário de teste
INSERT INTO usuarios (telefone, pin, nome, cpf, endereco_completo)
SELECT
  '41999999999',
  hash_pin('1234'),
  'João Silva',
  '12345678900',
  '{"cep": "80010-000", "endereco": "Praça Tiradentes", "numero": "123", "bairro": "Centro", "cidade": "Curitiba", "estado": "PR"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE telefone = '41999999999'
);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ MIGRAÇÃO COMPLETA DO BANCO DE DADOS';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tabelas criadas:';
  RAISE NOTICE '   - products (produtos)';
  RAISE NOTICE '   - store_settings (configurações da loja)';
  RAISE NOTICE '   - physical_stores (lojas físicas)';
  RAISE NOTICE '   - carousel_slides (carrossel)';
  RAISE NOTICE '   - usuarios (clientes)';
  RAISE NOTICE '   - pedidos (pedidos)';
  RAISE NOTICE '   - status_historico (timeline de status)';
  RAISE NOTICE '   - config_status_tempo (automatização)';
  RAISE NOTICE '   - testimonials (depoimentos)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Funções criadas: 4';
  RAISE NOTICE '⚡ Triggers criados: 8';
  RAISE NOTICE '👁️ Views criadas: 1';
  RAISE NOTICE '📦 Storage bucket criado: product-images';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 BANCO DE DADOS PRONTO PARA USO!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Configure o .env com suas credenciais Supabase';
  RAISE NOTICE '   2. Importe seus produtos';
  RAISE NOTICE '   3. Configure os slides do carrossel';
  RAISE NOTICE '   4. Ajuste as configurações da loja';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
END $$;

-- Consulta final de verificação
SELECT 
  'products' as tabela, COUNT(*) as registros FROM products
UNION ALL
SELECT 'store_settings', COUNT(*) FROM store_settings
UNION ALL
SELECT 'physical_stores', COUNT(*) FROM physical_stores
UNION ALL
SELECT 'carousel_slides', COUNT(*) FROM carousel_slides
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'testimonials', COUNT(*) FROM testimonials;
