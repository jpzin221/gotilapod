# 🚀 Guia de Configuração PIX

## ⚠️ IMPORTANTE: Configuração de Portas

Você precisa rodar **2 servidores** em **2 portas diferentes**:

### 1️⃣ Frontend (Porta 3000)
```bash
# Terminal 1 - Na pasta raiz do projeto
npm run dev
```
- Roda em: `http://localhost:3000`
- Vite Dev Server

### 2️⃣ Backend PIX (Porta 3001)
```bash
# Terminal 2 - Na pasta backend
cd backend
npm run dev
```
- Roda em: `http://localhost:3001`
- Express Server

### 3️⃣ Ngrok (Expor Backend)
```bash
# Terminal 3
ngrok http 3001
```
⚠️ **ATENÇÃO**: Exponha a porta **3001** (backend), não a 3000!

---

## 📝 Configuração do .env (Frontend)

Crie o arquivo `.env` na **raiz do projeto** (não no backend):

```env
VITE_SUPABASE_URL=https://fkstktohbnwsnzbarujc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc3RrdG9oYm53c256YmFydWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDI1NjMsImV4cCI6MjA3NzU3ODU2M30.rN3BfRwWeE9Pjf70S8uneSgngYHGPz75FtfqzQfDq6o

# Backend PIX
# Para desenvolvimento local:
VITE_BACKEND_URL=http://localhost:3001

# Para usar com ngrok (substitua pela sua URL):
# VITE_BACKEND_URL=https://sua-url-do-ngrok.ngrok-free.app
```

---

## 📝 Configuração do .env (Backend)

O arquivo `backend/.env` já deve existir. Verifique se tem:

```env
# EFI Bank (Gerencianet)
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
EFI_SANDBOX=true
EFI_PIX_KEY=sua-chave-pix@email.com

# Servidor
PORT=3001

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3000
```

---

## 🔄 Fluxo Completo de Compra

1. **Cliente adiciona produtos ao carrinho**
   - Seleciona sabores (se disponível)
   - Vê contador atualizar em tempo real ✅

2. **Cliente clica "Finalizar Pedido"**
   - Abre modal de checkout
   - Preenche dados pessoais e endereço

3. **Cliente clica "Confirmar e Pagar com PIX"**
   - Frontend envia dados para backend
   - Backend gera QR Code PIX
   - Modal PIX abre automaticamente

4. **Cliente paga com PIX**
   - Escaneia QR Code ou copia código
   - Paga no app do banco
   - Sistema verifica pagamento automaticamente (3s)

5. **Confirmação automática**
   - Modal mostra "Pagamento Confirmado!"
   - Carrinho é limpo
   - Cliente é redirecionado

---

## 🧪 Testando o Sistema

### 1. Verificar Backend
```bash
# Deve retornar status "ok"
curl http://localhost:3001/health
```

### 2. Testar Criação de Cobrança
```bash
curl -X POST http://localhost:3001/api/pix/create-charge \
  -H "Content-Type: application/json" \
  -d '{
    "valorTotal": 85.00,
    "nomeCliente": "João Silva",
    "cpfCliente": "12345678900",
    "itens": [{"nome": "POD GEEK", "quantidade": 1, "preco": 85}]
  }'
```

### 3. Testar no Site
1. Abra `http://localhost:3000`
2. Adicione produtos ao carrinho
3. Clique "Finalizar Pedido"
4. Preencha o formulário
5. Veja o QR Code aparecer

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
- ✅ Verifique se o backend está rodando na porta 3001
- ✅ Verifique o arquivo `.env` do frontend
- ✅ Verifique CORS no backend

### Erro: "CORS policy"
- ✅ Verifique `FRONTEND_URL` no `backend/.env`
- ✅ Deve ser `http://localhost:3000`

### QR Code não aparece
- ✅ Abra o console do navegador (F12)
- ✅ Veja se há erros de conexão
- ✅ Verifique se `VITE_BACKEND_URL` está correto

### Contador do carrinho não atualiza
- ✅ Limpe o localStorage: `localStorage.clear()`
- ✅ Recarregue a página (Ctrl+F5)

---

## 📱 Usando com Ngrok

### 1. Inicie o ngrok na porta 3001:
```bash
ngrok http 3001
```

### 2. Copie a URL gerada:
```
https://abc123.ngrok-free.app
```

### 3. Atualize o `.env` do frontend:
```env
VITE_BACKEND_URL=https://abc123.ngrok-free.app
```

### 4. Reinicie o frontend:
```bash
# Ctrl+C para parar
npm run dev
```

---

## ✅ Checklist Final

- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] `VITE_BACKEND_URL` configurado
- [ ] Teste de health check funcionando
- [ ] Produtos adicionam ao carrinho
- [ ] Contador atualiza corretamente
- [ ] Modal de checkout abre
- [ ] Modal PIX abre após preencher dados

---

## 🎉 Pronto!

Agora seu sistema está completo:
- ✅ Carrinho funcional com sabores
- ✅ Checkout com formulário
- ✅ Pagamento PIX integrado
- ✅ Verificação automática de pagamento

**Próximos passos:**
- Salvar pedidos no Supabase
- Enviar email de confirmação
- Atualizar estoque automaticamente
