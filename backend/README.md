# 🏦 Backend PIX - POD EXPRESSS

Backend para processar pagamentos PIX usando a API da EFI Bank (Gerencianet).

## 📋 Pré-requisitos

1. **Conta na EFI Bank**: https://sejaefi.com.br/
2. **Credenciais API**: Client ID e Client Secret
3. **Certificado**: Arquivo `.p12` da EFI
4. **Chave PIX**: Cadastrada na sua conta EFI

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
copy .env.example .env
```

Edite `.env` e preencha com suas credenciais:

```env
EFI_CLIENT_ID=seu_client_id_aqui
EFI_CLIENT_SECRET=seu_client_secret_aqui
EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
EFI_SANDBOX=true
EFI_PIX_KEY=sua-chave-pix@email.com
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Adicionar Certificado

Baixe o certificado `.p12` da EFI e coloque na pasta `certs/`:

```
backend/
└── certs/
    └── certificado-efi.p12
```

## 🎮 Executar

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

O servidor vai rodar em: http://localhost:3001

## 📡 Endpoints

### 1. Health Check

```
GET /health
```

Retorna status do servidor.

### 2. Criar Cobrança PIX

```
POST /api/pix/create-charge
Content-Type: application/json

{
  "valorTotal": 85.00,
  "nomeCliente": "João Silva",
  "cpfCliente": "12345678900",
  "itens": [
    {
      "nome": "POD GEEK 40K",
      "quantidade": 1,
      "preco": 85.00
    }
  ],
  "pedidoId": "123456"
}
```

**Resposta:**

```json
{
  "success": true,
  "txid": "abc123xyz789",
  "qrcode": "00020126...string longa...",
  "imagemQrcode": "iVBORw0KGgo...base64...",
  "pixCopiaECola": "00020126...string longa..."
}
```

### 3. Verificar Status

```
GET /api/pix/status/:txid
```

**Resposta:**

```json
{
  "success": true,
  "txid": "abc123xyz789",
  "status": "CONCLUIDA",
  "valor": {
    "original": "85.00"
  }
}
```

### 4. Webhook (EFI)

```
POST /api/pix/webhook
```

Endpoint que a EFI chama quando há um pagamento.

## 🧪 Testar com Sandbox

A EFI oferece ambiente de testes (sandbox):

1. Configure `EFI_SANDBOX=true` no `.env`
2. Use as credenciais de sandbox
3. Simule pagamentos na dashboard da EFI

## 🌐 Deploy

### Heroku

```bash
heroku create seu-app-backend-pix
heroku config:set EFI_CLIENT_ID=seu_id
heroku config:set EFI_CLIENT_SECRET=seu_secret
# ... outras variáveis
git subtree push --prefix backend heroku main
```

### Railway

1. Conecte seu repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Importante: Webhook

Para o webhook funcionar, você precisa de uma **URL pública**:

- **Desenvolvimento**: Use [ngrok](https://ngrok.com/) para expor localhost
- **Produção**: URL do seu servidor (ex: https://api.seusite.com)

Configurar webhook na EFI:

```bash
POST /api/pix/configure-webhook
{
  "chave": "sua-chave-pix@email.com",
  "webhookUrl": "https://api.seusite.com/api/pix/webhook"
}
```

## 📚 Recursos

- [Documentação EFI Bank](https://dev.efipay.com.br/docs)
- [SDK Node.js](https://github.com/efipay/sdk-node-apis-efi)
- [Sandbox EFI](https://dev.efipay.com.br/docs/api-pix/testando)

## 🆘 Problemas Comuns

### "Certificado não encontrado"

Certifique-se que o arquivo `.p12` está na pasta `certs/`

### "Credenciais inválidas"

Verifique se Client ID e Secret estão corretos no `.env`

### "Webhook não funciona"

1. Verifique se a URL é pública (não localhost)
2. Use ngrok em desenvolvimento
3. Configure na dashboard da EFI

## 📝 TODO

- [ ] Integrar com Supabase para salvar pedidos
- [ ] Enviar email de confirmação
- [ ] Notificações WhatsApp/Telegram
- [ ] Dashboard de pedidos
- [ ] Testes automatizados
