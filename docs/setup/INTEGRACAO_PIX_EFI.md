# 🏦 Integração PIX com EFI Bank (Gerencianet)

## 📋 Visão Geral

Para aceitar pagamentos PIX, precisamos:
1. **Backend** (Node.js) - Processa pagamentos e recebe webhooks
2. **Frontend** (React) - Mostra QR Code para o cliente
3. **Credenciais EFI** - Client ID, Client Secret e Certificado

## 🎯 Fluxo de Pagamento

```
1. Cliente clica em "Finalizar Compra"
   ↓
2. Frontend envia pedido para seu backend
   ↓
3. Backend cria cobrança PIX na EFI
   ↓
4. EFI retorna QR Code e txid
   ↓
5. Frontend mostra QR Code para cliente
   ↓
6. Cliente paga com app do banco
   ↓
7. EFI envia webhook para seu backend
   ↓
8. Backend confirma pagamento e atualiza pedido
   ↓
9. Cliente recebe confirmação
```

## 🔐 Passo 1: Obter Credenciais da EFI Bank

### 1.1 Criar Conta
1. Acesse: https://sejaefi.com.br/
2. Crie uma conta de **Desenvolvedor**
3. Ative o **PIX** na sua conta

### 1.2 Obter Credenciais
1. Faça login em: https://sistema.sejaefi.com.br/
2. Vá em **API** → **Minhas Aplicações**
3. Copie:
   - **Client ID** (Ex: `Client_Id_abc123`)
   - **Client Secret** (Ex: `Client_Secret_xyz789`)

### 1.3 Baixar Certificado
1. Vá em **API** → **Meus Certificados**
2. Baixe o certificado `.p12`
3. Salve como `certificado-efi.p12`

## 📁 Estrutura do Projeto

```
Loja/
├── backend/                    ← NOVO (servidor Node.js)
│   ├── .env                   ← Credenciais EFI
│   ├── package.json
│   ├── server.js              ← Servidor Express
│   ├── routes/
│   │   └── pix.js             ← Rotas PIX
│   ├── services/
│   │   └── efiService.js      ← Integração EFI
│   ├── webhooks/
│   │   └── pixWebhook.js      ← Recebe notificações
│   └── certs/
│       └── certificado-efi.p12 ← Certificado
├── src/                       ← Frontend React
│   └── components/
│       └── PixPayment.jsx     ← Componente QR Code
└── ...
```

## 🛠️ Passo 2: Criar Backend

### 2.1 Criar Pasta Backend
```bash
mkdir backend
cd backend
npm init -y
```

### 2.2 Instalar Dependências
```bash
npm install express cors dotenv sdk-node-apis-efi body-parser
```

### 2.3 Criar `.env`
```env
# Credenciais EFI Bank
EFI_CLIENT_ID=Client_Id_abc123
EFI_CLIENT_SECRET=Client_Secret_xyz789
EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
EFI_SANDBOX=true

# Servidor
PORT=3001
FRONTEND_URL=http://localhost:3000

# Webhook (será sua URL pública)
WEBHOOK_URL=https://seu-dominio.com/webhook/pix
```

### 2.4 Criar `server.js`
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pixRoutes = require('./routes/pix');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());

