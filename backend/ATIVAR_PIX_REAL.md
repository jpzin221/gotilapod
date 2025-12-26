# 🔥 Ativar PIX REAL com EFI Bank

## ✅ SDK Instalado!

O SDK `gn-api-sdk-node` já está instalado e o código atualizado!

## 📋 Checklist Rápido

### 1. ✅ Certificado (.p12)

Coloque o arquivo `.p12` que você baixou da EFI em:
```
backend/certs/certificado-efi.p12
```

Se a pasta `certs` não existir:
```bash
cd backend
mkdir certs
```

### 2. ✅ Verificar .env

Seu `.env` deve ter:
```env
EFI_CLIENT_ID=seu_client_id_aqui
EFI_CLIENT_SECRET=seu_client_secret_aqui
EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
EFI_SANDBOX=true
EFI_PIX_KEY=sua-chave-pix@email.com
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**IMPORTANTE**: 
- `EFI_PIX_KEY` deve ser uma chave PIX cadastrada na sua conta EFI
- `EFI_SANDBOX=true` para testes
- `EFI_SANDBOX=false` para produção

### 3. 🚀 Reiniciar Servidor

Se o servidor ainda está rodando, pare com `Ctrl+C` e rode novamente:

```bash
npm start
```

## 📊 Como Saber se Está Funcionando

### Modo REAL Ativado:
```
✅ EfiService inicializado com SDK REAL
📍 Modo: SANDBOX
🚀 Backend PIX rodando na porta 3001
```

### Ainda em Modo Demo:
```
⚠️  AVISO: Certificado EFI não encontrado
⚠️  Baixe o certificado .p12 da EFI
```

## 🧪 Testar PIX Real

### 1. Criar Cobrança de Teste

```bash
curl -X POST http://localhost:3001/api/pix/create-charge \
  -H "Content-Type: application/json" \
  -d '{
    "valorTotal": 0.01,
    "nomeCliente": "Teste Cliente",
    "cpfCliente": "12345678900",
    "itens": [
      {"nome": "Teste", "quantidade": 1, "preco": 0.01}
    ],
    "pedidoId": "TEST123"
  }'
```

### 2. Resposta Esperada (Sucesso):

```json
{
  "success": true,
  "txid": "ABC123XYZ789...",
  "qrcode": "00020126...",  // ← Código PIX REAL!
  "imagemQrcode": "iVBORw0...", // ← QR Code REAL em base64
  "pixCopiaECola": "00020126..."
}
```

### 3. Se Der Erro:

#### Erro: Certificado Inválido
```
❌ Erro ao inicializar EfiService: Certificate error
```
**Solução**: Verifique se o arquivo `.p12` está correto

#### Erro: Credenciais Inválidas
```
❌ Erro: invalid_client
```
**Solução**: Verifique `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET`

#### Erro: Chave PIX Inválida
```
❌ Erro: Chave Pix não encontrada
```
**Solução**: Cadastre a chave PIX no painel da EFI

## 🎨 Integrar com Frontend

O componente `PixPayment.jsx` já está pronto! Quando o backend estiver em modo REAL, os QR Codes gerados serão verdadeiros e funcionais!

```javascript
// O código do frontend não muda!
// Ele só passa a receber QR Codes reais
<PixPayment
  isOpen={showPix}
  onClose={() => setShowPix(false)}
  pedido={pedidoData}
/>
```

## 🔧 Sandbox vs Produção

### Sandbox (Testes)
```env
EFI_SANDBOX=true
```
- QR Codes funcionam
- Pagamentos são simulados
- Não movimenta dinheiro real
- Ideal para desenvolvimento

### Produção (Real)
```env
EFI_SANDBOX=false
```
- QR Codes reais
- Pagamentos processados
- **Movimenta dinheiro real** 💰
- Use apenas quando tudo estiver testado!

## 📱 Testar Pagamento no Sandbox

1. Gere uma cobrança PIX (sandbox)
2. Use o app da EFI ou simulador
3. "Pague" o QR Code
4. Webhook será chamado
5. Verifique status: `GET /api/pix/status/:txid`

## ⚠️ Problemas Comuns

### 1. Certificado não encontrado
- Verifique caminho em `EFI_CERTIFICATE_PATH`
- Certifique-se que `.p12` está em `backend/certs/`

### 2. Credenciais inválidas
- Verifique Client ID e Secret no painel EFI
- Certifique-se de usar credenciais corretas (sandbox ou produção)

### 3. Chave PIX inválida
- Cadastre chave PIX no painel EFI
- Use mesma chave no `.env` (`EFI_PIX_KEY`)

### 4. Webhook não funciona
- Em desenvolvimento: use ngrok
- Configure webhook no painel EFI
- URL deve ser pública e HTTPS

## 🎯 Próximos Passos

1. ✅ Colocar certificado em `certs/`
2. ✅ Reiniciar servidor
3. ✅ Testar criação de cobrança
4. ✅ Verificar QR Code gerado
5. ✅ Testar pagamento no sandbox
6. ✅ Configurar webhook
7. ✅ Integrar com frontend
8. ✅ Testar fluxo completo
9. ⚠️ Produção (quando pronto)

## 📚 Links Úteis

- [Painel EFI Bank](https://sistema.sejaefi.com.br/)
- [Documentação API PIX](https://dev.efipay.com.br/docs/api-pix)
- [Sandbox/Testes](https://dev.efipay.com.br/docs/api-pix/testando)

---

**🚀 Após seguir estes passos, seu sistema PIX estará 100% funcional!**
