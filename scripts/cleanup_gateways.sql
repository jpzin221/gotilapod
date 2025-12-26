-- LIMPAR GATEWAYS DUPLICADOS E MANTER APENAS O BSPAY ATIVO
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver todos os gateways (para debug)
SELECT id, provider, name, is_active, is_default, client_id, client_secret 
FROM payment_gateways 
ORDER BY provider, is_default DESC, is_active DESC;

-- 2. Deletar TODOS os gateways INATIVOS ou duplicados
-- Mantém apenas o BSPay que está como padrão (is_default = true)
DELETE FROM payment_gateways 
WHERE id NOT IN (
    SELECT id FROM payment_gateways 
    WHERE provider = 'bspay' AND is_default = true
    LIMIT 1
);

-- 3. Garantir que o BSPay restante tem as credenciais corretas
UPDATE payment_gateways 
SET 
    client_id = 'Arlei11_3195724547455173',
    client_secret = '9e09f9d7bb49f86540fb6cfaa45df9b6f4f9edfb334c4cb8dad4c9c412f77982',
    is_active = true,
    is_default = true
WHERE provider = 'bspay';

-- 4. Verificar resultado final
SELECT id, provider, name, is_active, is_default, 
       CASE WHEN client_id IS NOT NULL THEN 'Configurado' ELSE 'Vazio' END as client_id_status,
       CASE WHEN client_secret IS NOT NULL THEN 'Configurado' ELSE 'Vazio' END as client_secret_status
FROM payment_gateways;
