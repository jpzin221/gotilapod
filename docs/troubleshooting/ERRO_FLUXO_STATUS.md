# Erro: "Número de departamento" ao acessar Fluxo de Status

## Problema

Ao acessar a aba "Fluxo de Status" no painel administrativo (`/admin`), aparece um erro:

```
localhost:3000 diz
Número de departamento
```

## Causa

O erro ocorre porque a tabela `fluxo_status_rastreamento` usa um trigger que depende da função `update_updated_at_column()`, mas essa função não foi criada no banco de dados.

### Detalhes Técnicos

No arquivo `FLUXO_STATUS_RASTREAMENTO.sql`, há este código:

```sql
CREATE TRIGGER update_fluxo_status_updated_at
  BEFORE UPDATE ON fluxo_status_rastreamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Porém, a função `update_updated_at_column()` não existe, causando o erro.

## Solução

Execute o script SQL corrigido que inclui a criação da função necessária:

### Opção 1: Executar Script Completo (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o arquivo: `docs/setup/FLUXO_STATUS_RASTREAMENTO_CORRIGIDO.sql`

Este arquivo já inclui:
- ✅ Criação da função `update_updated_at_column()`
- ✅ Criação da tabela `fluxo_status_rastreamento`
- ✅ Índices necessários
- ✅ Trigger configurado
- ✅ Inserção das etapas padrão (13 etapas)

### Opção 2: Criar Apenas a Função

Se você já executou o script original e só precisa da função, execute:

```sql
-- Criar função update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Verificação

Após executar o script, verifique se tudo está funcionando:

```sql
-- Verificar se a tabela existe
SELECT COUNT(*) FROM fluxo_status_rastreamento;

-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';

-- Verificar se o trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'update_fluxo_status_updated_at';
```

Resultado esperado:
- Tabela: 13 etapas
- Função: 1 resultado
- Trigger: 1 resultado

## Testando no Admin

1. Acesse `/admin`
2. Clique na aba "Fluxo de Status"
3. Você deve ver 13 etapas configuráveis
4. Teste arrastar para reordenar
5. Clique em "Salvar Fluxo"

## Arquivos Relacionados

- **Script Corrigido**: `docs/setup/FLUXO_STATUS_RASTREAMENTO_CORRIGIDO.sql`
- **Script Original**: `docs/setup/FLUXO_STATUS_RASTREAMENTO.sql` (com problema)
- **Schema Completo**: `docs/setup/DATABASE_SCHEMA_CORRIGIDO.sql` (inclui a função)
- **Componente Frontend**: `src/components/admin/FluxoStatusManager.jsx`

## Prevenção

Para evitar este erro no futuro:

1. **Sempre execute o schema completo primeiro**: `DATABASE_SCHEMA_CORRIGIDO.sql`
2. **Depois execute os scripts específicos**: Como `FLUXO_STATUS_RASTREAMENTO_CORRIGIDO.sql`
3. **Verifique dependências**: Antes de executar um script, verifique se ele depende de funções ou tabelas de outros scripts

## Ordem Recomendada de Execução

```bash
1. DATABASE_SCHEMA_CORRIGIDO.sql      # Cria funções base e tabelas principais
2. FLUXO_STATUS_RASTREAMENTO_CORRIGIDO.sql  # Cria tabela de fluxo
3. ORDER_TIMINGS.sql                  # Cria tabela de tempos
4. SCHEMA_DEPOIMENTOS.sql             # Cria tabela de depoimentos
```

## Nota sobre a Mensagem de Erro

A mensagem "Número de departamento" é uma tradução estranha do PostgreSQL. O erro real é:

```
ERROR: function update_updated_at_column() does not exist
```

O navegador traduz automaticamente para português, resultando em uma mensagem confusa.
