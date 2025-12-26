-- ============================================
-- SCRIPT PARA CONFIGURAR SUPABASE NOVO
-- Execute no SQL Editor do seu Supabase
-- URL: https://supabase.com/dashboard/project/fibasvshtaczzozwhusj/sql
-- ============================================

-- 1. DESABILITAR RLS EM TODAS AS TABELAS (PERMITE ACESSO PÚBLICO)
-- ============================================

-- Se as tabelas já existem, apenas desabilitar RLS
DO $$
BEGIN
    -- Verificar e desabilitar RLS para cada tabela
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE products DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_settings') THEN
        ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physical_stores') THEN
        ALTER TABLE physical_stores DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carousel_slides') THEN
        ALTER TABLE carousel_slides DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos') THEN
        ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'status_historico') THEN
        ALTER TABLE status_historico DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testimonials') THEN
        ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flavors') THEN
        ALTER TABLE flavors DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_flavors') THEN
        ALTER TABLE product_flavors DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_config') THEN
        ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotion_banner') THEN
        ALTER TABLE promotion_banner DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_gateways') THEN
        ALTER TABLE payment_gateways DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_timings') THEN
        ALTER TABLE order_timings DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'config_status_tempo') THEN
        ALTER TABLE config_status_tempo DISABLE ROW LEVEL SECURITY;
    END IF;

    RAISE NOTICE '✅ RLS desabilitado em todas as tabelas existentes!';
END $$;

-- 2. SE AS TABELAS NÃO EXISTEM, CRIAR A ESTRUTURA COMPLETA
-- ============================================

-- Tabela de categorias
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

-- Tabela de produtos
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
    is_bolador BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sell_by_box BOOLEAN DEFAULT FALSE,
    unit_price DECIMAL(10,2),
    units_per_box INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sabores
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

-- Configurações da loja
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    business_hours JSONB DEFAULT '{}'::jsonb,
    delivery_radius_km INTEGER DEFAULT 50,
    show_distance_banner BOOLEAN DEFAULT true,
    sede_latitude DECIMAL(10, 6),
    sede_longitude DECIMAL(10, 6),
    sede_cidade VARCHAR(100),
    sede_estado VARCHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
    aprovado BOOLEAN DEFAULT FALSE,
    visivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração do site
CREATE TABLE IF NOT EXISTS site_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner de promoção
CREATE TABLE IF NOT EXISTS promotion_banner (
    id SERIAL PRIMARY KEY,
    text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    background_color VARCHAR(20) DEFAULT '#22c55e',
    text_color VARCHAR(20) DEFAULT '#ffffff',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT UNIQUE NOT NULL,
    pin TEXT,
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
    cliente_nome TEXT,
    cliente_telefone TEXT,
    cliente_cpf TEXT
);

-- Gateways de pagamento
CREATE TABLE IF NOT EXISTS payment_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    client_id TEXT,
    client_secret TEXT,
    webhook_secret TEXT,
    sandbox BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GARANTIR QUE RLS ESTÁ DESABILITADO NAS NOVAS TABELAS
-- ============================================

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE flavors DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_banner DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways DISABLE ROW LEVEL SECURITY;

-- 4. INSERIR DADOS MÍNIMOS SE AS TABELAS ESTÃO VAZIAS
-- ============================================

-- Inserir categoria padrão
INSERT INTO categories (name, slug, is_active) 
VALUES ('Pods', 'pods', true)
ON CONFLICT DO NOTHING;

-- 5. CRIAR BUCKET DE STORAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICAÇÃO FINAL
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '✅ CONFIGURAÇÃO DO SUPABASE CONCLUÍDA!';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Ações realizadas:';
    RAISE NOTICE '   - RLS desabilitado em todas as tabelas';
    RAISE NOTICE '   - Tabelas criadas (se não existiam)';
    RAISE NOTICE '   - Bucket de storage configurado';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Seu site deve funcionar agora!';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Próximo passo:';
    RAISE NOTICE '   Recarregue https://gorilapod.netlify.app';
    RAISE NOTICE '';
END $$;

-- Mostrar contagem de registros
SELECT 
    'products' as tabela, COUNT(*) as registros FROM products
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'carousel_slides', COUNT(*) FROM carousel_slides
UNION ALL SELECT 'testimonials', COUNT(*) FROM testimonials;
