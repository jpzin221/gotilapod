# 🚀 Como Usar o Backend PIX (Modo Demo)

## ✅ Backend Instalado e Funcionando!

O servidor está rodando em **modo DEMO** porque o SDK da EFI requer:
1. Conta na EFI Bank
2. Credenciais (Client ID e Secret)
3. Certificado .p12

Por enquanto, o backend retorna **dados mockados** para você testar tudo!

## 🎮 Como Testar Agora

### 1. Verificar se Servidor Está Rodando

Abra o navegador: http://localhost:3001/health

Deve retornar:
```json
{
  "status": "ok",
  "message": "Backend PIX rodando",
  "timestamp": "2025-11-02T23:40:00.000Z"
}
```

### 2. Testar Criação de Cobrança PIX

Use um cliente HTTP (Postman, Insomnia, ou cURL):

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

Resposta (DEMO):
```json
{
  "success": true,
  "txid": "DEMO1730582400000",
  "qrcode": "00020126580014br.gov.bcb.pix0136DEMO-QR-CODE-STRING-12345",
  "imagemQrcode": "iVBORw0KG...",
  "pixCopiaECola": "00020126580014br.gov.bcb.pix0136DEMO-QR-CODE-STRING-12345",
  "message": "Cobrança PIX criada com sucesso"
}
```

### 3. Testar Verificação de Status

```bash
curl http://localhost:3001/api/pix/status/DEMO1730582400000
```

Resposta:
```json
{
  "success": true,
  "txid": "DEMO1730582400000",
  "status": "ATIVA",
  "valor": { "original": "85.00" },
  "horario": "2025-11-02T23:40:00.000Z",
  "pix": []
}
```

## 🎨 Integrar com Frontend

O componente `PixPayment.jsx` já está pronto! Basta usar:

```javascript
import PixPayment from './components/PixPayment';

function Checkout() {
  const [showPix, setShowPix] = useState(false);
  const [pedido, setPedido] = useState(null);

  const handleComprar = () => {
    setPedido({
      id: Date.now(),
      valorTotal: 85.00,
      nomeCliente: 'João Silva',
      cpfCliente: '12345678900',
      itens: [
        { nome: 'POD GEEK 40K', quantidade: 1, preco: 85.00 }
      ]
    });
    setShowPix(true);
  };

  return (
    <>
      <button onClick={handleComprar}>
        Pagar com PIX 💰
      </button>

      <PixPayment
        isOpen={showPix}
        onClose={() => setShowPix(false)}
        pedido={pedido}
      />
    </>
  );
}
```

## 📝 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do servidor |
| GET | `/` | Info sobre a API |
| POST | `/api/pix/create-charge` | Criar cobrança PIX |
| GET | `/api/pix/status/:txid` | Verificar pagamento |
| POST | `/api/pix/webhook` | Receber notificações |

## 🔧 Próximos Passos (Quando Tiver Credenciais EFI)

1. **Criar Conta EFI Bank**
   - Acesse: https://sejaefi.com.br/
   - Crie conta de desenvolvedor
   - Ative PIX

2. **Obter Credenciais**
   - Login: https://sistema.sejaefi.com.br/
   - API → Minhas Aplicações
   - Copiar Client ID e Client Secret

3. **Baixar Certificado**
   - API → Meus Certificados
   - Baixar arquivo .p12
   - Salvar em `backend/certs/certificado-efi.p12`

4. **Instalar SDK Real**
   ```bash
   npm install gn-api-sdk-node
   ```

5. **Atualizar `.env`**
   ```env
   EFI_CLIENT_ID=seu_client_id_real
   EFI_CLIENT_SECRET=seu_secret_real
   EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
   EFI_SANDBOX=true
   EFI_PIX_KEY=sua-chave-pix@email.com
   ```

6. **Descomentar Código Real**
   - Abrir `backend/services/efiService.js`
   - Substituir código mockado pelo código real comentado

## ⚠️ Modo DEMO vs Modo REAL

### Modo DEMO (Atual)
- ✅ Testa toda a interface
- ✅ Vê QR Code (mockado)
- ✅ Testa fluxo completo
- ❌ Não processa pagamento real
- ❌ Status sempre "ATIVA"

### Modo REAL (Com EFI)
- ✅ Gera QR Code verdadeiro
- ✅ Cliente pode pagar de verdade
- ✅ Recebe confirmação automática
- ✅ Status real do pagamento
- ✅ Produção completa

## 🛠️ Comandos Úteis

```bash
# Rodar servidor
npm start

# Rodar em desenvolvimento (auto-reload)
npm run dev

# Parar servidor
Ctrl + C

# Ver logs
# (logs aparecem no terminal)
```

## 🆘 Troubleshooting

### Porta 3001 já em uso
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou mude a porta no .env
PORT=3002
```

### CORS Error
Verifique se `FRONTEND_URL` no `.env` está correto:
```env
FRONTEND_URL=http://localhost:3000
```

### Módulo não encontrado
```bash
# Reinstalar dependências
rm -rf node_modules
npm install
```

## 📚 Documentação Completa

- `INTEGRACAO_PIX_EFI.md` - Guia completo de integração
- `INICIO_RAPIDO_PIX.md` - Quick start
- `README.md` - Documentação técnica

---

**🎉 Backend rodando! Agora você pode testar a integração PIX no frontend!**
