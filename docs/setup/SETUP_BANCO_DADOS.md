# 🗄️ Setup do Banco de Dados - Supabase

## 📋 Passo a Passo:

### 1. **Acesse o Supabase**
```
https://supabase.com/dashboard
```

### 2. **Selecione seu projeto**

### 3. **Vá em "SQL Editor"** (ícone de banco de dados na sidebar)

### 4. **Clique em "New Query"**

### 5. **Cole TODO o conteúdo do arquivo:**
```
DATABASE_SCHEMA.sql
```

### 6. **Clique em "RUN"** (ou pressione Ctrl+Enter)

### 7. **Aguarde a execução** (pode levar alguns segundos)

---

## ✅ O que será criado:

### Tabelas:
- ✅ `usuarios` - Dados dos clientes (telefone, PIN, etc)
- ✅ `pedidos` - Pedidos realizados
- ✅ `status_historico` - Timeline de cada pedido
- ✅ `config_status_tempo` - Configuração de tempo automático

### Funções:
- ✅ `update_updated_at_column()` - Atualiza timestamp automaticamente
- ✅ `criar_historico_status()` - Cria histórico quando status muda
- ✅ `gerar_numero_pedido()` - Gera número único (#123456)
- ✅ `hash_pin()` - Hash seguro do PIN

### Triggers:
- ✅ Atualiza `updated_at` automaticamente
- ✅ Cria histórico ao mudar status

### Políticas RLS:
- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só veem seus próprios pedidos

---

## 🧪 Teste se funcionou:

Execute esta query no SQL Editor:

```sql
-- Ver tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver usuário de teste
SELECT * FROM usuarios WHERE telefone = '41999999999';

-- Ver configurações de tempo
SELECT * FROM config_status_tempo;
```

**Resultado esperado:**
```
Tabelas:
- config_status_tempo
- pedidos
- status_historico
- usuarios

Usuário de teste:
- telefone: 41999999999
- nome: João Silva
- PIN: (hash)

Configurações:
- 6 regras de mudança automática
```

---

## ⚠️ Se der erro:

### Erro: "uuid_generate_v4() does not exist"
**Solução:** Execute antes:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "permission denied"
**Solução:** Você precisa estar logado como owner do projeto

### Erro: "table already exists"
**Solução:** Tabelas já existem, tudo certo! ✅

---

## 🔐 Configurar Row Level Security (RLS):

Se quiser desabilitar RLS temporariamente para testes:

```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_historico DISABLE ROW LEVEL SECURITY;
```

**⚠️ NÃO FAÇA ISSO EM PRODUÇÃO!**

---

## 📊 Queries Úteis para Testes:

### Ver todos os pedidos:
```sql
SELECT 
  p.numero_pedido,
  p.status,
  u.nome as cliente,
  u.telefone,
  p.valor_total,
  p.created_at
FROM pedidos p
JOIN usuarios u ON p.usuario_id = u.id
ORDER BY p.created_at DESC;
```

### Ver histórico de um pedido:
```sql
SELECT 
  status,
  observacao,
  automatico,
  created_at
FROM status_historico
WHERE pedido_id = 1 -- Coloque o ID do pedido
ORDER BY created_at;
```

### Ver próximas mudanças automáticas:
```sql
SELECT 
  p.numero_pedido,
  p.status as status_atual,
  c.proximo_status,
  c.minutos_espera,
  p.updated_at + (c.minutos_espera || ' minutes')::INTERVAL as proxima_mudanca
FROM pedidos p
JOIN config_status_tempo c ON c.status_atual = p.status
WHERE p.status != 'entregue'
  AND p.status != 'cancelado';
```

---

## 🚀 Próximos Passos:

Após executar o SQL:

1. ✅ Banco criado
2. ⏭️ Criar rotas no backend para gerenciar pedidos
3. ⏭️ Integrar com webhook do PIX
4. ⏭️ Criar sistema de mudança automática de status
5. ⏭️ Criar componentes de login e painel do cliente

---

**Execute o SQL e me confirme se deu tudo certo!** ✨
