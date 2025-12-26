import { useState, useEffect } from 'react';
import { CheckCircle, Package, Truck, MapPin, Clock, Phone, Lock } from 'lucide-react';
import Portal from './Portal';
import OrderTracking from './OrderTracking';
import { useNavigate } from 'react-router-dom';

const OrderConfirmation = ({ pedido, onClose }) => {
  const navigate = useNavigate();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState('pin'); // pin, confirm, success
  const [error, setError] = useState('');

  useEffect(() => {
    // Limpar sessão PIX do localStorage (pagamento concluído)
    localStorage.removeItem('pixPaymentSession');
    console.log('🗑️ Sessão PIX limpa - Pedido confirmado');
    
    // Verificar se o usuário já tem PIN cadastrado
    const checkUserPin = async () => {
      const hasPin = localStorage.getItem(`user_pin_${pedido.telefone}`);
      if (!hasPin) {
        setShowPinSetup(true);
      }
    };
    checkUserPin();
  }, [pedido.telefone]);

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

  const handleAlterarNumero = () => {
    // TODO: Implementar modal de alteração de número
    alert('Funcionalidade em desenvolvimento');
  };

  if (showPinSetup) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
        <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8">
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
      </Portal>
    );
  }

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 999999 }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 sm:p-8 rounded-t-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            Compra Confirmada!
          </h2>
          <p className="text-center text-green-100">
            Pedido {pedido.numeroPedido} • R$ {pedido.valorTotal.toFixed(2)}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {/* Rastreamento */}
          <OrderTracking pedidoId={pedido.id} numeroPedido={pedido.numeroPedido} />

          {/* Acesso ao Painel */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Acompanhe seu pedido
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Para acessar o painel de entrega, use seu número de telefone que foi usado para efetuar esta compra:
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
                  <p className="text-center text-2xl font-bold text-primary">
                    {pedido.telefone}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAccessPanel}
                    className="flex-1 bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Acessar Painel
                  </button>
                  <button
                    onClick={handleAlterarNumero}
                    className="px-4 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition font-semibold"
                  >
                    Alterar Número
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Pedido */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço de Entrega
            </h4>
            <p className="text-gray-700 text-sm">
              {pedido.endereco.endereco}, {pedido.endereco.numero}
              {pedido.endereco.complemento && `, ${pedido.endereco.complemento}`}
              <br />
              {pedido.endereco.bairro} - {pedido.endereco.cidade}/{pedido.endereco.estado}
              <br />
              CEP: {pedido.endereco.cep}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
      </div>
    </Portal>
  );
};

export default OrderConfirmation;
