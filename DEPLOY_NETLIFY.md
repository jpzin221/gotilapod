# 🚀 Guia Completo de Deploy no Netlify

Este guia te mostra como hospedar seu site **gratuitamente** no Netlify em poucos passos.

---

## ✅ Pré-requisitos

- Conta no [GitHub](https://github.com) (gratuita)
- Conta no [Netlify](https://netlify.com) (gratuita)
- Projeto configurado com Supabase (já está pronto)
- Credenciais BSPay para pagamento PIX (opcional)

---

## 📋 Passo a Passo

### 1️⃣ Subir o Projeto para o GitHub

Se ainda não tem o projeto no GitHub:

```bash
# No PowerShell, dentro da pasta do projeto
git init
git add .
git commit -m "Primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

> **Importante**: O arquivo `.env` NÃO será enviado (está no .gitignore). Isso é bom para segurança!

---

### 2️⃣ Conectar ao Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Selecione **"Deploy with GitHub"**
4. Autorize o Netlify a acessar seu GitHub
5. Escolha o repositório do projeto

---

### 3️⃣ Configurar o Build

O Netlify vai detectar automaticamente as configurações, mas confirme:

| Campo | Valor |
|-------|-------|
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Functions directory** | `netlify/functions` |

---

### 4️⃣ Configurar Variáveis de Ambiente

Esta é a parte **mais importante**! Vá em:

**Site Settings → Environment Variables → Add a variable**

#### Variáveis OBRIGATÓRIAS (Frontend + Supabase):

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://fkstktohbnwsnzbarujc.supabase.co` | URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sua chave anon do Supabase | Chave pública |

#### Variáveis para PIX BSPay (para pagamentos reais):

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `BSPAY_CLIENT_ID` | Seu Client ID | Credencial BSPay |
| `BSPAY_CLIENT_SECRET` | Seu Client Secret | Credencial BSPay |

#### Variáveis para PIX EFI/Gerencianet (alternativo):

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `EFI_CLIENT_ID` | Seu Client ID | Credencial EFI |
| `EFI_CLIENT_SECRET` | Seu Client Secret | Credencial EFI |
| `EFI_CERTIFICATE_BASE64` | Certificado em Base64 | Certificado .p12 convertido |
| `EFI_PIX_KEY` | Sua chave PIX | Chave cadastrada na EFI |
| `EFI_SANDBOX` | `false` | `true` para testes |

> [!WARNING]
> **Sem as variáveis de ambiente, o site não funcionará corretamente!**

---

### 5️⃣ Fazer o Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (cerca de 1-2 minutos)
3. Seu site estará disponível em: `https://SEU_SITE.netlify.app`

---

## 🔧 Comandos Úteis

### Testar localmente antes de fazer deploy:

```bash
# Instalar dependências
npm install

# Instalar dependências das functions
cd netlify/functions && npm install && cd ../..

# Rodar em modo desenvolvimento
npm run dev

# Criar build de produção
npm run build

# Testar build localmente
npm run preview
```

---

## 🌐 Domínio Personalizado (Opcional)

Para usar um domínio próprio (ex: `www.seusite.com.br`):

1. Vá em **Site Settings → Domain management**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar o DNS

---

## ⚙️ Funções Serverless Incluídas

Seu projeto já tem 8 funções serverless prontas:

| Função | Descrição |
|--------|-----------|
| `bspay-create` | Cria cobrança PIX via BSPay |
| `bspay-status` | Verifica status do pagamento BSPay |
| `pix-create` | Cria cobrança PIX via EFI |
| `pix-status` | Verifica status do pagamento EFI |
| `products-get` | Busca produtos do Supabase |
| `criar-pin` | Cria PIN para usuário |
| `send-to-logistics` | Envia pedido para logística |

---

## 🔍 Verificar se Está Funcionando

Após o deploy, teste:

1. ✅ Acesse seu site: `https://SEU_SITE.netlify.app`
2. ✅ Verifique se os produtos carregam
3. ✅ Teste o carrinho de compras
4. ✅ Verifique o checkout (apenas se configurou BSPay)

---

## 🐛 Solução de Problemas

### Erro: "Function not found"

As funções serverless precisam ser deployadas. Verifique:
- As variáveis de ambiente estão configuradas
- A pasta `netlify/functions` tem os arquivos `.js`
- Faça um redeploy: **Deploys → Trigger deploy → Clear cache and deploy site**

### Erro: Produtos não carregam

Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos.

### Erro: PIX não funciona

Verifique as credenciais BSPay ou EFI nas variáveis de ambiente.

---

## 📊 Limites do Plano Gratuito Netlify

| Recurso | Limite Gratuito |
|---------|-----------------|
| Banda | 100GB/mês |
| Build minutes | 300 min/mês |
| Serverless Functions | 125.000 requisições/mês |
| Sites | Ilimitados |
| HTTPS | ✅ Gratuito |
| CDN Global | ✅ Incluído |

---

## ✨ Pronto!

Seu site está 100% configurado para deploy no Netlify. Basta seguir os passos acima!

**Dúvidas?** Acesse a [documentação do Netlify](https://docs.netlify.com).
