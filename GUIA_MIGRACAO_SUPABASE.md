# 📦 Guia de Migração para Novo Supabase

Este guia irá ajudá-lo a migrar todo o banco de dados para um novo projeto Supabase.

## 📋 Pré-requisitos

- [ ] Conta no Supabase criada
- [ ] Acesso ao painel do Supabase

---

## 🚀 Passo a Passo

### 1. Criar Novo Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: Nome do seu projeto (ex: `loja-pods`)
   - **Database Password**: Senha forte (guarde ela!)
   - **Region**: Escolha o mais próximo (ex: `South America (São Paulo)`)
4. Clique em **"Create new project"**
5. ⏳ Aguarde a criação (~2 minutos)

---

### 2. Executar o SQL de Migração

1. No painel do Supabase, vá em **SQL Editor** (ícone ⚡ no menu lateral)
2. Clique em **"New Query"**
3. Abra o arquivo [`MIGRACAO_COMPLETA_SUPABASE.sql`](./MIGRACAO_COMPLETA_SUPABASE.sql)
4. **Copie TODO o conteúdo do arquivo**
5. **Cole no SQL Editor**
6. Clique em **"Run"** (ou pressione `Ctrl + Enter`)
7. ✅ Aguarde a execução (~10-30 segundos)

---

### 3. Verificar se Tudo Funcionou

Após executar o SQL, você deve ver:

```
✅ ============================================
✅ MIGRAÇÃO COMPLETA DO BANCO DE DADOS
✅ ============================================

📊 Tabelas criadas:
   - products (produtos)
   - store_settings (configurações da loja)
   - physical_stores (lojas físicas)
   - carousel_slides (carrossel)
   - usuarios (clientes)
   - pedidos (pedidos)
   - status_historico (timeline de status)
   - config_status_tempo (automatização)
   - testimonials (depoimentos)

🔧 Funções criadas: 4
⚡ Triggers criados: 8
👁️ Views criadas: 1
📦 Storage bucket criado: product-images

🎉 BANCO DE DADOS PRONTO PARA USO!
```

Mais abaixo você verá uma tabela mostrando quantos registros tem em cada tabela.

---

### 4. Copiar Credenciais do Supabase

1. No painel do Supabase, vá em **⚙️ Settings** → **API**
2. Copie as seguintes informações:

   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** (chave pública)

---

### 5. Atualizar o .env do Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Atualize as seguintes variáveis:

```env
VITE_SUPABASE_URL=SUA_PROJECT_URL_AQUI
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

**Exemplo:**
```env
VITE_SUPABASE_URL=https://abc123xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Salve o arquivo**

---

### 6. Configurar Storage (Upload de Imagens)

O bucket `product-images` já foi criado automaticamente pelo script SQL!

Para verificar:
1. Vá em **☁️ Storage** no painel do Supabase
2. Você deve ver o bucket **`product-images`** listado
3. ✅ Pronto! As imagens de produtos serão salvas aqui

---

### 7. Importar Produtos (Opcional)

Se você tem produtos para importar:

1. Vá em **Table Editor** → **products**
2. Clique em **"Insert"** → **"Insert row"**
3. Preencha os dados de cada produto
4. Ou use a funcionalidade de **"Insert from CSV"** se tiver um arquivo

**Campos principais:**
- `name`: Nome do produto
- `description`: Descrição
- `price`: Preço atual
- `original_price`: Preço original (para promoções)
- `category`: Categoria (IGNITE, GEEK BAR, LOST MARY, ELF BAR, PODS, ACESSÓRIOS)
- `stock`: Quantidade em estoque
- `image_url`: URL da imagem
- `em_promocao`: `true` ou `false`

---

### 8. Testar a Conexão

1. No terminal, execute:
   ```bash
   npm run dev
   ```

2. Acesse o site no navegador (`http://localhost:5173`)

3. Verifique se:
   - ✅ Produtos estão aparecendo
   - ✅ Carrossel funciona
   - ✅ Lojas físicas aparecem
   - ✅ Não há erros no console

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

| Tabela | Descrição | Registros Iniciais |
|--------|-----------|-------------------|
| `products` | Produtos da loja | 0 (você importa) |
| `store_settings` | Configurações gerais | 1 |
| `physical_stores` | Lojas físicas | 3 exemplos |
| `carousel_slides` | Slides do carrossel | 0 (você adiciona) |
| `usuarios` | Clientes cadastrados | 1 teste |
| `pedidos` | Pedidos realizados | 0 |
| `status_historico` | Histórico de status | 0 |
| `config_status_tempo` | Configurações de automatização | 6 |
| `testimonials` | Depoimentos de clientes | 3 exemplos |

---

## 🔧 Configurações Avançadas (Opcional)

### Habilitar Row Level Security (RLS)

Se quiser mais segurança, você pode habilitar RLS:

```sql
-- Para produtos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de produtos"
  ON products FOR SELECT
  USING (true);

-- Repetir para outras tabelas conforme necessário
```

### Backup do Banco Antigo

Antes de migrar, faça backup do banco antigo:

1. Vá no projeto antigo do Supabase
2. **Database** → **Backups**
3. Clique em **"Schedule a backup"**

---

## ❓ Problemas Comuns

### Erro: "relation already exists"

**Solução:** Você já executou o script antes. Está tudo OK!

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando o SQL Editor, não o terminal.

### Produtos não aparecem no site

**Solução:**
1. Verifique o `.env`
2. Certifique-se de ter produtos cadastrados
3. Limpe o cache do navegador (`Ctrl + Shift + R`)

---

## ✅ Checklist Pós-Migração

- [ ] Banco de dados criado e populado
- [ ] `.env` atualizado com novas credenciais
- [ ] Site abre sem erros
- [ ] Produtos aparecem (se importados)
- [ ] Configurações da loja funcionam
- [ ] Storage configurado

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Console do navegador (F12) para erros JavaScript
2. Logs do terminal onde rodou `npm run dev`
3. SQL Editor do Supabase para erros de execução

---

**🎉 Migração Completa!** Seu banco de dados está pronto para usar.
