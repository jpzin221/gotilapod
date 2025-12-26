import { useState } from 'react';
import { X, Phone, Lock, User } from 'lucide-react';
import { usePhoneAuth } from '../context/PhoneAuthContext';
import Portal from './Portal';

export default function PhoneAuthModal({ isOpen, onClose, mode = 'login', onSuccess, prefilledPhone = '', prefilledName = '' }) {
  const { login, register, userExists } = usePhoneAuth();
  
  // Se não vier preenchido, buscar do sessionStorage
  const getPedidoData = () => {
    if (prefilledPhone && prefilledName) {
      return { phone: prefilledPhone, nome: prefilledName };
    }
    
    try {
      const lastPedido = sessionStorage.getItem('lastPedido');
      if (lastPedido) {
        const pedido = JSON.parse(lastPedido);
        return {
          phone: pedido.telefone || '',
          nome: pedido.nome_cliente || pedido.nomeCliente || ''
        };
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    }
    
    return { phone: '', nome: '' };
  };
  
  const pedidoData = getPedidoData();
  
  const [phone, setPhone] = useState(pedidoData.phone);
  const [pin, setPin] = useState(['', '', '', '']);
  const [nome, setNome] = useState(pedidoData.nome);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // SEMPRE vai para Step 2 no modo register (após compra)
  const [step, setStep] = useState(mode === 'register' ? 2 : 1);

  // Log para debug
  if (isOpen && mode === 'register') {
    console.log('🎯 Modal aberto com dados:');
    console.log('📱 Telefone:', phone);
    console.log('👤 Nome:', nome);
    console.log('📊 Step inicial:', step);
  }

  if (!isOpen) return null;

  const handlePinChange = (index, value) => {
    if (value.length > 1) return; // Apenas 1 dígito
    if (!/^\d*$/.test(value)) return; // Apenas números

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus no próximo input
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  // Validar telefone (Etapa 1)
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação
    if (!phone || phone.length < 10) {
      setError('Digite um telefone válido');
      setLoading(false);
      return;
    }

    try {
      // Verificar se usuário existe no banco
      const exists = await userExists(phone);

      if (mode === 'login') {
        if (!exists) {
          setError('Usuário não encontrado. Faça uma compra para criar sua conta!');
          setLoading(false);
          return;
        }
        // Usuário existe, ir para etapa do PIN
        setStep(2);
      } else {
        // Modo registro (após compra)
        setStep(2);
      }
    } catch (err) {
      setError('Erro ao verificar telefone. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Submeter PIN (Etapa 2)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const pinString = pin.join('');

    // Validações
    if (!phone || phone.length < 10) {
      setError('Digite um telefone válido');
      setLoading(false);
      return;
    }

    if (pinString.length !== 4) {
      setError('Digite um PIN de 4 dígitos');
      setLoading(false);
      return;
    }

    if (mode === 'register' && !nome) {
      setError('Digite seu nome');
      setLoading(false);
      return;
    }

    try {
      let result;
      
      if (mode === 'register') {
        console.log('📝 Registrando usuário...');
        result = await register(phone, pinString, nome);
        console.log('📊 Resultado do registro:', result);
      } else {
        console.log('🔐 Fazendo login...');
        result = await login(phone, pinString);
        console.log('📊 Resultado do login:', result);
      }

      if (result.success) {
        console.log('✅ Sucesso! Chamando onSuccess com:', result);
        onSuccess?.(result);  // ✅ CORRIGIDO: Passa o resultado!
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Erro no modal:', err);
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60" style={{ zIndex: 999999 }} onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'register' ? 'Criar Sua Senha' : 'Acessar Conta'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {mode === 'register' 
                ? (prefilledPhone 
                    ? 'Confirme seus dados e crie uma senha de 4 dígitos' 
                    : 'Crie uma senha de 4 dígitos para acessar sua conta e acompanhar seus pedidos')
                : 'Entre com seu telefone e PIN'}
            </p>
          </div>

          {/* Etapa 1: Telefone */}
          {step === 1 && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {/* Nome (apenas no registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="(00) 00000-0000"
                  maxLength="11"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-red-700 font-semibold">{error}</p>
                </div>
              )}

              {/* Botão Continuar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Verificando...' : '→ Continuar'}
              </button>
            </form>
          )}

          {/* Etapa 2: PIN */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mostrar nome (se tiver) */}
              {nome && mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-700 font-semibold">
                    {nome}
                  </div>
                </div>
              )}

              {/* Mostrar telefone (readonly) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <div className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-700 font-semibold">
                  {phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  ← Alterar dados
                </button>
              </div>

              {/* PIN */}
              <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                PIN de 4 dígitos
              </label>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    id={`pin-${index}`}
                    type="password"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {mode === 'register' 
                  ? '🔐 Este PIN será sua senha para acessar o site e acompanhar seus pedidos' 
                  : 'Digite seu PIN de acesso'}
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-center">
                <p className="text-sm text-red-700 font-semibold">{error}</p>
              </div>
            )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Processando...' : mode === 'register' ? '✓ Criar Conta' : '🔓 Entrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Portal>
  );
}
