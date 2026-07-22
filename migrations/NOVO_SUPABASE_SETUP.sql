-- ============================================
-- GOTILAPOD - SETUP COMPLETO DO BANCO DE DADOS
-- Execute no SQL Editor do Supabase
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELAS
-- ============================================

-- Categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    stock INTEGER DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    em_promocao BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sell_by_box BOOLEAN DEFAULT FALSE,
    unit_price DECIMAL(10,2),
    units_per_box INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sabores
CREATE TABLE IF NOT EXISTS flavors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relação produto-sabores
CREATE TABLE IF NOT EXISTS product_flavors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    flavor_id INTEGER REFERENCES flavors(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE(product_id, flavor_id)
);

-- Configurações da loja (linha única)
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    business_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"09:00","close":"14:00","closed":false},"sunday":{"open":"09:00","close":"14:00","closed":true}}'::jsonb,
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
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Lojas físicas
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

-- Slides do carrossel
CREATE TABLE IF NOT EXISTS carousel_slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    badge VARCHAR(100),
    image_mobile_url TEXT NOT NULL,
    image_desktop_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários (clientes)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT UNIQUE NOT NULL,
    pin TEXT,
    pin_hash TEXT,
    nome TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    endereco_completo JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_pedido TEXT UNIQUE NOT NULL,
    txid TEXT UNIQUE,
    e2e_id TEXT,
    status TEXT NOT NULL DEFAULT 'confirmado',
    valor_total DECIMAL(10,2) NOT NULL,
    valor_entrega DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    itens JSONB NOT NULL,
    endereco_entrega JSONB NOT NULL,
    forma_pagamento TEXT DEFAULT 'pix',
    pago BOOLEAN DEFAULT FALSE,
    pago_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    estimativa_entrega TIMESTAMPTZ,
    entregue_em TIMESTAMPTZ,
    nome_cliente TEXT,
    cpf_cliente TEXT,
    cliente_nome TEXT,
    cliente_telefone TEXT,
    cliente_cpf TEXT,
    webhook_received_at TIMESTAMPTZ
);

-- Histórico de status
CREATE TABLE IF NOT EXISTS status_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    observacao TEXT,
    descricao TEXT,
    automatico BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração de tempo entre status
CREATE TABLE IF NOT EXISTS config_status_tempo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_atual TEXT NOT NULL,
    proximo_status TEXT NOT NULL,
    minutos_espera INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_atual, proximo_status)
);

-- Depoimentos
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    depoimento TEXT NOT NULL,
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    imagens JSONB DEFAULT NULL,
    pedido_id BIGINT REFERENCES pedidos(id) ON DELETE SET NULL,
    aprovado BOOLEAN DEFAULT FALSE,
    aprovado_por UUID,
    aprovado_em TIMESTAMPTZ,
    visivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gateways de pagamento
CREATE TABLE IF NOT EXISTS payment_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    client_id TEXT,
    client_secret TEXT,
    webhook_secret TEXT,
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    public_key TEXT,
    callback_url TEXT,
    pix_key TEXT,
    pix_key_type TEXT,
    pix_name TEXT,
    sandbox_mode BOOLEAN DEFAULT false,
    fee_percent DECIMAL(5,2) DEFAULT 0,
    min_amount DECIMAL(10,2) DEFAULT 1,
    max_amount DECIMAL(10,2) DEFAULT 50000,
    logo_url TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do site
CREATE TABLE IF NOT EXISTS site_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type TEXT,
    category TEXT,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner de promoção
