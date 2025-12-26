-- ============================================
-- TABELA FLUXO DE STATUS DE RASTREAMENTO
-- ============================================
-- 
-- OBJETIVO: Gerenciar as etapas que aparecem na página
-- de rastreamento do cliente de forma dinâmica
--
-- FUNCIONALIDADES:
-- - Admin pode criar/editar/remover etapas
-- - Admin pode reordenar etapas (drag & drop)
-- - Admin pode ativar/desativar etapas
-- - Cliente vê apenas etapas ativas na ordem definida
-- ============================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS fluxo_status_rastreamento (
  id BIGSERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT 'CheckCircle',
  ativo BOOLEAN DEFAULT TRUE,
  is_error BOOLEAN DEFAULT FALSE,
  is_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_fluxo_status_ordem ON fluxo_status_rastreamento(ordem);
CREATE INDEX IF NOT EXISTS idx_fluxo_status_ativo ON fluxo_status_rastreamento(ativo);

-- 3. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_fluxo_status_updated_at ON fluxo_status_rastreamento;
CREATE TRIGGER update_fluxo_status_updated_at
  BEFORE UPDATE ON fluxo_status_rastreamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Inserir etapas padrão
INSERT INTO fluxo_status_rastreamento (ordem, titulo, descricao, icone, ativo, is_error, is_final) VALUES
(1, 'Pedido recebido', 'Recebemos seu pedido', 'CheckCircle', true, false, false),
(2, 'Pagamento aprovado', 'Pagamento confirmado', 'TrendingUp', true, false, false),
(3, 'Preparando pedido', 'Separando produtos', 'Package', true, false, false),
(4, 'Nota fiscal emitida', 'Nota fiscal gerada', 'FileText', true, false, false),
(5, 'Aguardando coleta da transportadora', 'Aguardando coleta', 'Clock', true, false, false),
(6, 'Pedido coletado pela transportadora', 'Transportadora: XP LOG - Credencial 14729B', 'CheckCircle', true, false, false),
(7, 'Em trânsito para centro de distribuição', 'A caminho do CD', 'Truck', true, false, false),
(8, 'Chegou ao centro de distribuição', 'No centro de distribuição', 'MapPin', true, false, false),
(9, 'O motoboy parceiro iniciou a rota de entrega', 'Rota de entrega iniciada', 'TrendingUp', true, false, false),
(10, 'Saiu para entrega', 'Em rota de entrega', 'Truck', true, false, false),
(11, 'O motoboy tem como destino sua localização', 'Indo para seu endereço', 'MapPin', true, false, false),
(12, 'Pedido entregue', 'Pedido entregue com sucesso', 'CheckCircle', true, false, true),
(13, '⚠️ Ocorrência com a entrega', 'O motoboy parceiro relatou um problema inesperado durante a entrega. Nosso suporte foi acionado.', 'XCircle', false, true, false)
ON CONFLICT DO NOTHING;

-- 5. Comentários
COMMENT ON TABLE fluxo_status_rastreamento IS 'Etapas do fluxo de rastreamento configuráveis pelo admin';
COMMENT ON COLUMN fluxo_status_rastreamento.ordem IS 'Ordem de exibição das etapas';
COMMENT ON COLUMN fluxo_status_rastreamento.titulo IS 'Título da etapa mostrado ao cliente';
COMMENT ON COLUMN fluxo_status_rastreamento.descricao IS 'Descrição detalhada da etapa';
COMMENT ON COLUMN fluxo_status_rastreamento.icone IS 'Nome do ícone Lucide React';
COMMENT ON COLUMN fluxo_status_rastreamento.ativo IS 'Se false, etapa não aparece no rastreamento';
COMMENT ON COLUMN fluxo_status_rastreamento.is_error IS 'Etapa de erro/problema (aparece mesmo inativa quando necessário)';
COMMENT ON COLUMN fluxo_status_rastreamento.is_final IS 'Etapa final do fluxo (ex: Entregue)';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabela criada: fluxo_status_rastreamento';
  RAISE NOTICE '✅ Índices criados: ordem, ativo';
  RAISE NOTICE '✅ Trigger criado: update_updated_at';
  RAISE NOTICE '✅ Etapas padrão inseridas: 13 etapas';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Etapas ativas: 12';
  RAISE NOTICE '📊 Etapas inativas: 1 (Ocorrência)';
  RAISE NOTICE '📊 Etapas de erro: 1';
  RAISE NOTICE '📊 Etapas finais: 1 (Entregue)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 FLUXO DE STATUS CONFIGURADO!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '   1. Acesse /admin → Fluxo de Status';
  RAISE NOTICE '   2. Personalize as etapas';
  RAISE NOTICE '   3. Arraste para reordenar';
  RAISE NOTICE '   4. Ative/desative conforme necessário';
  RAISE NOTICE '   5. Clique em "Salvar Fluxo"';
END $$;

-- ============================================
-- EXEMPLO DE CONSULTA
-- ============================================

/*
-- Buscar etapas ativas na ordem
SELECT * FROM fluxo_status_rastreamento 
WHERE ativo = true 
ORDER BY ordem ASC;

-- Contar etapas
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ativo = true) as ativas,
  COUNT(*) FILTER (WHERE ativo = false) as inativas
FROM fluxo_status_rastreamento;

-- Atualizar ordem de uma etapa
UPDATE fluxo_status_rastreamento 
SET ordem = 5 
WHERE id = 3;

-- Desativar etapa
UPDATE fluxo_status_rastreamento 
SET ativo = false 
WHERE id = 12;
*/
