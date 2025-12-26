-- Script para criar todas as tabelas necessárias no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- 1. Tabela de configurações da loja
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão
INSERT INTO store_settings (id, business_hours)
VALUES (1, '{
  "monday": {"open": "09:00", "close": "18:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
  "thursday": {"open": "09:00", "close": "18:00", "closed": false},
  "friday": {"open": "09:00", "close": "18:00", "closed": false},
  "saturday": {"open": "09:00", "close": "14:00", "closed": false},
  "sunday": {"open": "09:00", "close": "14:00", "closed": true}
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de lojas físicas
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
  store_type TEXT DEFAULT 'Tabaria', -- Tabaria, Headshop, etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir algumas lojas de exemplo
INSERT INTO physical_stores (name, city, address, phone, whatsapp, latitude, longitude, is_active, store_type)
VALUES 
  ('Pod Express Curitiba Centro', 'Curitiba', 'Rua XV de Novembro, 123', '(41) 3333-4444', '41999887766', -25.4284, -49.2733, true, 'Tabaria'),
  ('Pod Express Londrina', 'Londrina', 'Av. Higienópolis, 456', '(43) 3333-5555', '43999776655', -23.3045, -51.1696, true, 'Headshop'),
  ('Pod Express Maringá', 'Maringá', 'Av. Brasil, 789', '(44) 3333-6666', '44999665544', -23.4205, -51.9333, true, 'Tabaria')
ON CONFLICT DO NOTHING;

-- 3. Desabilitar RLS para acesso público
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Verificar se tudo foi criado
SELECT 'store_settings' as tabela, COUNT(*) as registros FROM store_settings
UNION ALL
SELECT 'physical_stores', COUNT(*) FROM physical_stores
UNION ALL
SELECT 'products', COUNT(*) FROM products;