// Rotas
app.use('/api/pix', pixRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
```

## 💳 Passo 3: Implementar Serviço PIX

### 3.1 Criar `services/efiService.js`
```javascript
const EfiPay = require('sdk-node-apis-efi');
const path = require('path');

const options = {
  client_id: process.env.EFI_CLIENT_ID,
  client_secret: process.env.EFI_CLIENT_SECRET,
  certificate: path.resolve(process.env.EFI_CERTIFICATE_PATH),
  sandbox: process.env.EFI_SANDBOX === 'true'
};

class EfiService {
  constructor() {
    this.efi = new EfiPay(options);
  }

  async createPixCharge(valorTotal, nomeCliente, cpfCliente, itens) {
    const body = {
      calendario: {
        expiracao: 3600 // 1 hora para pagar
      },
      devedor: {
        cpf: cpfCliente.replace(/\D/g, ''),
        nome: nomeCliente
      },
      valor: {
        original: valorTotal.toFixed(2)
      },
      chave: 'sua-chave-pix@email.com', // SUA CHAVE PIX CADASTRADA NA EFI
      solicitacaoPagador: 'Pagamento - POD EXPRESSS',
      infoAdicionais: [
        {
          nome: 'Itens',
          valor: `${itens.length} produto(s)`
        }
      ]
    };

    try {
      const response = await this.efi.pixCreateImmediateCharge([], body);
      const txid = response.txid;

      // Gerar QR Code
      const qrCodeResponse = await this.efi.pixGenerateQRCode({
        id: response.loc.id
      });

      return {
        txid,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        pixCopiaECola: qrCodeResponse.qrcode
      };
    } catch (error) {
      console.error('Erro ao criar cobrança PIX:', error);
      throw error;
    }
  }

  async checkPaymentStatus(txid) {
    try {
      const response = await this.efi.pixDetailCharge({ txid });
      return response;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  }
}

module.exports = new EfiService();
```

## 🛣️ Passo 4: Criar Rotas

### 4.1 Criar `routes/pix.js`
```javascript
const express = require('express');
const router = express.Router();
const efiService = require('../services/efiService');

// Criar cobrança PIX
router.post('/create-charge', async (req, res) => {
  try {
    const { valorTotal, nomeCliente, cpfCliente, itens, pedidoId } = req.body;

    // Validação
    if (!valorTotal || !nomeCliente || !cpfCliente || !itens) {
      return res.status(400).json({
        error: 'Dados incompletos'
      });
    }

    // Criar cobrança na EFI
    const pixData = await efiService.createPixCharge(
      valorTotal,
      nomeCliente,
      cpfCliente,
      itens
    );

    // Salvar no banco de dados (Supabase)
    // TODO: Implementar salvamento do pedido

    res.json({
      success: true,
      txid: pixData.txid,
      qrcode: pixData.qrcode,
      imagemQrcode: pixData.imagemQrcode,
      pixCopiaECola: pixData.pixCopiaECola
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      error: 'Erro ao criar cobrança PIX'
    });
  }
});

// Verificar status do pagamento
router.get('/status/:txid', async (req, res) => {
  try {
    const { txid } = req.params;
    const status = await efiService.checkPaymentStatus(txid);
    
    res.json({
      success: true,
      status: status.status,
      valor: status.valor
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      error: 'Erro ao verificar status'
    });
  }
});

// Webhook - Recebe notificações da EFI
router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;
    console.log('Webhook recebido:', notification);

    // PIX recebido
    if (notification.pix) {
      notification.pix.forEach(async (pix) => {
        const txid = pix.txid;
        
        // Verificar detalhes do pagamento
        const details = await efiService.checkPaymentStatus(txid);
        
        if (details.status === 'CONCLUIDA') {
          console.log(`✅ Pagamento confirmado: ${txid}`);
          // TODO: Atualizar pedido no banco de dados
          // TODO: Enviar email de confirmação
          // TODO: Notificar cliente
        }
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
```

## 🎨 Passo 5: Componente Frontend

### 5.1 Criar `src/components/PixPayment.jsx`
```javascript
import { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle, Clock, X } from 'lucide-react';

export default function PixPayment({ isOpen, onClose, pedido }) {
  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    if (isOpen && pedido) {
      createPixCharge();
    }
  }, [isOpen, pedido]);

  const createPixCharge = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/pix/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valorTotal: pedido.valorTotal,
          nomeCliente: pedido.nomeCliente,
          cpfCliente: pedido.cpfCliente,
          itens: pedido.itens,
          pedidoId: pedido.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPixData(data);
        startPaymentCheck(data.txid);
      }
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      alert('Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentCheck = (txid) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/pix/status/${txid}`);
        const data = await response.json();
        
        if (data.status === 'CONCLUIDA') {
          setPaymentStatus('paid');
          clearInterval(interval);
          setTimeout(() => {
            onClose();
            // Redirecionar ou mostrar confirmação
          }, 3000);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(interval);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixData.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Gerando QR Code PIX...</p>
          </div>
        ) : paymentStatus === 'paid' ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-gray-600">
              Seu pedido foi aprovado com sucesso
            </p>
          </div>
        ) : pixData ? (
          <div>
            <div className="text-center mb-6">
              <QrCode className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-800">
                Pague com PIX
              </h3>
              <p className="text-gray-600 mt-1">
                R$ {pedido.valorTotal.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
              <img
                src={`data:image/png;base64,${pixData.imagemQrcode}`}
                alt="QR Code PIX"
                className="w-full max-w-xs mx-auto"
              />
            </div>

            {/* PIX Copia e Cola */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIX Copia e Cola
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pixData.pixCopiaECola}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Como pagar:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            <p className="text-xs text-center text-gray-500">
              ⏱️ Aguardando pagamento... (expira em 1 hora)
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

## 🚀 Passo 6: Usar no Frontend

### 6.1 Integrar no Carrinho
```javascript
// Em Cart.jsx ou CheckoutPage.jsx
import { useState } from 'react';
import PixPayment from './PixPayment';

function Cart() {
  const [showPix, setShowPix] = useState(false);
  const [pedidoData, setPedidoData] = useState(null);

  const handleFinalizarCompra = () => {
    const pedido = {
      id: Date.now(),
      valorTotal: calcularTotal(),
      nomeCliente: 'João Silva', // Pegar do formulário
      cpfCliente: '12345678900', // Pegar do formulário
      itens: cartItems
    };

    setPedidoData(pedido);
    setShowPix(true);
  };

  return (
    <>
      {/* Seu carrinho */}
      <button onClick={handleFinalizarCompra}>
        Finalizar Compra com PIX
      </button>

      {/* Modal PIX */}
      <PixPayment
        isOpen={showPix}
        onClose={() => setShowPix(false)}
        pedido={pedidoData}
      />
    </>
  );
}
```

## 📝 Checklist de Implementação

- [ ] Criar conta na EFI Bank
- [ ] Obter credenciais (Client ID, Secret)
- [ ] Baixar certificado .p12
- [ ] Cadastrar chave PIX na EFI
- [ ] Criar pasta `backend/`
- [ ] Instalar dependências
- [ ] Configurar `.env`
- [ ] Implementar `efiService.js`
- [ ] Criar rotas PIX
- [ ] Criar componente PixPayment
- [ ] Testar em sandbox
- [ ] Configurar webhook público
- [ ] Testar pagamento real

## 🌐 Deploy do Backend

### Opção 1: Heroku
```bash
heroku create seu-app-backend
git subtree push --prefix backend heroku main
```

### Opção 2: Railway
1. Conecte repositório
2. Configure variáveis de ambiente
3. Deploy automático

## 📚 Recursos

- [Documentação EFI Bank](https://dev.efipay.com.br/docs)
- [SDK Node.js EFI](https://github.com/efipay/sdk-node-apis-efi)
- [Exemplos PIX](https://dev.efipay.com.br/docs/api-pix)

---

**Próximo passo**: Vou criar os arquivos do backend para você começar! 🚀
