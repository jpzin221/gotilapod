-- Tabela de configuracao do WhatsApp (Infobip)
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id SERIAL PRIMARY KEY,
  api_provider VARCHAR(50) DEFAULT 'infobip',
  api_url TEXT,
  api_key TEXT,
  instance_name VARCHAR(100),
  phone_number VARCHAR(20),
  is_active BOOLEAN DEFAULT false,
  reminder_delay_minutes INTEGER DEFAULT 30,
  max_reminders INTEGER DEFAULT 2,
  welcome_message TEXT,
  followup_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens enviadas
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  abandoned_cart_id INTEGER REFERENCES abandoned_carts(id),
  phone VARCHAR(20),
  message TEXT,
  status VARCHAR(20) DEFAULT 'sent',
  api_response JSONB,
  sent_by VARCHAR(20) DEFAULT 'auto',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Politicas de acesso (ajuste conforme necessario)
CREATE POLICY "Allow all operations on whatsapp_config" ON whatsapp_config
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on whatsapp_messages" ON whatsapp_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Inserir configuracao padrao (opcional)
INSERT INTO whatsapp_config (api_provider, is_active, welcome_message, followup_message)
VALUES (
  'infobip',
  false,
  'Ola {nome}! Vi que voce deixou {itens} no carrinho na GorilaPod (R$ {total}). Ainda da tempo de garantir! 😍 {link}',
  'Ei {nome}! Seus produtos estao acabando! Garanta os seus antes que esgote! 🚀 {link}'
)
ON CONFLICT DO NOTHING;