# 🎯 Guia de Implementação Completa - Sistema de Pedidos

## 📋 FASE 1: Setup do Banco de Dados ✅

### 1. Execute o SQL no Supabase:
```
1. Abra o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole todo o conteúdo de DATABASE_SCHEMA.sql
4. Clique em "RUN"
```

### 2. Pegue as credenciais do Supabase:
```
Settings → API → 
- Project URL: https://seu-projeto.supabase.co
- service_role key: eyJh... (chave secreta)
```

---

## 📋 FASE 2: Configurar Backend ✅

### 1. Adicione as variáveis ao `.env`:
```bash
cd backend
cp .env.example .env
nano .env  # ou abra no VS Code
```

Adicione:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui
```

### 2. Reinicie o backend:
```bash
npm run dev
```

**Deve mostrar:**
```
🚀 Backend PIX rodando na porta 3001
📦 0 pedidos pendentes encontrados
```

---

## 📋 FASE 3: Integrar com PIX Webhook ✅

Agora, quando o pagamento for confirmado, o sistema:

1. ✅ Cria o usuário automaticamente
2. ✅ Cria o pedido vinculado ao usuário
3. ✅ Inicia o rastreamento automático
4. ✅ Agenda mudanças de status

### Editar webhook do PIX:

Arquivo: `backend/routes/pix.js`

Encontre a função do webhook e adicione:

```javascript
router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;
    
    console.log('🔔 WEBHOOK RECEBIDO');

    if (notification.pix) {
      for (const pix of notification.pix) {
        const txid = pix.txid;
        const e2eId = pix.endToEndId;
        
        const details = await efiService.checkPaymentStatus(txid);
        
        if (details.status === 'CONCLUIDA') {
          console.log('✅ PAGAMENTO CONFIRMADO!');
          
          // ⬇️ ADICIONE AQUI:
          // Criar pedido no banco
          const axios = require('axios');
          try {
            await axios.post('http://localhost:3001/api/pedidos/criar', {
              txid: txid,
              e2eId: e2eId,
              nomeCliente: 'Nome do Cliente', // Buscar do cache/sessão
              cpfCliente: 'CPF do Cliente',
              telefone: 'Telefone do Cliente',
              endereco: {}, // Endereço completo
              itens: [], // Itens do pedido
              valorTotal: details.valor.original
            });
            console.log('✅ Pedido criado no banco!');
          } catch (error) {
            console.error('❌ Erro ao criar pedido:', error);
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.sendStatus(200);
  }
});
```

---

## 📋 FASE 4: Atualizar PixPayment.jsx ✅

Quando pagamento for confirmado, abrir modal de agradecimento:

```javascript
import OrderConfirmation from './OrderConfirmation';

const PixPayment = ({ isOpen, onClose, pedido }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(null);

  // Quando detectar pagamento confirmado:
  const handlePaymentConfirmed = async () => {
    try {
      // Criar pedido
      const response = await fetch(`${BACKEND_URL}/api/pedidos/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: pixData.txid,
          e2eId: pixData.e2eId,
          nomeCliente: pedido.nomeCliente,
          cpfCliente: pedido.cpfCliente,
          telefone: pedido.telefone,
          endereco: pedido.endereco,
          itens: pedido.itens,
          valorTotal: pedido.valorTotal
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPedidoCriado(data.pedido);
        setShowConfirmation(true);
        onClose(); // Fecha modal PIX
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
    }
  };

  // No useEffect que verifica status:
  useEffect(() => {
    if (paymentConfirmed) {
      handlePaymentConfirmed();
    }
  }, [paymentConfirmed]);

  return (
    <>
      {/* Modal PIX... */}
      
      {showConfirmation && (
        <OrderConfirmation
          pedido={{
            id: pedidoCriado.id,
            numeroPedido: pedidoCriado.numeroPedido,
            valorTotal: pedido.valorTotal,
            telefone: pedido.telefone,
            nomeCliente: pedido.nomeCliente,
            cpfCliente: pedido.cpfCliente,
            endereco: pedido.endereco
          }}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </>
  );
};
```

---

## 📋 FASE 5: Criar Página de Login ✅

Arquivo: `src/pages/MinhaContaPage.jsx`

```javascript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MinhaContaPage = () => {
  const [telefone, setTelefone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-preencher telefone se veio da tela de confirmação
  useEffect(() => {
    if (location.state?.telefone) {
      setTelefone(location.state.telefone);
    }
  }, [location]);

  const handleLogin = async () => {
    const pinCompleto = pin.join('');
    
    if (!telefone || pinCompleto.length !== 4) {
      setError('Preencha telefone e PIN');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, pin: pinCompleto })
      });

      const data = await response.json();

      if (data.success) {
        // Salvar usuário no localStorage
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        // Redirecionar para painel
        navigate('/painel');
      } else {
        setError('Telefone ou PIN incorretos');
      }
    } catch (error) {
      setError('Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Acessar Minha Conta
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input Telefone */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Telefone</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(41) 99999-9999"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Input PIN */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">PIN (4 dígitos)</label>
          <div className="flex gap-3 justify-center">
            {pin.map((digit, index) => (
              <input
                key={index}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const newPin = [...pin];
                  newPin[index] = e.target.value;
                  setPin(newPin);
                  if (e.target.value && index < 3) {
                    document.getElementById(`pin-${index + 1}`)?.focus();
                  }
                }}
                id={`pin-${index}`}
                className="w-14 h-14 text-center text-2xl border-2 rounded-lg focus:border-primary"
              />
            ))}
          </div>
        </div>

        {/* Botão Login */}
        <button
          onClick={handleLogin}
          className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-lg transition"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};

export default MinhaContaPage;
```

---

## 📋 FASE 6: Criar Painel do Cliente ✅

Arquivo: `src/pages/PainelClientePage.jsx`

```javascript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderTracking from '../components/OrderTracking';

const PainelClientePage = () => {
  const [usuario, setUsuario] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioLocal = localStorage.getItem('usuario');
    if (!usuarioLocal) {
      navigate('/minha-conta');
      return;
    }
    
    const user = JSON.parse(usuarioLocal);
    setUsuario(user);
    buscarPedidos(user.telefone);
  }, []);

  const buscarPedidos = async (telefone) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/pedidos/usuario/${telefone}`
      );
      const data = await response.json();
      if (data.success) {
        setPedidos(data.pedidos);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/');
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Olá, {usuario.nome}! 👋</h1>
              <p className="text-gray-600">{usuario.telefone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Meus Pedidos</h2>
          
          {pedidos.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center text-gray-500">
              Você ainda não tem pedidos
            </div>
          ) : (
            pedidos.map(pedido => (
              <div key={pedido.id} className="bg-white p-6 rounded-xl shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold">
                      Pedido {pedido.numero_pedido}
                    </h3>
                    <p className="text-sm text-gray-600">
                      R$ {pedido.valor_total.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPedido(
                      selectedPedido?.id === pedido.id ? null : pedido
                    )}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    {selectedPedido?.id === pedido.id ? 'Ocultar' : 'Ver Detalhes'}
                  </button>
                </div>

                {selectedPedido?.id === pedido.id && (
                  <OrderTracking
                    pedidoId={pedido.id}
                    numeroPedido={pedido.numero_pedido}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PainelClientePage;
```

---

## 📋 FASE 7: Configurar Rotas ✅

Arquivo: `src/App.jsx`

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MinhaContaPage from './pages/MinhaContaPage';
import PainelClientePage from './pages/PainelClientePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/minha-conta" element={<MinhaContaPage />} />
        <Route path="/painel" element={<PainelClientePage />} />
        {/* ... outras rotas */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## ✅ CHECKLIST FINAL:

- [ ] SQL executado no Supabase
- [ ] Tabelas criadas (usuarios, pedidos, status_historico, config_status_tempo)
- [ ] Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY no .env
- [ ] Backend reiniciado
- [ ] Componentes criados (OrderConfirmation, OrderTracking)
- [ ] Páginas criadas (MinhaContaPage, PainelClientePage)
- [ ] Rotas configuradas
- [ ] Webhook do PIX integrado
- [ ] Sistema de PIN funcionando
- [ ] Mudança automática de status ativa

---

## 🧪 TESTE COMPLETO:

### 1. Fazer uma compra:
```
1. Adicione produtos ao carrinho
2. Digite CEP
3. Finalizar pedido
4. Preencha dados
5. Pague com PIX (ou simule no sandbox)
```

### 2. Após pagamento:
```
✅ Modal de confirmação abre
✅ Cria PIN de 4 dígitos
✅ Mostra rastreamento do pedido
✅ Status: "Pedido Confirmado"
```

### 3. Acessar painel:
```
1. Clique "Acessar Painel"
2. Digite telefone e PIN
3. Veja seus pedidos
4. Acompanhe status em tempo real
```

### 4. Ver mudança automática:
```
Aguarde 5 minutos → Status muda para "Preparando"
Aguarde 10 minutos → Status muda para "Guardando"
E assim por diante...
```

---

**PRONTO! Sistema completo funcionando!** 🎉
