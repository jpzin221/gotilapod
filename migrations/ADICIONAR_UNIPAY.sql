-- =====================================================
-- MIGRACAO: Adicionar gateway UniPay (FastSoft Brasil)
-- =====================================================

-- 1. Inserir gateway UniPay (verifica se ja existe antes)
INSERT INTO payment_gateways (
    name, provider, description, is_active, is_default,
    client_id, client_secret, callback_url,
    sandbox_mode, fee_percent, min_amount, max_amount,
    config, created_at, updated_at
)
SELECT 
    'UniPay', 'unipay', 'Gateway PIX via UniPay (FastSoft Brasil)',
    false, false, NULL, NULL, NULL,
    true, 0, 0, 100000,
    '{}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_gateways WHERE provider = 'unipay'
);

-- 2. Verificar se foi inserido
SELECT id, name, provider, is_active, is_default 
FROM payment_gateways 
WHERE provider = 'unipay';
