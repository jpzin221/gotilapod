-- =============================================
-- SCRIPT PARA GERAR BACKUP EM SQL (INSERT STATEMENTS)
-- Execute no SQL Editor do Supabase
-- Cole os resultados num arquivo .sql
-- Data: 2025-12-26
-- =============================================

-- =============================================
-- 1. GERAR INSERTs DE PRODUCTS
-- =============================================
SELECT 
    'INSERT INTO products (id, name, description, price, original_price, image, category, stock, active, sabores, created_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(price::text, 'NULL') || ', ' ||
    COALESCE(original_price::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(image, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(category, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(stock::text, 'NULL') || ', ' ||
    COALESCE(active::text, 'NULL') || ', ' ||
    COALESCE('''' || sabores::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ');'
AS sql_insert
FROM products;

-- =============================================
-- 2. GERAR INSERTs DE CATEGORIES
-- =============================================
SELECT 
    'INSERT INTO categories (id, name, slug, description, icon, color, order_index, active, created_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(slug, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(icon, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(color, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(order_index::text, 'NULL') || ', ' ||
    COALESCE(active::text, 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ');'
AS sql_insert
FROM categories;

-- =============================================
-- 3. GERAR INSERTs DE PEDIDOS
-- =============================================
SELECT 
    'INSERT INTO pedidos (id, numero_pedido, txid, valor_total, cliente_nome, cliente_telefone, cliente_cpf, endereco_entrega, itens, status, pago, pago_em, forma_pagamento, usuario_id, created_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(numero_pedido, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(txid, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(valor_total::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(cliente_nome, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || cliente_telefone || '''', 'NULL') || ', ' ||
    COALESCE('''' || cliente_cpf || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(endereco_entrega, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || itens::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || status || '''', 'NULL') || ', ' ||
    COALESCE(pago::text, 'NULL') || ', ' ||
    COALESCE('''' || pago_em::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || forma_pagamento || '''', 'NULL') || ', ' ||
    COALESCE(usuario_id::text, 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ');'
AS sql_insert
FROM pedidos;

-- =============================================
-- 4. GERAR INSERTs DE STORE_SETTINGS
-- =============================================
SELECT 
    'INSERT INTO store_settings (id, key, value, created_at, updated_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(key, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(value, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NULL') || ');'
AS sql_insert
FROM store_settings;

-- =============================================
-- 5. GERAR INSERTs DE PAYMENT_GATEWAYS
-- =============================================
SELECT 
    'INSERT INTO payment_gateways (id, name, provider, is_active, is_default, client_id, client_secret, pix_key, pix_key_type, pix_name, webhook_secret, access_token, token_expires_at, created_at, updated_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || provider || '''', 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE(is_default::text, 'NULL') || ', ' ||
    COALESCE('''' || client_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || client_secret || '''', 'NULL') || ', ' ||
    COALESCE('''' || pix_key || '''', 'NULL') || ', ' ||
    COALESCE('''' || pix_key_type || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(pix_name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || webhook_secret || '''', 'NULL') || ', ' ||
    COALESCE('''' || access_token || '''', 'NULL') || ', ' ||
    COALESCE('''' || token_expires_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NULL') || ');'
AS sql_insert
FROM payment_gateways;

-- =============================================
-- 6. GERAR INSERTs DE USERS
-- =============================================
SELECT 
    'INSERT INTO users (id, nome, telefone, created_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(nome, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ');'
AS sql_insert
FROM users;

-- =============================================
-- INSTRUÇÕES:
-- =============================================
-- 1. Execute cada bloco SELECT separadamente no SQL Editor
-- 2. Copie os resultados (são comandos INSERT)
-- 3. Cole num arquivo backup_2025-12-26.sql
-- 4. Agora você tem um backup SQL completo!
-- =============================================
