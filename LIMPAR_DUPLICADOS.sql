-- ============================================
-- REMOVER GATEWAYS DUPLICADOS
-- Execute no Supabase SQL Editor
-- ============================================

-- Manter apenas 1 de cada provider (o de menor ID)
DELETE FROM payment_gateways
WHERE id NOT IN (
  SELECT MIN(id)
  FROM payment_gateways
  GROUP BY provider
);

-- Verificar resultado
SELECT id, name, provider, is_active, is_default FROM payment_gateways ORDER BY name;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Duplicados removidos! Apenas 1 de cada gateway.';
END $$;
