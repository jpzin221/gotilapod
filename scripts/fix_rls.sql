-- Script para corrigir RLS e permitir acesso aos produtos
-- Execute no SQL Editor do Supabase

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON products;
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;

-- 2. Desabilitar RLS (mais simples para começar)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se funcionou
SELECT COUNT(*) as total_produtos FROM products;

-- Se quiser habilitar RLS depois, use:
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public_read" ON products FOR SELECT TO public USING (true);
-- CREATE POLICY "auth_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
