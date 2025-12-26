-- ============================================
-- ADICIONAR CAMPOS DE CLIENTE NA TABELA PEDIDOS
-- ============================================
-- 
-- PROBLEMA: Pedidos não armazenam dados do cliente diretamente
-- SOLUÇÃO: Adicionar campos nome_cliente, cpf_cliente e telefone
--
-- MOTIVO: 
-- - Pedidos podem ser criados sem usuário cadastrado (usuario_id = null)
-- - Precisamos dos dados do cliente mesmo sem conta
-- - Facilita consultas e relatórios
-- ============================================

-- 1. Adicionar coluna nome_cliente
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS nome_cliente TEXT;

-- 2. Adicionar coluna cpf_cliente
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cpf_cliente TEXT;

-- 3. Adicionar coluna telefone
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS telefone TEXT;

-- 4. Comentários nas colunas
COMMENT ON COLUMN pedidos.nome_cliente IS 'Nome do cliente (mesmo sem cadastro)';
COMMENT ON COLUMN pedidos.cpf_cliente IS 'CPF do cliente';
COMMENT ON COLUMN pedidos.telefone IS 'Telefone do cliente';

-- 5. Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone ON pedidos(telefone);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colunas adicionadas à tabela pedidos:';
  RAISE NOTICE '   - nome_cliente (TEXT)';
  RAISE NOTICE '   - cpf_cliente (TEXT)';
  RAISE NOTICE '   - telefone (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Índice criado:';
  RAISE NOTICE '   - idx_pedidos_telefone';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TABELA PEDIDOS ATUALIZADA!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Agora os pedidos podem armazenar:';
  RAISE NOTICE '   - Dados do cliente mesmo sem cadastro';
  RAISE NOTICE '   - Nome, CPF e telefone diretamente';
  RAISE NOTICE '   - Facilita consultas e relatórios';
END $$;

-- ============================================
-- EXEMPLO DE USO
-- ============================================

/*
-- Criar pedido com dados do cliente
INSERT INTO pedidos (
  numero_pedido,
  nome_cliente,
  cpf_cliente,
  telefone,
  valor_total,
  itens,
  endereco_entrega,
  status
) VALUES (
  '#123456',
  'João Silva',
  '12345678900',
  '11999999999',
  85.00,
  '[{"nome": "POD GEEK", "quantidade": 1, "preco": 85.00}]'::jsonb,
  '{"cep": "06768-100", "endereco": "Rua Exemplo", "numero": "123"}'::jsonb,
  'confirmado'
);

-- Buscar pedidos por telefone
SELECT * FROM pedidos WHERE telefone = '11999999999';

-- Buscar pedidos por nome
SELECT * FROM pedidos WHERE nome_cliente ILIKE '%joão%';
*/
