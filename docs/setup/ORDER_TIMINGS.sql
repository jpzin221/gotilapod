-- ============================================
-- TABELA ORDER_TIMINGS
-- ============================================
-- 
-- OBJETIVO: Armazenar configurações de tempo entre
-- cada etapa do pedido (usado no rastreamento automático)
--
-- FUNCIONALIDADES:
-- - Define quanto tempo cada etapa leva
-- - Admin pode configurar tempos personalizados
-- - Sistema usa para atualizar status automaticamente
-- ============================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.order_timings (
  id BIGSERIAL PRIMARY KEY,
  step INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_order_timings_step ON public.order_timings(step);

-- 3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_timings_updated_at ON public.order_timings;
CREATE TRIGGER update_order_timings_updated_at
  BEFORE UPDATE ON public.order_timings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Inserir tempos padrão
INSERT INTO public.order_timings (step, name, seconds) VALUES
(0, 'Pedido Recebido → Pagamento Aprovado', 8),
(1, 'Pagamento Aprovado → Preparando Pedido', 10),
(2, 'Preparando Pedido → Aguardando Coleta', 300),        -- 5 min
(3, 'Aguardando Coleta → Aguardando Transportadora', 600), -- 10 min
(4, 'Aguardando Transportadora → Pedido Coletado', 900),   -- 15 min
(5, 'Pedido Coletado → Entregador Iniciou Rota', 300),     -- 5 min
(6, 'Entregador Iniciou Rota → Entregador Saiu', 180),     -- 3 min
(7, 'Entregador Saiu → Indo em Sua Direção', 600),         -- 10 min
(8, 'Indo em Sua Direção → Entregue', 900)                 -- 15 min
ON CONFLICT (step) DO NOTHING;

-- 5. Comentários
COMMENT ON TABLE public.order_timings IS 'Configurações de tempo entre etapas do pedido';
COMMENT ON COLUMN public.order_timings.step IS 'Número da etapa (ordem)';
COMMENT ON COLUMN public.order_timings.name IS 'Nome descritivo da transição';
COMMENT ON COLUMN public.order_timings.seconds IS 'Tempo em segundos para esta etapa';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
DECLARE
  total_etapas INTEGER;
  tempo_total INTEGER;
BEGIN
  SELECT COUNT(*), SUM(seconds) INTO total_etapas, tempo_total
  FROM public.order_timings;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabela criada: order_timings';
  RAISE NOTICE '✅ Índice criado: step';
  RAISE NOTICE '✅ Trigger criado: update_updated_at';
  RAISE NOTICE '✅ Etapas inseridas: %', total_etapas;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tempo total do fluxo: % segundos (% minutos)', tempo_total, ROUND(tempo_total / 60.0, 1);
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ORDER_TIMINGS CONFIGURADO!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '   1. Acesse /admin → Tempos de Entrega';
  RAISE NOTICE '   2. Configure os tempos desejados';
  RAISE NOTICE '   3. Use formato: Horas : Minutos : Segundos';
  RAISE NOTICE '   4. Clique em "Salvar Configurações"';
END $$;

-- ============================================
-- EXEMPLO DE CONSULTA
-- ============================================

/*
-- Buscar todos os tempos
SELECT * FROM public.order_timings ORDER BY step;

-- Calcular tempo total
SELECT 
  SUM(seconds) as total_segundos,
  ROUND(SUM(seconds) / 60.0, 1) as total_minutos,
  ROUND(SUM(seconds) / 3600.0, 2) as total_horas
FROM public.order_timings;

-- Atualizar tempo de uma etapa
UPDATE public.order_timings 
SET seconds = 600 
WHERE step = 2;

-- Formatar tempo legível
SELECT 
  step,
  name,
  seconds,
  CASE 
    WHEN seconds < 60 THEN seconds || 's'
    WHEN seconds < 3600 THEN ROUND(seconds / 60.0, 1) || 'm'
    ELSE ROUND(seconds / 3600.0, 1) || 'h'
  END as tempo_formatado
FROM public.order_timings
ORDER BY step;
*/
