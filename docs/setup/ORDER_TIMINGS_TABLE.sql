-- Tabela para configurar tempos de transição entre etapas do pedido
CREATE TABLE IF NOT EXISTS order_timings (
  id BIGSERIAL PRIMARY KEY,
  step INTEGER NOT NULL UNIQUE, -- 0-8 (índice da etapa)
  name TEXT NOT NULL, -- Nome da transição (ex: "Pedido Recebido → Pagamento Aprovado")
  seconds INTEGER NOT NULL DEFAULT 10, -- Tempo em segundos para avançar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir valores padrão
INSERT INTO order_timings (step, name, seconds) VALUES
  (0, 'Pedido Recebido → Pagamento Aprovado', 8),
  (1, 'Pagamento Aprovado → Preparando Pedido', 10),
  (2, 'Preparando Pedido → Aguardando Coleta', 300),
  (3, 'Aguardando Coleta → Aguardando Transportadora', 600),
  (4, 'Aguardando Transportadora → Pedido Coletado', 900),
  (5, 'Pedido Coletado → Entregador Iniciou Rota', 300),
  (6, 'Entregador Iniciou Rota → Entregador Saiu', 180),
  (7, 'Entregador Saiu → Indo em Sua Direção', 600),
  (8, 'Indo em Sua Direção → Entregue', 900)
ON CONFLICT (step) DO NOTHING;

-- Índice para busca rápida por step
CREATE INDEX IF NOT EXISTS idx_order_timings_step ON order_timings(step);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_order_timings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_timings_updated_at
  BEFORE UPDATE ON order_timings
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timings_updated_at();

-- Comentários
COMMENT ON TABLE order_timings IS 'Configuração de tempos de transição entre etapas do pedido';
COMMENT ON COLUMN order_timings.step IS 'Índice da etapa (0-8)';
COMMENT ON COLUMN order_timings.name IS 'Nome descritivo da transição';
COMMENT ON COLUMN order_timings.seconds IS 'Tempo em segundos para avançar automaticamente';
