# 🚀 Guia de Deploy no Netlify

## 📋 Pré-requisitos

- ✅ Conta no Netlify (https://netlify.com)
- ✅ Conta no Supabase configurada
- ✅ Bucket `product-images` criado no Supabase Storage
- ✅ Node.js instalado (v18+)

## 🔧 Passo 1: Preparar Variáveis de Ambiente

### 1.1 Criar arquivo `.env.production`

Crie o arquivo `.env.production` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

⚠️ **IMPORTANTE:** Nunca commite este arquivo! Ele já está no `.gitignore`.

### 1.2 Obter credenciais do Supabase

1. Acesse https://supabase.com
2. Vá no seu projeto
3. Clique em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## 📦 Passo 2: Testar Build Localmente

```bash
# Instalar dependências
npm install

# Testar build
npm run build

# Testar preview local
npm run preview
```

Se o build passar sem erros, você está pronto! ✅

## 🌐 Passo 3: Deploy no Netlify

### Opção A: Deploy via Git (Recomendado)

1. **Criar repositório no GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/seu-repo.git
   git push -u origin main
   ```

2. **Conectar ao Netlify:**
   - Acesse https://app.netlify.com
   - Clique em **"Add new site"** → **"Import an existing project"**
   - Escolha **GitHub**
   - Selecione seu repositório
   
3. **Configurar Build:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Branch:** `main`

4. **Adicionar Variáveis de Ambiente:**
   - Vá em **Site settings** → **Environment variables**
   - Clique em **"Add a variable"**
   - Adicione:
     - `VITE_SUPABASE_URL` = sua URL
     - `VITE_SUPABASE_ANON_KEY` = sua chave

5. **Deploy:**
   - Clique em **"Deploy site"**
   - Aguarde o build (2-5 minutos)
   - Seu site estará no ar! 🎉

### Opção B: Deploy Manual (Drag & Drop)

1. **Fazer build:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   - Acesse https://app.netlify.com
   - Arraste a pasta `dist` para a área de drop
   - Aguarde o upload

3. **Configurar Variáveis:**
   - Vá em **Site settings** → **Environment variables**
   - Adicione as variáveis do Supabase
   - Faça **"Trigger deploy"** novamente

## 🖼️ Passo 4: Configurar Imagens

### 4.1 Imagens no Supabase Storage

Todas as imagens de produtos devem estar no Supabase Storage:

```
product-images/
├── products/          # Imagens de produtos
└── carousel/          # Imagens do carrossel
```

**Configuração:**
- Bucket: `product-images`
- Tipo: **Público**
- Políticas: Configuradas (ver SETUP_STORAGE.md)

### 4.2 Imagens Locais (Opcional)

Se você tem imagens na pasta `src/Imagens/`, elas serão incluídas no build automaticamente.

**Estrutura recomendada:**
```
src/
└── Imagens/
    ├── Fotos-site/
    │   ├── foto-carrosel-celular.webp
    │   └── foto-carrosel-desktop.webp
    └── background.webp
```

## 🔒 Passo 5: Configurar Domínio (Opcional)

### 5.1 Domínio Netlify (Gratuito)

1. Vá em **Site settings** → **Domain management**
2. Clique em **"Change site name"**
3. Escolha: `seu-nome.netlify.app`

### 5.2 Domínio Personalizado

1. Compre um domínio (ex: Registro.br, GoDaddy)
2. No Netlify: **Domain management** → **"Add custom domain"**
3. Siga as instruções para configurar DNS
4. Netlify fornece SSL automático (HTTPS) ✅

## ✅ Checklist Final

Antes de fazer deploy, verifique:

- [ ] Build local funciona (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Bucket Supabase criado e público
- [ ] Políticas de acesso configuradas
- [ ] Imagens testadas (carregam corretamente)
- [ ] `.env` não está commitado
- [ ] `netlify.toml` está na raiz

## 🐛 Troubleshooting

### Erro: "Module not found"
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro: "Environment variables not defined"
- Verifique se as variáveis estão no painel do Netlify
- Faça um novo deploy após adicionar variáveis

### Imagens não carregam
- Verifique se o bucket é **público**
- Teste a URL da imagem diretamente no navegador
- Verifique as políticas de acesso (SETUP_STORAGE.md)

### Build demora muito
- Normal! Primeiro build pode levar 3-5 minutos
- Builds subsequentes são mais rápidos (cache)

## 📊 Monitoramento

Após deploy, monitore:

1. **Analytics:** Netlify Analytics (pago) ou Google Analytics
2. **Erros:** Netlify Logs em **Deploys** → **Deploy log**
3. **Performance:** Lighthouse (Chrome DevTools)

## 🔄 Atualizações Futuras

Para atualizar o site:

1. Faça suas alterações no código
2. Commit e push:
   ```bash
   git add .
   git commit -m "Descrição da mudança"
   git push
   ```
3. Netlify faz deploy automático! 🚀

## 📝 Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Limpar cache
rm -rf node_modules dist .vite
npm install
npm run build
```

## 🎉 Pronto!

Seu site está no ar! Acesse:
- **URL Netlify:** https://seu-site.netlify.app
- **Painel Admin:** https://seu-site.netlify.app/admin

---

**Dúvidas?** Consulte:
- Documentação Netlify: https://docs.netlify.com
- Documentação Vite: https://vitejs.dev
- Documentação Supabase: https://supabase.com/docs
