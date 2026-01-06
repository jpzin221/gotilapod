-- ============================================
-- ADICIONAR GATEWAY RYZENPAY
-- ============================================
-- 
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Inserir RyzenPay na tabela de gateways (apenas se não existir)
INSERT INTO payment_gateways (provider, name, description, is_active, is_default) 
SELECT 
    'ryzenpay', 
    'Ryzen Pay', 
    'PIX via RyzenPay - Gateway de pagamentos', 
    false, 
    false
WHERE NOT EXISTS (
    SELECT 1 FROM payment_gateways WHERE provider = 'ryzenpay'
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Gateway RyzenPay adicionado com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PRÓXIMO PASSO:';
    RAISE NOTICE '   1. Acesse Admin → Pagamentos';
    RAISE NOTICE '   2. Configure a API Key do RyzenPay';
    RAISE NOTICE '   3. Opcionalmente configure a URL de Webhook';
    RAISE NOTICE '   4. Ative o gateway';
    RAISE NOTICE '';
END $$;

-- Mostrar gateways
SELECT id, provider, name, is_active, is_default FROM payment_gateways ORDER BY id;
