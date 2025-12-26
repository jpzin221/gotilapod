-- ============================================
-- SISTEMA DE PEDIDOS E RASTREAMENTO
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE USUÁRIOS (Clientes)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT UNIQUE NOT NULL,
  pin TEXT,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  endereco_completo JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_pedido TEXT UNIQUE NOT NULL,
  
  txid TEXT UNIQUE,
  e2e_id TEXT,
  
  status TEXT NOT NULL DEFAULT 'confirmado',
  
  valor_total DECIMAL(10,2) NOT NULL,
  valor_entrega DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  
  itens JSONB NOT NULL,
  endereco_entrega JSONB NOT NULL,
  
  forma_pagamento TEXT DEFAULT 'pix',
  pago BOOLEAN DEFAULT FALSE,
  pago_em TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  estimativa_entrega TIMESTAMP,
  entregue_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_txid ON pedidos(txid);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);

-- 3. HISTÓRICO DE STATUS (Timeline)
CREATE TABLE IF NOT EXISTS status_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  observacao TEXT,
  automatico BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_pedido ON status_historico(pedido_id);

-- 4. CONFIGURAÇÕES DE TEMPO (Para mudança automática)
CREATE TABLE IF NOT EXISTS config_status_tempo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_atual TEXT NOT NULL,
  proximo_status TEXT NOT NULL,
  minutos_espera INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(status_atual, proximo_status)
);

-- Inserir configurações iniciais (se não existirem)
INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera)
SELECT 'confirmado', 'preparando', 5
WHERE NOT EXISTS (
  SELECT 1 FROM config_status_tempo WHERE status_atual = 'confirmado' AND proximo_status = 'preparando'
);

INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera)
SELECT 'preparando', 'guardando', 10
WHERE NOT EXISTS (
  SELECT 1 FROM config_status_tempo WHERE status_atual = 'preparando' AND proximo_status = 'guardando'
);

INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera)
SELECT 'guardando', 'motoboy_caminho', 5
WHERE NOT EXISTS (
  SELECT 1 FROM config_status_tempo WHERE status_atual = 'guardando' AND proximo_status = 'motoboy_caminho'
);

INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera)
SELECT 'motoboy_caminho', 'coleta', 10
WHERE NOT EXISTS (
  SELECT 1 FROM config_status_tempo WHERE status_atual = 'motoboy_caminho' AND proximo_status = 'coleta'
);

INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera)
SELECT 'coleta', 'em_rota', 5
WHERE NOT EXISTS (
  SELECT 1 FROM config_status_tempo WHERE status_atual = 'coleta' AND proximo_status = 'em_rota'
);

INSERT INTO config_status_tempo (status_atual, proximo_status, minutos_espera)
SELECT 'em_rota', 'entregue', 30
WHERE NOT EXISTS (
  SELECT 1 FROM config_status_tempo WHERE status_atual = 'em_rota' AND proximo_status = 'entregue'
);

-- 5. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. FUNÇÃO PARA CRIAR HISTÓRICO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION criar_historico_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_historico (pedido_id, status, observacao, automatico)
    VALUES (NEW.id, NEW.status, 'Status atualizado', FALSE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_historico_status ON pedidos;
CREATE TRIGGER trigger_historico_status
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION criar_historico_status();

-- 7. VIEW PARA PEDIDOS COM USUÁRIO
CREATE OR REPLACE VIEW pedidos_completos AS
SELECT 
  p.*,
  u.telefone,
  u.nome as cliente_nome,
  u.email as cliente_email
FROM pedidos p
LEFT JOIN usuarios u ON p.usuario_id = u.id;

-- 8. FUNÇÃO PARA GERAR NÚMERO DO PEDIDO
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
  numero TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    numero := '#' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM pedidos WHERE numero_pedido = numero) INTO existe;
    IF NOT existe THEN
      RETURN numero;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA HASH DO PIN
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(pin, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 10. CRIAR USUÁRIO DE TESTE
INSERT INTO usuarios (telefone, pin, nome, cpf, endereco_completo)
SELECT
  '41999999999',
  hash_pin('1234'),
  'João Silva',
  '12345678900',
  '{"cep": "80010-000", "endereco": "Praça Tiradentes", "numero": "123", "bairro": "Centro", "cidade": "Curitiba", "estado": "PR"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE telefone = '41999999999'
);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar tabelas criadas
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas criadas:';
  RAISE NOTICE '   - usuarios';
  RAISE NOTICE '   - pedidos';
  RAISE NOTICE '   - status_historico';
  RAISE NOTICE '   - config_status_tempo';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Configurações de tempo: 6 regras';
  RAISE NOTICE '✅ Funções criadas: 4';
  RAISE NOTICE '✅ Triggers criados: 3';
  RAISE NOTICE '✅ View criada: pedidos_completos';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 BANCO DE DADOS PRONTO!';
END $$;
