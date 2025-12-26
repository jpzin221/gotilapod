-- Adicionar colunas faltantes na tabela pedidos
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna nome_cliente
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS nome_cliente TEXT;

-- Adicionar coluna telefone
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Adicionar comentários
COMMENT ON COLUMN public.pedidos.nome_cliente IS 'Nome do cliente que fez o pedido';
COMMENT ON COLUMN public.pedidos.telefone IS 'Telefone do cliente (usado para vincular ao usuário)';

-- Criar índice para busca por telefone (melhora performance)
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone ON public.pedidos(telefone);

-- Criar índice para busca por nome_cliente
CREATE INDEX IF NOT EXISTS idx_pedidos_nome_cliente ON public.pedidos(nome_cliente);

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pedidos'
  AND column_name IN ('nome_cliente', 'telefone', 'pago', 'pago_em')
ORDER BY column_name;