CREATE TABLE IF NOT EXISTS promotion_banner_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    title TEXT NOT NULL DEFAULT 'Promocoes',
    subtitle TEXT NOT NULL DEFAULT '',
    badge_text TEXT NOT NULL DEFAULT '',
    footer_text TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_promo CHECK (id = 1)
);
INSERT INTO promotion_banner_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Order timings
CREATE TABLE IF NOT EXISTS order_timings (
    id BIGSERIAL PRIMARY KEY,
    step INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    seconds INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trajeto personalizado do pedido
CREATE TABLE IF NOT EXISTS pedido_trajeto_personalizado (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_atual VARCHAR(50) NOT NULL,
    proximo_status VARCHAR(50) NOT NULL,
    minutos_espera INTEGER NOT NULL DEFAULT 0,
    ordem INTEGER NOT NULL DEFAULT 1,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fluxo de status de rastreamento
CREATE TABLE IF NOT EXISTS fluxo_status_rastreamento (
    id BIGSERIAL PRIMARY KEY,
    ordem INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    icone TEXT NOT NULL DEFAULT 'CheckCircle',
    ativo BOOLEAN DEFAULT TRUE,
    is_error BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_promocao ON products(em_promocao);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_physical_stores_active ON physical_stores(is_active);
CREATE INDEX IF NOT EXISTS idx_physical_stores_city ON physical_stores(city);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON carousel_slides(display_order);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_active ON carousel_slides(is_active);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_txid ON pedidos(txid);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_pedido ON status_historico(pedido_id);
CREATE INDEX IF NOT EXISTS idx_status_created ON status_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_aprovado ON testimonials(aprovado);
CREATE INDEX IF NOT EXISTS idx_testimonials_visivel ON testimonials(visivel);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_pedido ON testimonials(pedido_id);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_physical_stores_updated_at ON physical_stores;
CREATE TRIGGER update_physical_stores_updated_at BEFORE UPDATE ON physical_stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON carousel_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_gateways_updated_at ON payment_gateways;
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_config_updated_at ON site_config;
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotion_banner_updated_at ON promotion_banner_settings;
CREATE TRIGGER update_promotion_banner_updated_at BEFORE UPDATE ON promotion_banner_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_timings_updated_at ON order_timings;
CREATE TRIGGER update_order_timings_updated_at BEFORE UPDATE ON order_timings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar histórico de status automaticamente
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
CREATE TRIGGER trigger_historico_status AFTER UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION criar_historico_status();

-- Hash do PIN
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(pin, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW pedidos_completos AS
SELECT 
    p.*,
    u.telefone,
    u.nome as usuario_nome,
    u.email as usuario_email
FROM pedidos p
LEFT JOIN usuarios u ON p.usuario_id = u.id;

-- ============================================
-- DESABILITAR RLS
-- ============================================

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE flavors DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_historico DISABLE ROW LEVEL SECURITY;
ALTER TABLE config_status_tempo DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_banner_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_timings DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_trajeto_personalizado DISABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_status_rastreamento DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('testimonial-images', 'testimonial-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Categorias padrão
INSERT INTO categories (name, slug, icon, is_active) VALUES
    ('Pods', 'pods', 'Cigarette', true),
    ('Acessorios', 'acessorios', 'Wrench', true)
ON CONFLICT (slug) DO NOTHING;

-- Configuração de status
INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera) VALUES
    ('confirmado', 'preparando', 5),
    ('preparando', 'guardando', 10),
    ('guardando', 'motoboy_caminho', 5),
    ('motoboy_caminho', 'coleta', 10),
    ('coleta', 'em_rota', 5),
    ('em_rota', 'entregue', 30)
ON CONFLICT (status_atual, proximo_status) DO NOTHING;

-- Gateway CodexPay
INSERT INTO payment_gateways (name, provider, description, is_active, is_default, sandbox_mode) VALUES
    ('CodexPay', 'codexpay', 'Gateway PIX via CodexPay', true, true, false)
ON CONFLICT DO NOTHING;

-- Depoimentos de exemplo
INSERT INTO testimonials (nome, depoimento, avaliacao, aprovado, aprovado_em, visivel) VALUES 
    ('Maria Silva', 'Produto excelente! Chegou rapido e bem embalado.', 5, true, NOW(), true),
    ('Joao Santos', 'Melhor loja de pods! Atendimento nota 10.', 5, true, NOW(), true),
    ('Ana Costa', 'Adorei! Os sabores sao maravilhosos.', 5, true, NOW(), true)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT 
    'categories' as tabela, COUNT(*) as registros FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'flavors', COUNT(*) FROM flavors
UNION ALL SELECT 'store_settings', COUNT(*) FROM store_settings
UNION ALL SELECT 'physical_stores', COUNT(*) FROM physical_stores
UNION ALL SELECT 'carousel_slides', COUNT(*) FROM carousel_slides
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'testimonials', COUNT(*) FROM testimonials
UNION ALL SELECT 'payment_gateways', COUNT(*) FROM payment_gateways
UNION ALL SELECT 'site_config', COUNT(*) FROM site_config;
