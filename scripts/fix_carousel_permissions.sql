-- Script para corrigir permissões da tabela carousel_slides
-- Execute este script se estiver tendo erro 401 (Unauthorized)

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública de slides ativos" ON carousel_slides;
DROP POLICY IF EXISTS "Permitir admin gerenciar slides" ON carousel_slides;

-- Criar política de leitura pública (sem autenticação necessária)
CREATE POLICY "public_read_active_slides"
  ON carousel_slides
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Criar política para usuários autenticados gerenciarem slides
CREATE POLICY "authenticated_manage_slides"
  ON carousel_slides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verificar se a tabela existe e tem dados
SELECT COUNT(*) as total_slides FROM carousel_slides;
SELECT * FROM carousel_slides WHERE is_active = true ORDER BY display_order;
