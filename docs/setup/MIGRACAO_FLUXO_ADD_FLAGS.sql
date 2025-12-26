-- ============================================
-- MIGRAÇÃO: Adicionar colunas is_error e is_final
-- ============================================
-- 
-- Use este script se a tabela fluxo_status_rastreamento
-- já existe e você precisa adicionar as novas colunas
-- ============================================

-- 1. Adicionar colunas se não existirem
ALTER TABLE fluxo_status_rastreamento 
ADD COLUMN IF NOT EXISTS is_error BOOLEAN DEFAULT FALSE;

ALTER TABLE fluxo_status_rastreamento 
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE;

-- 2. Atualizar etapas existentes
-- Marcar etapa de entrega como final
UPDATE fluxo_status_rastreamento 
SET is_final = TRUE 
WHERE titulo ILIKE '%entregue%' 
   OR titulo ILIKE '%entrega concluída%';

-- Marcar etapas de erro
UPDATE fluxo_status_rastreamento 
SET is_error = TRUE 
WHERE titulo ILIKE '%ocorrência%' 
   OR titulo ILIKE '%problema%' 
   OR titulo ILIKE '%não conseguiu%'
   OR titulo ILIKE '%retornado%'
   OR titulo ILIKE '%cancelado%';

-- 3. Adicionar etapa "Pedido entregue" se não existir
INSERT INTO fluxo_status_rastreamento (ordem, titulo, descricao, icone, ativo, is_error, is_final)
SELECT 
  COALESCE(MAX(ordem), 0) + 1,
  'Pedido entregue',
  'Pedido entregue com sucesso',
  'CheckCircle',
  true,
  false,
  true
FROM fluxo_status_rastreamento
WHERE NOT EXISTS (
  SELECT 1 FROM fluxo_status_rastreamento 
  WHERE titulo ILIKE '%pedido entregue%'
);

-- 4. Comentários
COMMENT ON COLUMN fluxo_status_rastreamento.is_error IS 'Etapa de erro/problema (aparece mesmo inativa quando necessário)';
COMMENT ON COLUMN fluxo_status_rastreamento.is_final IS 'Etapa final do fluxo (ex: Entregue)';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
DECLARE
  total_etapas INTEGER;
  etapas_erro INTEGER;
  etapas_final INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_etapas FROM fluxo_status_rastreamento;
  SELECT COUNT(*) INTO etapas_erro FROM fluxo_status_rastreamento WHERE is_error = TRUE;
  SELECT COUNT(*) INTO etapas_final FROM fluxo_status_rastreamento WHERE is_final = TRUE;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migração concluída!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Estatísticas:';
  RAISE NOTICE '   Total de etapas: %', total_etapas;
  RAISE NOTICE '   Etapas de erro: %', etapas_erro;
  RAISE NOTICE '   Etapas finais: %', etapas_final;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Colunas is_error e is_final adicionadas!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '   1. Acesse /admin → Fluxo de Status';
  RAISE NOTICE '   2. Verifique as etapas marcadas';
  RAISE NOTICE '   3. Ajuste conforme necessário';
  RAISE NOTICE '   4. Clique em "Salvar Fluxo"';
END $$;

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

/*
-- Ver etapas de erro
SELECT * FROM fluxo_status_rastreamento WHERE is_error = TRUE;

-- Ver etapas finais
SELECT * FROM fluxo_status_rastreamento WHERE is_final = TRUE;

-- Ver todas as etapas com flags
SELECT 
  ordem,
  titulo,
  ativo,
  is_error,
  is_final
FROM fluxo_status_rastreamento
ORDER BY ordem;
*/
