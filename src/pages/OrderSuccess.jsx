import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Clock, Phone, Lock, Home, ArrowRight } from 'lucide-react';
import OrderTracking from '../components/OrderTracking';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState('pin'); // pin, confirm, success
  const [error, setError] = useState('');

  useEffect(() => {
    // Buscar dados do pedido da URL ou localStorage
    const pedidoId = searchParams.get('pedido');
    const savedSession = localStorage.getItem('pixPaymentSession');

    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.pedidoCriado) {
          setPedido(session.pedidoCriado);
          setLoading(false);
          
          // Verificar se usuário já tem PIN
          const hasPin = localStorage.getItem(`user_pin_${session.pedidoCriado.telefone}`);
          if (!hasPin) {
            setShowPinSetup(true);
          }
          
          // Limpar sessão PIX após carregar
          localStorage.removeItem('pixPaymentSession');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Erro ao recuperar pedido:', error);
        navigate('/');
      }
    } else if (pedidoId) {
      // TODO: Buscar pedido do backend por ID
      navigate('/');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  const handlePinInput = (index, value, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return; // Apenas números

    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value;
    
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    // Auto-focus próximo input
    if (value && index < 3) {
      const nextInput = document.getElementById(
        isConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`
      );
      nextInput?.focus();
    }

    // Verificar se completou
    if (newPin.every(digit => digit) && !isConfirm) {
      setStep('confirm');
      setTimeout(() => {
        document.getElementById('confirm-pin-0')?.focus();
      }, 100);
    }

    if (newPin.every(digit => digit) && isConfirm) {
      handleConfirmPin(newPin.join(''));
    }
  };

  const handleConfirmPin = async (confirmPinValue) => {
    const pinValue = pin.join('');
    
    if (pinValue !== confirmPinValue) {
      setError('Os PINs não coincidem. Tente novamente.');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setStep('pin');
      setTimeout(() => {
        document.getElementById('pin-0')?.focus();
      }, 100);
      return;
    }

    try {
      // Salvar PIN (em produção, fazer hash no backend)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/criar-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: pedido.telefone,
          pin: pinValue,
          nome: pedido.nomeCliente,
          cpf: pedido.cpfCliente,
          endereco: pedido.endereco
        })
      });

      if (response.ok) {
        localStorage.setItem(`user_pin_${pedido.telefone}`, 'true');
        setStep('success');
        setTimeout(() => {
          setShowPinSetup(false);
        }, 2000);
      } else {
        setError('Erro ao criar PIN. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar PIN:', error);
      setError('Erro ao criar PIN. Tente novamente.');
    }
  };

  const handleAccessPanel = () => {
    navigate('/minha-conta', { state: { telefone: pedido.telefone } });
  };

  const handleVoltar = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (showPinSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {step === 'pin' && 'Crie seu PIN'}
              {step === 'confirm' && 'Confirme seu PIN'}
              {step === 'success' && 'PIN Criado!'}
            </h2>
            <p className="text-gray-600 text-sm">
              {step === 'pin' && 'Digite 4 números para proteger sua conta'}
              {step === 'confirm' && 'Digite o PIN novamente'}
              {step === 'success' && 'Você já pode acessar sua conta!'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {step !== 'success' && (
            <div className="flex justify-center gap-4 mb-6">
              {(step === 'pin' ? pin : confirmPin).map((digit, index) => (
                <input
                  key={index}
                  id={step === 'pin' ? `pin-${index}` : `confirm-pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(index, e.target.value, step === 'confirm')}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      document.getElementById(
                        step === 'pin' ? `pin-${index - 1}` : `confirm-pin-${index - 1}`
                      )?.focus();
                    }
                  }}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          )}

          <div className="text-center text-xs text-gray-500">
            🔒 Seu PIN será usado para acessar seus pedidos
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Simplificado */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Pedido Confirmado</h1>
          <button
            onClick={handleVoltar}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar à Loja</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-8">
        {/* Card de Sucesso */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Header Verde */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              🎉 Compra Confirmada!
            </h2>
            <p className="text-green-100 text-lg mb-1">
              Pedido {pedido.numeroPedido}
            </p>
            <p className="text-2xl font-bold">
              R$ {pedido.valorTotal.toFixed(2)}
            </p>
          </div>

          {/* Rastreamento */}
          <div className="p-6">
            <OrderTracking pedidoId={pedido.id} numeroPedido={pedido.numeroPedido} />
          </div>
        </div>

        {/* Card de Acesso ao Painel */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Acompanhe seu pedido
              </h3>
              <p className="text-gray-600 mb-4">
                Use seu número de telefone para acessar o painel de entrega:
              </p>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-center text-2xl font-bold text-primary">
                  {pedido.telefone}
                </p>
              </div>

              <button
                onClick={handleAccessPanel}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Acessar Painel de Entrega
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card de Endereço */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
            <MapPin className="w-6 h-6 text-primary" />
            Endereço de Entrega
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">
              <strong>{pedido.nomeCliente}</strong>
              <br />
              {pedido.endereco.endereco}, {pedido.endereco.numero}
              {pedido.endereco.complemento && `, ${pedido.endereco.complemento}`}
              <br />
              {pedido.endereco.bairro} - {pedido.endereco.cidade}/{pedido.endereco.estado}
              <br />
              CEP: {pedido.endereco.cep}
            </p>
          </div>
        </div>

        {/* Botão Voltar */}
        <button
          onClick={handleVoltar}
          className="w-full py-4 text-gray-600 hover:text-gray-800 font-medium transition border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50"
        >
          Continuar Comprando
        </button>
      </main>

      {/* Footer Simples */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Obrigado por comprar conosco! 💜</p>
          <p className="mt-2">Em caso de dúvidas, entre em contato pelo WhatsApp</p>
        </div>
      </footer>
    </div>
  );
};

export default OrderSuccess;
