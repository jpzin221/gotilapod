-- ============================================
-- TABELA DE GATEWAYS DE PAGAMENTO (BSPay, MercadoPago, PicPay, etc)
-- ============================================
-- 
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Criar tabela de gateways de pagamento
CREATE TABLE IF NOT EXISTS payment_gateways (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    
    -- Credenciais (varia por provider)
    access_token TEXT,
    public_key TEXT,
    api_key TEXT,
    webhook_secret TEXT,
    
    -- PIX Manual (chave direta)
    pix_key TEXT,
    pix_key_type VARCHAR(20),
    pix_name VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_gateways_provider ON payment_gateways(provider);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_default ON payment_gateways(is_default);

-- Comentários
COMMENT ON TABLE payment_gateways IS 'Configurações de gateways de pagamento (BSPay, MercadoPago, etc)';
COMMENT ON COLUMN payment_gateways.access_token IS 'Token de acesso/Bearer token da API';
COMMENT ON COLUMN payment_gateways.webhook_secret IS 'Secret para validação de webhooks ou URL de postback';
COMMENT ON COLUMN payment_gateways.pix_key IS 'Chave PIX para pagamento manual';

-- Desabilitar RLS para acesso do admin
ALTER TABLE payment_gateways DISABLE ROW LEVEL SECURITY;

-- Inserir gateways padrão
INSERT INTO payment_gateways (provider, name, is_active, is_default) VALUES
    ('bspay', 'BS Pay', false, false),
    ('mercadopago', 'Mercado Pago', false, false),
    ('pagseguro', 'PagSeguro', false, false),
    ('picpay', 'PicPay', false, false),
    ('pix_manual', 'PIX Manual', false, false)
ON CONFLICT DO NOTHING;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_payment_gateways_updated_at ON payment_gateways;
CREATE TRIGGER update_payment_gateways_updated_at
    BEFORE UPDATE ON payment_gateways
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabela payment_gateways criada com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Gateways disponíveis:';
    RAISE NOTICE '   - BS Pay (bspay)';
    RAISE NOTICE '   - Mercado Pago (mercadopago)';
    RAISE NOTICE '   - PagSeguro (pagseguro)';
    RAISE NOTICE '   - PicPay (picpay)';
    RAISE NOTICE '   - PIX Manual (pix_manual)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PRÓXIMO PASSO:';
    RAISE NOTICE '   Acesse Admin → Pagamentos para configurar seu gateway';
    RAISE NOTICE '';
END $$;

-- Mostrar gateways criados
SELECT id, provider, name, is_active, is_default FROM payment_gateways ORDER BY id;
