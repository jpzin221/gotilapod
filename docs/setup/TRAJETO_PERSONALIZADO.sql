-- ============================================
-- TABELA: pedido_trajeto_personalizado
-- Armazena trajetos personalizados por pedido
-- ============================================

CREATE TABLE IF NOT EXISTS pedido_trajeto_personalizado (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_atual VARCHAR(50) NOT NULL,
  proximo_status VARCHAR(50) NOT NULL,
  minutos_espera INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trajeto_pedido ON pedido_trajeto_personalizado(pedido_id);
CREATE INDEX IF NOT EXISTS idx_trajeto_ordem ON pedido_trajeto_personalizado(pedido_id, ordem);

-- Comentários
COMMENT ON TABLE pedido_trajeto_personalizado IS 'Trajetos personalizados de status para pedidos específicos';
COMMENT ON COLUMN pedido_trajeto_personalizado.pedido_id IS 'ID do pedido';
COMMENT ON COLUMN pedido_trajeto_personalizado.status_atual IS 'Status atual do pedido';
COMMENT ON COLUMN pedido_trajeto_personalizado.proximo_status IS 'Próximo status na sequência';
COMMENT ON COLUMN pedido_trajeto_personalizado.minutos_espera IS 'Tempo de espera em minutos até próximo status';
COMMENT ON COLUMN pedido_trajeto_personalizado.ordem IS 'Ordem de execução do trajeto';
COMMENT ON COLUMN pedido_trajeto_personalizado.descricao IS 'Descrição opcional da etapa';

-- ============================================
-- ATUALIZAR TABELA: config_status_tempo
-- Adicionar campo display_order
-- ============================================

ALTER TABLE config_status_tempo 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;

ALTER TABLE config_status_tempo 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Atualizar ordem padrão
UPDATE config_status_tempo SET display_order = 1 WHERE status_atual = 'confirmado';
UPDATE config_status_tempo SET display_order = 2 WHERE status_atual = 'preparando';
UPDATE config_status_tempo SET display_order = 3 WHERE status_atual = 'guardando';
UPDATE config_status_tempo SET display_order = 4 WHERE status_atual = 'motoboy_caminho';
UPDATE config_status_tempo SET display_order = 5 WHERE status_atual = 'coleta';
UPDATE config_status_tempo SET display_order = 6 WHERE status_atual = 'em_rota';

-- ============================================
-- FUNÇÃO: Buscar trajeto do pedido
-- Retorna trajeto personalizado ou padrão
-- ============================================

CREATE OR REPLACE FUNCTION get_pedido_trajeto(p_pedido_id BIGINT)
RETURNS TABLE (
  status_atual VARCHAR(50),
  proximo_status VARCHAR(50),
  minutos_espera INTEGER,
  descricao TEXT,
  ordem INTEGER,
  is_personalizado BOOLEAN
) AS $$
BEGIN
  -- Verificar se existe trajeto personalizado
  IF EXISTS (
    SELECT 1 FROM pedido_trajeto_personalizado 
    WHERE pedido_id = p_pedido_id
  ) THEN
    -- Retornar trajeto personalizado
    RETURN QUERY
    SELECT 
      pt.status_atual,
      pt.proximo_status,
      pt.minutos_espera,
      pt.descricao,
      pt.ordem,
      TRUE as is_personalizado
    FROM pedido_trajeto_personalizado pt
    WHERE pt.pedido_id = p_pedido_id
    ORDER BY pt.ordem;
  ELSE
    -- Retornar trajeto padrão
    RETURN QUERY
    SELECT 
      ct.status_atual,
      ct.proximo_status,
      ct.minutos_espera,
      ct.descricao,
      ct.display_order as ordem,
      FALSE as is_personalizado
    FROM config_status_tempo ct
    WHERE ct.ativo = TRUE
    ORDER BY ct.display_order;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Buscar trajeto de um pedido específico
-- SELECT * FROM get_pedido_trajeto(123);

-- Criar trajeto personalizado para pedido
/*
INSERT INTO pedido_trajeto_personalizado (pedido_id, status_atual, proximo_status, minutos_espera, ordem, descricao)
VALUES 
  (123, 'confirmado', 'preparando', 5, 1, 'Pedido urgente - preparação rápida'),
  (123, 'preparando', 'em_rota', 10, 2, 'Pular etapa de guardagem'),
  (123, 'em_rota', 'entregue', 15, 3, 'Entrega expressa');
*/

-- Remover trajeto personalizado (volta ao padrão)
-- DELETE FROM pedido_trajeto_personalizado WHERE pedido_id = 123;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE pedido_trajeto_personalizado ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode fazer tudo
CREATE POLICY "Admin full access on trajeto"
  ON pedido_trajeto_personalizado
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Público pode visualizar
CREATE POLICY "Public read trajeto"
  ON pedido_trajeto_personalizado
  FOR SELECT
  TO public
  USING (true);
