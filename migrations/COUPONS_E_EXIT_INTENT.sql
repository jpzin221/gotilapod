-- =====================================================
-- MIGRACAO: Sistema de Cupons + Exit Intent Popup
-- =====================================================

-- 1. Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  applies_to TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de uso de cupons (relatorio)
CREATE TABLE IF NOT EXISTS coupon_uses (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
  pedido_id INTEGER,
  user_phone TEXT,
  user_name TEXT,
  discount_applied DECIMAL(10,2),
  order_total DECIMAL(10,2),
  source TEXT DEFAULT 'exit_intent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar indice para buscas rapidas
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_created_at ON coupon_uses(created_at);

-- 4. Cupom padrao PRIMEIRA10 (10% OFF)
INSERT INTO coupons (code, description, discount_percent, min_order_value, is_active, applies_to)
VALUES ('PRIMEIRA10', '10% OFF na primeira compra - Exit Intent Popup', 10.00, 0, true, 'all')
ON CONFLICT (code) DO NOTHING;

-- 5. Verificar tabelas criadas
SELECT 'coupons' as tabela, COUNT(*) as total FROM coupons
UNION ALL
SELECT 'coupon_uses' as tabela, COUNT(*) as total FROM coupon_uses;
