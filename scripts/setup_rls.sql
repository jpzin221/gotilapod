-- Script para configurar RLS (Row Level Security) no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- 1. Habilitar RLS na tabela products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Permitir leitura pública (qualquer pessoa pode ver os produtos)
CREATE POLICY "Permitir leitura pública de produtos"
ON products
FOR SELECT
TO public
USING (true);

-- 3. Permitir inserção apenas para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Permitir atualização apenas para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Permitir exclusão apenas para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados"
ON products
FOR DELETE
TO authenticated
USING (true);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'products';
