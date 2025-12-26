# ⚡ Início Rápido - Pagamentos PIX

## ✅ Checklist de Configuração

### 1️⃣ Conta EFI Bank

- [ ] Criar conta em https://sejaefi.com.br/
- [ ] Ativar PIX na conta
- [ ] Cadastrar uma chave PIX (email, telefone ou CPF/CNPJ)

### 2️⃣ Obter Credenciais

- [ ] Login em https://sistema.sejaefi.com.br/
- [ ] Ir em **API** → **Minhas Aplicações**
- [ ] Criar uma aplicação (se não tiver)
- [ ] Copiar **Client ID**
- [ ] Copiar **Client Secret**

### 3️⃣ Baixar Certificado

- [ ] Ir em **API** → **Meus Certificados**
- [ ] Baixar o certificado `.p12`
- [ ] Salvar em `backend/certs/certificado-efi.p12`

### 4️⃣ Configurar Backend

```bash
cd backend
npm install
copy .env.example .env
```

Editar `.env`:
```env
EFI_CLIENT_ID=seu_client_id_aqui
EFI_CLIENT_SECRET=seu_client_secret_aqui
EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
EFI_SANDBOX=true
EFI_PIX_KEY=sua-chave-pix@email.com
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 5️⃣ Rodar Backend

```bash
npm run dev
```

Deve aparecer:
```
🚀 Backend PIX rodando na porta 3001
🚀 Ambiente: SANDBOX
```

### 6️⃣ Testar no Navegador

Abra: http://localhost:3001/health

Deve retornar:
```json
{
  "status": "ok",
  "message": "Backend PIX rodando"
}
```

### 7️⃣ Integrar no Frontend

Exemplo de uso:

```javascript
import { useState } from 'react';
import PixPayment from './components/PixPayment';

function Cart() {
  const [showPix, setShowPix] = useState(false);
  const [pedidoData, setPedidoData] = useState(null);

  const handleFinalizarCompra = () => {
    const pedido = {
      id: Date.now(),
      valorTotal: 85.00,
      nomeCliente: 'João Silva',
      cpfCliente: '12345678900',
      itens: [
        { nome: 'POD GEEK 40K', quantidade: 1, preco: 85.00 }
      ]
    };

    setPedidoData(pedido);
    setShowPix(true);
  };

  return (
    <>
      <button onClick={handleFinalizarCompra}>
        Finalizar Compra com PIX
      </button>

      <PixPayment
        isOpen={showPix}
        onClose={() => setShowPix(false)}
        pedido={pedidoData}
      />
    </>
  );
}
```

### 8️⃣ Testar Pagamento

1. Clique em "Finalizar Compra com PIX"
2. QR Code vai aparecer
3. Em **SANDBOX**, o pagamento não é real
4. Simule pagamento na dashboard da EFI

### 9️⃣ Configurar Webhook (Produção)

Para receber notificações de pagamento:

1. **Desenvolvimento**: Use ngrok
   ```bash
   ngrok http 3001
   ```
   
2. **Produção**: Use sua URL pública
   ```
   https://api.seusite.com
   ```

3. Configurar na EFI:
   ```bash
   POST http://localhost:3001/api/pix/configure-webhook
   {
     "chave": "sua-chave-pix@email.com",
     "webhookUrl": "https://sua-url.com/api/pix/webhook"
   }
   ```

### 🔟 Ir para Produção

- [ ] Mudar `EFI_SANDBOX=false` no `.env`
- [ ] Usar credenciais de PRODUÇÃO (não sandbox)
- [ ] Fazer deploy do backend (Heroku, Railway, etc)
- [ ] Atualizar URL no frontend
- [ ] Configurar webhook com URL pública
- [ ] Testar com pagamento real

## 🎯 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do servidor |
| POST | `/api/pix/create-charge` | Criar cobrança PIX |
| GET | `/api/pix/status/:txid` | Verificar pagamento |
| POST | `/api/pix/webhook` | Receber notificações |

## 📱 Teste Rápido com cURL

### Criar cobrança:
```bash
curl -X POST http://localhost:3001/api/pix/create-charge \
  -H "Content-Type: application/json" \
  -d '{
    "valorTotal": 85.00,
    "nomeCliente": "João Silva",
    "cpfCliente": "12345678900",
    "itens": [
      {"nome": "POD GEEK 40K", "quantidade": 1, "preco": 85.00}
    ],
    "pedidoId": "123"
  }'
```

### Verificar status:
```bash
curl http://localhost:3001/api/pix/status/seu_txid_aqui
```

## 🐛 Problemas Comuns

### "Certificado não encontrado"
✅ Certifique-se que o `.p12` está em `backend/certs/`

### "Credenciais inválidas"
✅ Verifique Client ID e Secret no `.env`

### "CORS error"
✅ Verifique `FRONTEND_URL` no `.env`

### "Webhook não funciona"
✅ Use URL pública (não localhost)
✅ Configure no painel da EFI

## 📚 Próximos Passos

1. **Integrar com Supabase**: Salvar pedidos no banco
2. **Email**: Enviar confirmação de pagamento
3. **WhatsApp**: Notificar cliente
4. **Dashboard**: Painel de pedidos para admin
5. **Estoque**: Atualizar automaticamente após pagamento

## 🆘 Precisa de Ajuda?

- [Documentação EFI](https://dev.efipay.com.br/docs)
- [Sandbox EFI](https://dev.efipay.com.br/docs/api-pix/testando)
- [Suporte EFI](https://sejaefi.com.br/suporte)

---

**Dica**: Comece testando em SANDBOX antes de ir para produção! 🚀
