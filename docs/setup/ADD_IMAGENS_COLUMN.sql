-- ============================================
-- ADICIONAR COLUNA DE IMAGENS NA TABELA TESTIMONIALS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna imagens (array JSON de URLs)
ALTER TABLE public.testimonials 
ADD COLUMN IF NOT EXISTS imagens JSONB DEFAULT NULL;

-- 2. Comentário explicativo
COMMENT ON COLUMN public.testimonials.imagens IS 'Array JSON com URLs das imagens do depoimento (máximo 3 imagens). Exemplo: ["url1.jpg", "url2.jpg", "url3.jpg"]';

-- 3. Criar índice GIN para buscar em JSONB (opcional, melhora performance)
CREATE INDEX IF NOT EXISTS idx_testimonials_imagens ON public.testimonials USING GIN (imagens);

-- ============================================
-- VERIFICAR SE FOI CRIADO CORRETAMENTE
-- ============================================

-- Execute para confirmar:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'testimonials' AND column_name = 'imagens';

-- Deve retornar:
-- column_name | data_type | is_nullable
-- imagens     | jsonb     | YES

-- ============================================
-- TESTE: ADICIONAR IMAGEM A UM DEPOIMENTO
-- ============================================

-- Exemplo 1: Adicionar 1 imagem
UPDATE public.testimonials 
SET imagens = '["https://picsum.photos/400/400"]'::jsonb
WHERE nome = 'meeeendesmenezes.sp';

-- Exemplo 2: Adicionar múltiplas imagens
-- UPDATE public.testimonials 
-- SET imagens = '["https://picsum.photos/400/400", "https://picsum.photos/500/500"]'::jsonb
-- WHERE id = 'uuid-aqui';

-- ============================================
-- VERIFICAR DEPOIMENTOS COM IMAGENS
-- ============================================

-- Listar todos com imagens:
SELECT 
  id, 
  nome, 
  SUBSTRING(depoimento, 1, 50) as depoimento_preview,
  jsonb_array_length(imagens) as qtd_imagens,
  imagens
FROM public.testimonials 
WHERE imagens IS NOT NULL 
  AND jsonb_array_length(imagens) > 0
ORDER BY created_at DESC;

-- ============================================
-- LIMPAR IMAGENS (SE NECESSÁRIO)
-- ============================================

-- Remover imagens de um depoimento específico:
-- UPDATE public.testimonials 
-- SET imagens = NULL
-- WHERE id = 'uuid-aqui';

-- Remover todas as imagens:
-- UPDATE public.testimonials 
-- SET imagens = NULL;
