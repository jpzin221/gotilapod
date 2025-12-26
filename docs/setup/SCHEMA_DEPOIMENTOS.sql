-- ============================================
-- TABELA DE DEPOIMENTOS
-- ============================================

-- Criar tabela de depoimentos
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do cliente
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(100),
  
  -- Depoimento
  depoimento TEXT NOT NULL,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  
  -- Pedido relacionado (opcional)
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE SET NULL,
  
  -- Status de aprovação
  aprovado BOOLEAN DEFAULT FALSE,
  aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aprovado_em TIMESTAMP WITH TIME ZONE,
  
  -- Visibilidade
  visivel BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_testimonials_aprovado ON testimonials(aprovado);
CREATE INDEX IF NOT EXISTS idx_testimonials_visivel ON testimonials(visivel);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_pedido ON testimonials(pedido_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode criar depoimento
CREATE POLICY "Permitir criação de depoimentos"
  ON testimonials
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política: Apenas depoimentos aprovados e visíveis são públicos
CREATE POLICY "Permitir leitura de depoimentos aprovados"
  ON testimonials
  FOR SELECT
  TO public
  USING (aprovado = true AND visivel = true);

-- Política: Service role pode fazer tudo (para admin)
CREATE POLICY "Service role acesso total"
  ON testimonials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- DADOS INICIAIS (EXEMPLOS)
-- ============================================

-- Inserir depoimentos de exemplo (já aprovados)
INSERT INTO testimonials (nome, depoimento, avaliacao, aprovado, aprovado_em, visivel)
VALUES 
  (
    'Maria Silva',
    'Produto excelente! Chegou rápido e bem embalado. O sabor é incrível, exatamente como esperava. Super recomendo!',
    5,
    true,
    NOW(),
    true
  ),
  (
    'João Santos',
    'Melhor loja de pods que já comprei! Atendimento nota 10 e entrega super rápida. Virei cliente fiel!',
    5,
    true,
    NOW(),
    true
  ),
  (
    'Ana Costa',
    'Adorei! Os sabores são maravilhosos e a qualidade é top. Já fiz 3 pedidos e sempre perfeito!',
    5,
    true,
    NOW(),
    true
  ),
  (
    'Pedro Oliveira',
    'Entrega rápida e produto de qualidade. O POD dura bastante e o sabor é muito bom. Recomendo!',
    5,
    true,
    NOW(),
    true
  ),
  (
    'Carla Mendes',
    'Excelente experiência de compra! Site fácil de usar, pagamento rápido e produto chegou em perfeito estado.',
    5,
    true,
    NOW(),
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE testimonials IS 'Depoimentos de clientes sobre produtos e serviços';
COMMENT ON COLUMN testimonials.aprovado IS 'Depoimento aprovado pelo administrador';
COMMENT ON COLUMN testimonials.visivel IS 'Depoimento visível no site (pode ser ocultado sem deletar)';
COMMENT ON COLUMN testimonials.pedido_id IS 'Pedido relacionado (liberado após pagamento)';
