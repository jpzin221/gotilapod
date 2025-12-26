# ✅ Checklist de Deploy - Netlify

Use este checklist para garantir que tudo está pronto antes do deploy!

## 🔧 Configuração Inicial

### Supabase
- [ ] Projeto criado no Supabase
- [ ] Bucket `product-images` criado
- [ ] Bucket configurado como **público**
- [ ] Políticas de acesso configuradas (ver SETUP_STORAGE.md)
- [ ] Tabelas criadas (products, flavors, etc)
- [ ] Dados de teste inseridos

### Variáveis de Ambiente
- [ ] `.env` criado localmente (não commitado!)
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] Variáveis testadas localmente

## 📦 Preparação do Código

### Arquivos Essenciais
- [ ] `netlify.toml` na raiz do projeto
- [ ] `public/_redirects` criado
- [ ] `vite.config.js` otimizado
- [ ] `.gitignore` configurado corretamente
- [ ] `package.json` com script de build

### Imagens
- [ ] Imagens de produtos no Supabase Storage
- [ ] Imagens do carrossel no Supabase Storage
- [ ] URLs das imagens testadas (acessíveis publicamente)
- [ ] Imagens locais (se houver) na pasta `src/Imagens/`

### Código
- [ ] Sem `console.log` desnecessários
- [ ] Sem `debugger` statements
- [ ] Imports corretos (sem caminhos quebrados)
- [ ] Componentes sem erros
- [ ] Rotas configuradas corretamente

## 🧪 Testes Locais

### Build
```bash
# 1. Verificar configuração
npm run predeploy

# 2. Fazer build
npm run build

# 3. Testar build localmente
npm run preview
```

- [ ] Build executado sem erros
- [ ] Preview local funcionando
- [ ] Todas as páginas carregam
- [ ] Imagens aparecem corretamente
- [ ] Navegação funciona
- [ ] Formulários funcionam
- [ ] Carrinho funciona

### Funcionalidades
- [ ] Listagem de produtos
- [ ] Modal de produto
- [ ] Seleção de sabores
- [ ] Adicionar ao carrinho
- [ ] Checkout
- [ ] Painel admin (se aplicável)
- [ ] Upload de imagens (admin)

## 🚀 Deploy no Netlify

### Opção A: Via Git (Recomendado)

#### 1. Repositório Git
```bash
git init
git add .
git commit -m "Initial commit - Ready for deploy"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

- [ ] Repositório criado no GitHub
- [ ] Código commitado
- [ ] Push realizado

#### 2. Conectar ao Netlify
- [ ] Conta criada no Netlify
- [ ] Site criado: "Import an existing project"
- [ ] Repositório conectado
- [ ] Build settings configurados:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Branch: `main`

#### 3. Variáveis de Ambiente no Netlify
- [ ] Ir em: Site settings → Environment variables
- [ ] Adicionar `VITE_SUPABASE_URL`
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY`
- [ ] Salvar variáveis

#### 4. Deploy
- [ ] Clicar em "Deploy site"
- [ ] Aguardar build (2-5 minutos)
- [ ] Verificar logs de build
- [ ] Build concluído com sucesso

### Opção B: Deploy Manual

```bash
# 1. Fazer build
npm run build

# 2. No Netlify
# - Arrastar pasta dist para área de drop
# - Aguardar upload
```

- [ ] Build local realizado
- [ ] Pasta `dist` criada
- [ ] Upload no Netlify concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Trigger deploy novamente

## ✅ Verificação Pós-Deploy

### Site no Ar
- [ ] Site acessível via URL Netlify
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Todas as páginas carregam
- [ ] Sem erros no console do navegador

### Funcionalidades
- [ ] Produtos aparecem na home
- [ ] Imagens carregam corretamente
- [ ] Modal de produto abre
- [ ] Seleção de sabores funciona
- [ ] Carrinho funciona
- [ ] Checkout funciona
- [ ] Admin acessível (se aplicável)

### Performance
- [ ] Site carrega rápido (< 3 segundos)
- [ ] Imagens otimizadas
- [ ] Sem erros 404
- [ ] Lighthouse score > 80

### Mobile
- [ ] Site responsivo
- [ ] Funciona em celular
- [ ] Touch/swipe funcionam
- [ ] Botões clicáveis

## 🔧 Configurações Opcionais

### Domínio Personalizado
- [ ] Domínio comprado
- [ ] DNS configurado
- [ ] Domínio adicionado no Netlify
- [ ] SSL automático ativado

### Analytics
- [ ] Google Analytics configurado
- [ ] Netlify Analytics ativado (opcional)

### Notificações
- [ ] Notificações de deploy configuradas
- [ ] Email de falhas ativado

## 📊 Monitoramento

### Primeira Semana
- [ ] Verificar logs de erro diariamente
- [ ] Monitorar performance
- [ ] Coletar feedback de usuários
- [ ] Corrigir bugs críticos

### Manutenção
- [ ] Backups do banco de dados
- [ ] Atualizações de dependências
- [ ] Monitoramento de uptime
- [ ] Análise de métricas

## 🐛 Troubleshooting

### Build Falhou
```bash
# Limpar e reinstalar
npm run clean
npm install
npm run build
```

### Imagens Não Carregam
- Verificar se bucket é público
- Testar URL diretamente
- Verificar políticas de acesso

### Erro 404 nas Rotas
- Verificar `netlify.toml`
- Verificar `public/_redirects`
- Fazer novo deploy

### Variáveis de Ambiente
- Verificar no painel do Netlify
- Fazer novo deploy após adicionar

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview local
npm run preview

# Verificar antes de deploy
npm run predeploy

# Build + verificação
npm run deploy:check

# Limpar tudo
npm run clean

# Reinstalar dependências
npm run reinstall
```

## 🎉 Deploy Concluído!

Parabéns! Seu site está no ar! 🚀

**URLs:**
- Site: https://seu-site.netlify.app
- Admin: https://seu-site.netlify.app/admin

**Próximos Passos:**
1. Compartilhar com usuários
2. Coletar feedback
3. Fazer melhorias
4. Monitorar métricas

---

**Dúvidas?** Consulte:
- `DEPLOY_GUIDE.md` - Guia completo
- `SETUP_STORAGE.md` - Configuração de imagens
- Documentação Netlify: https://docs.netlify.com
