-- ============================================
-- ADICIONAR GATEWAY POSEIDON PAY
-- ============================================
-- 
-- Execute este script no Supabase SQL Editor
-- Integração com a API Poseidon Pay (https://app.poseidonpay.site/api/v1)
-- ============================================

-- Verificar se a tabela payment_gateways existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_gateways') THEN
        RAISE EXCEPTION 'Tabela payment_gateways não existe. Execute primeiro o script add_payment_gateways.sql';
    END IF;
END $$;

-- Adicionar colunas específicas para Poseidon Pay (se não existirem)
DO $$
BEGIN
    -- Coluna para x-public-key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_gateways' AND column_name = 'public_key') THEN
        ALTER TABLE payment_gateways ADD COLUMN public_key TEXT;
        COMMENT ON COLUMN payment_gateways.public_key IS 'x-public-key para APIs (Poseidon Pay, Stripe, etc)';
    END IF;

    -- Coluna para x-secret-key (reutilizar api_secret ou criar nova)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_gateways' AND column_name = 'api_secret') THEN
        ALTER TABLE payment_gateways ADD COLUMN api_secret TEXT;
        COMMENT ON COLUMN payment_gateways.api_secret IS 'x-secret-key/API Secret para gateways';
    END IF;

    -- Coluna para URL de callback/webhook específica por gateway
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_gateways' AND column_name = 'callback_url') THEN
        ALTER TABLE payment_gateways ADD COLUMN callback_url TEXT;
        COMMENT ON COLUMN payment_gateways.callback_url IS 'URL de callback/webhook para notificações';
    END IF;

    -- Coluna para descrição do gateway
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_gateways' AND column_name = 'description') THEN
        ALTER TABLE payment_gateways ADD COLUMN description TEXT;
    END IF;

    RAISE NOTICE '✅ Colunas verificadas/adicionadas com sucesso!';
END $$;

-- Inserir gateway Poseidon Pay (se não existir)
INSERT INTO payment_gateways (
    provider, 
    name, 
    description,
    is_active, 
    is_default,
    sandbox_mode
) 
SELECT 
    'poseidonpay',
    'Poseidon Pay',
    'Gateway PIX e Cartão - API REST com QR Code dinâmico',
    false,
    false,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM payment_gateways WHERE provider = 'poseidonpay'
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
DECLARE
    gateway_count INTEGER;
    poseidon_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO gateway_count FROM payment_gateways;
    SELECT EXISTS(SELECT 1 FROM payment_gateways WHERE provider = 'poseidonpay') INTO poseidon_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ POSEIDON PAY CONFIGURADO COM SUCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Total de gateways: %', gateway_count;
    RAISE NOTICE '🔱 Poseidon Pay instalado: %', CASE WHEN poseidon_exists THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '';
    RAISE NOTICE '📝 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Acesse Admin → Pagamentos';
    RAISE NOTICE '   2. Configure as credenciais do Poseidon Pay:';
    RAISE NOTICE '      - x-public-key (Chave Pública)';
    RAISE NOTICE '      - x-secret-key (Chave Secreta)';
    RAISE NOTICE '   3. Ative o gateway e defina como padrão se desejar';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Documentação: https://app.poseidonpay.site/docs';
    RAISE NOTICE '============================================';
END $$;

-- Listar todos os gateways
SELECT 
    id,
    provider,
    name,
    description,
    is_active,
    is_default,
    sandbox_mode,
    CASE WHEN public_key IS NOT NULL THEN '✓ Configurado' ELSE '✗ Pendente' END as public_key_status,
    CASE WHEN api_secret IS NOT NULL THEN '✓ Configurado' ELSE '✗ Pendente' END as secret_key_status,
    created_at
FROM payment_gateways 
ORDER BY name;
