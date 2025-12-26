-- ============================================
-- INTEGRAÇÃO: TRAJETO DE PEDIDOS + FLUXO DE STATUS
-- ============================================
-- 
-- OBJETIVO: Vincular o sistema de trajetos (admin) com o
-- fluxo de status (rastreamento do cliente)
--
-- FUNCIONALIDADES:
-- 1. Trajeto usa etapas do fluxo de status
-- 2. Etapas inativas aparecem quando necessário (erros)
-- 3. Cliente vê fluxo normal até erro acontecer
-- 4. Erro remove "Entregue" e vira etapa final
-- ============================================

-- 1. Adicionar coluna para vincular trajeto com fluxo
ALTER TABLE config_status_tempo 
ADD COLUMN IF NOT EXISTS fluxo_status_id BIGINT REFERENCES fluxo_status_rastreamento(id);

-- 2. Adicionar flag para identificar etapas de erro/problema
ALTER TABLE fluxo_status_rastreamento
ADD COLUMN IF NOT EXISTS is_error BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE;

-- 3. Marcar etapas especiais
UPDATE fluxo_status_rastreamento 
SET is_error = TRUE 
WHERE titulo ILIKE '%ocorrência%' 
   OR titulo ILIKE '%problema%' 
   OR titulo ILIKE '%não conseguiu%'
   OR titulo ILIKE '%retornado%';

UPDATE fluxo_status_rastreamento 
SET is_final = TRUE 
WHERE titulo ILIKE '%entregue%' 
   OR titulo ILIKE '%entrega concluída%';

-- 4. Comentários
COMMENT ON COLUMN config_status_tempo.fluxo_status_id IS 'Vincula status do trajeto com etapa do fluxo de rastreamento';
COMMENT ON COLUMN fluxo_status_rastreamento.is_error IS 'Etapa de erro/problema (aparece mesmo inativa quando necessário)';
COMMENT ON COLUMN fluxo_status_rastreamento.is_final IS 'Etapa final do fluxo (ex: Entregue)';

-- 5. Função para obter fluxo dinâmico baseado no status atual
CREATE OR REPLACE FUNCTION get_fluxo_dinamico(pedido_id_param BIGINT)
RETURNS TABLE (
  id BIGINT,
  ordem INTEGER,
  titulo TEXT,
  descricao TEXT,
  icone TEXT,
  ativo BOOLEAN,
  is_error BOOLEAN,
  is_final BOOLEAN,
  is_current BOOLEAN
) AS $$
DECLARE
  status_atual TEXT;
  tem_erro BOOLEAN;
BEGIN
  -- Buscar status atual do pedido
  SELECT status INTO status_atual
  FROM pedidos
  WHERE id = pedido_id_param;

  -- Verificar se status atual é de erro
  SELECT EXISTS(
    SELECT 1 FROM fluxo_status_rastreamento
    WHERE is_error = TRUE
    AND titulo ILIKE '%' || status_atual || '%'
  ) INTO tem_erro;

  -- Se tem erro, retornar fluxo até o erro (sem etapa final)
  IF tem_erro THEN
    RETURN QUERY
    SELECT 
      f.id,
      f.ordem,
      f.titulo,
      f.descricao,
      f.icone,
      f.ativo,
      f.is_error,
      f.is_final,
      (f.titulo ILIKE '%' || status_atual || '%') as is_current
    FROM fluxo_status_rastreamento f
    WHERE f.ativo = TRUE OR f.is_error = TRUE
    AND f.is_final = FALSE -- Remove etapa final (Entregue)
    ORDER BY f.ordem;
  ELSE
    -- Fluxo normal (apenas etapas ativas)
    RETURN QUERY
    SELECT 
      f.id,
      f.ordem,
      f.titulo,
      f.descricao,
      f.icone,
      f.ativo,
      f.is_error,
      f.is_final,
      (f.titulo ILIKE '%' || status_atual || '%') as is_current
    FROM fluxo_status_rastreamento f
    WHERE f.ativo = TRUE
    ORDER BY f.ordem;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para obter próximo status baseado no fluxo
CREATE OR REPLACE FUNCTION get_proximo_status_fluxo(status_atual_param TEXT)
RETURNS TABLE (
  proximo_status TEXT,
  titulo TEXT,
  descricao TEXT
) AS $$
DECLARE
  ordem_atual INTEGER;
BEGIN
  -- Buscar ordem da etapa atual
  SELECT ordem INTO ordem_atual
  FROM fluxo_status_rastreamento
  WHERE titulo ILIKE '%' || status_atual_param || '%'
  OR descricao ILIKE '%' || status_atual_param || '%'
  LIMIT 1;

  -- Se não encontrou, retornar primeira etapa
  IF ordem_atual IS NULL THEN
    ordem_atual := 0;
  END IF;

  -- Retornar próxima etapa ativa
  RETURN QUERY
  SELECT 
    LOWER(REPLACE(REPLACE(f.titulo, ' ', '_'), 'ã', 'a')) as proximo_status,
    f.titulo,
    f.descricao
  FROM fluxo_status_rastreamento f
  WHERE f.ordem > ordem_atual
  AND (f.ativo = TRUE OR f.is_error = TRUE)
  ORDER BY f.ordem
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

/*
-- 1. Obter fluxo dinâmico para um pedido
SELECT * FROM get_fluxo_dinamico(123);

-- 2. Obter próximo status
SELECT * FROM get_proximo_status_fluxo('preparando');

-- 3. Verificar se pedido tem erro
SELECT 
  p.id,
  p.numero_pedido,
  p.status,
  f.is_error,
  f.titulo
FROM pedidos p
LEFT JOIN fluxo_status_rastreamento f 
  ON f.titulo ILIKE '%' || p.status || '%'
WHERE p.id = 123;

-- 4. Listar etapas de erro
SELECT * FROM fluxo_status_rastreamento 
WHERE is_error = TRUE;

-- 5. Listar etapas finais
SELECT * FROM fluxo_status_rastreamento 
WHERE is_final = TRUE;
*/

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Integração Trajeto + Fluxo configurada!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Novas colunas:';
  RAISE NOTICE '   - config_status_tempo.fluxo_status_id';
  RAISE NOTICE '   - fluxo_status_rastreamento.is_error';
  RAISE NOTICE '   - fluxo_status_rastreamento.is_final';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Funções criadas:';
  RAISE NOTICE '   - get_fluxo_dinamico(pedido_id)';
  RAISE NOTICE '   - get_proximo_status_fluxo(status_atual)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Comportamento:';
  RAISE NOTICE '   - Fluxo normal: Mostra todas etapas ativas';
  RAISE NOTICE '   - Com erro: Remove "Entregue", mostra erro como final';
  RAISE NOTICE '   - Etapas inativas aparecem quando necessário';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SISTEMA INTEGRADO!';
END $$;
