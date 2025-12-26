-- =============================================
-- SCRIPT DE BACKUP - GORILA POD
-- Execute cada SELECT no SQL Editor do Supabase
-- E baixe os resultados como CSV
-- Data: 2025-12-26
-- =============================================

-- =============================================
-- 1. BACKUP DE PRODUTOS
-- =============================================
SELECT * FROM products ORDER BY id;

-- =============================================
-- 2. BACKUP DE CATEGORIAS
-- =============================================
SELECT * FROM categories ORDER BY id;

-- =============================================
-- 3. BACKUP DE PEDIDOS
-- =============================================
SELECT * FROM pedidos ORDER BY id;

-- =============================================
-- 4. BACKUP DE CONFIGURAÇÕES DA LOJA
-- =============================================
SELECT * FROM store_settings ORDER BY id;

-- =============================================
-- 5. BACKUP DE GATEWAYS DE PAGAMENTO
-- =============================================
SELECT * FROM payment_gateways ORDER BY id;

-- =============================================
-- 6. BACKUP DE USUÁRIOS
-- =============================================
SELECT * FROM users ORDER BY id;

-- =============================================
-- 7. BACKUP DE GEOLOCALIZAÇÃO
-- =============================================
SELECT * FROM geolocation_settings ORDER BY id;

-- =============================================
-- INSTRUÇÕES:
-- =============================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em SQL Editor
-- 4. Execute CADA SELECT separadamente
-- 5. Nos resultados, clique nos 3 pontinhos (⋮)
-- 6. Selecione "Download as CSV"
-- 7. Guarde os arquivos CSV em uma pasta de backup
-- =============================================
