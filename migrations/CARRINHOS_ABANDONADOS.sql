-- =====================================================
-- MIGRACAO: Sistema de Carrinhos Abandonados + WhatsApp
-- =====================================================

-- 1. Tabela de carrinhos abandonados
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  customer_name TEXT,
  cart_items JSONB,
  cart_total DECIMAL(10,2),
  shipping_address JSONB,
  status TEXT DEFAULT 'pending',
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 2,
  converted_at TIMESTAMP WITH TIME ZONE,
  pedido_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  abandoned_cart_id INTEGER REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'sent',
  api_response JSONB,
  sent_by TEXT DEFAULT 'auto',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de configuracao WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id SERIAL PRIMARY KEY,
  api_provider TEXT DEFAULT 'evolution',
  api_url TEXT,
  api_key TEXT,
  instance_name TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT false,
  reminder_delay_minutes INTEGER DEFAULT 30,
  max_reminders INTEGER DEFAULT 2,
  welcome_message TEXT DEFAULT 'Oi {nome}! 👋 Vi que você deixou uns produtos no carrinho na GorilaPod. Ainda dá tempo de garantir os seus! 😍',
  followup_message TEXT DEFAULT 'Ei {nome}! 🛒 Seus produtos ainda estão te esperando! Não perca essa chance! Acesse: {link}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- 5. Criar politicas permissivas
CREATE POLICY "Allow all on abandoned_carts" ON abandoned_carts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on whatsapp_messages" ON whatsapp_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on whatsapp_config" ON whatsapp_config FOR ALL USING (true) WITH CHECK (true);

-- 6. Criar indices
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON abandoned_carts(phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_cart ON whatsapp_messages(abandoned_cart_id);

-- 7. Inserir configuracao padrao
INSERT INTO whatsapp_config (api_provider, is_active, reminder_delay_minutes, max_reminders)
VALUES ('evolution', false, 30, 2)
ON CONFLICT DO NOTHING;

-- 8. Verificar tabelas criadas
SELECT 'abandoned_carts' as tabela, COUNT(*) as total FROM abandoned_carts
UNION ALL
SELECT 'whatsapp_messages' as tabela, COUNT(*) as total FROM whatsapp_messages
UNION ALL
SELECT 'whatsapp_config' as tabela, COUNT(*) as total FROM whatsapp_config;
