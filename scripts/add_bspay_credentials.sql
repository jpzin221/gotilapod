-- Adicionar colunas client_id e client_secret na tabela payment_gateways
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna client_id se não existir
ALTER TABLE payment_gateways 
ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Adicionar coluna client_secret se não existir
ALTER TABLE payment_gateways 
ADD COLUMN IF NOT EXISTS client_secret TEXT;

-- Atualizar BSPay com as credenciais fornecidas (opcional - você pode fazer pelo admin)
UPDATE payment_gateways 
SET 
    client_id = 'Arlei11_3195724547455173',
    client_secret = '9e09f9d7bb49f86540fb6cfaa45df9b6f4f9edfb334c4cb8dad4c9c412f77982'
WHERE provider = 'bspay';
