import { useState, useEffect } from 'react';
import { User, MapPin, Shield, Lock, CheckCircle, ChevronRight, Truck } from 'lucide-react';
import { usePhoneAuth } from '../context/PhoneAuthContext';

const CHECKOUT_DATA_KEY = 'gorila_checkout_data';

export default function CheckoutForm({ isOpen, onClose, onSubmit, total, cepData }) {
  const { user, isAuthenticated } = usePhoneAuth();

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'PR'
  });

  const [currentStep, setCurrentStep] = useState(1);

  // Restaurar dados salvos ao abrir
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(CHECKOUT_DATA_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...data }));
        } catch (e) {}
      }
    }
  }, [isOpen]);

  // Salvar dados pessoais no localStorage quando mudarem
  useEffect(() => {
    if (formData.nome || formData.cpf || formData.telefone) {
      const personalData = {
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        numero: formData.numero,
        complemento: formData.complemento
      };
      localStorage.setItem(CHECKOUT_DATA_KEY, JSON.stringify(personalData));
    }
  }, [formData.nome, formData.cpf, formData.telefone, formData.numero, formData.complemento]);

  useEffect(() => {
    if (isAuthenticated && user && isOpen) {
      setFormData(prev => ({
        ...prev,
        nome: user.nome || prev.nome,
        telefone: user.telefone || prev.telefone,
        cpf: user.cpf || prev.cpf,
      }));
    }
  }, [isAuthenticated, user, isOpen]);

  useEffect(() => {
    if (cepData && isOpen) {
      setFormData(prev => ({
        ...prev,
        cep: cepData.cep || '',
        endereco: cepData.logradouro || '',
        bairro: cepData.bairro || '',
        cidade: cepData.localidade || '',
        estado: cepData.uf || 'PR'
      }));
    }
  }, [cepData, isOpen]);

  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    const hasData = Object.values(formData).some(value => value.trim() !== '' && value !== 'PR');
    if (hasData) {
      const confirmClose = window.confirm(
        'Você tem dados preenchidos. Deseja realmente sair e perder essas informações?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'telefone') formattedValue = formatPhone(value);
    if (name === 'cep') formattedValue = formatCEP(value);
    setFormData({ ...formData, [name]: formattedValue });

    // Rastrear carrinho quando usuario preencher telefone (step 1)
    if (name === 'telefone' && formattedValue.length >= 15) {
      trackAbandonedCart(formattedValue, formData.nome);
    }
  };

  const trackAbandonedCart = async (phone, name) => {
    try {
      const cartData = localStorage.getItem('cart');
      const cartItems = cartData ? JSON.parse(cartData) : [];
      const cartTotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || (item.price * item.quantity)), 0);
      const sessionId = localStorage.getItem('cart_session_id') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);

      await fetch('/api/abandoned-carts/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track',
          session_id: sessionId,
          phone: phone.replace(/\D/g, ''),
          customer_name: name || null,
          cart_items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          cart_total: cartTotal
        })
      });
    } catch (error) {
      console.warn('Erro ao rastrear carrinho:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isStep1Valid = formData.nome.trim() && formData.cpf.length >= 14 && formData.telefone.length >= 15;
  const isStep2Valid = formData.cep && formData.endereco && formData.numero && formData.bairro && formData.cidade && formData.estado;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com valor e close */}
          <div className="bg-gradient-to-r from-primary via-primary to-secondary px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Finalizar Pedido</h2>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Compra 100% segura
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition backdrop-blur-sm"
            >
              <span className="text-white text-lg leading-none">&times;</span>
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 1 ? 'bg-primary text-white' : isStep1Valid ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {isStep1Valid ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <span className={`text-xs font-medium ${currentStep === 1 ? 'text-primary' : isStep1Valid ? 'text-green-600' : 'text-gray-500'}`}>
                  Dados Pessoais
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 2 ? 'bg-primary text-white' : isStep2Valid ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {isStep2Valid ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <span className={`text-xs font-medium ${currentStep === 2 ? 'text-primary' : isStep2Valid ? 'text-green-600' : 'text-gray-500'}`}>
                  Endereço
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
                <span className={`text-xs font-medium ${currentStep === 3 ? 'text-primary' : 'text-gray-500'}`}>
                  Pagar
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            {/* STEP 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Seus Dados</h3>
                    <p className="text-[10px] text-gray-500">Para identificar seu pedido</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                    placeholder="Como no seu documento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!isStep1Valid}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                >
                  Continuar para Endereço
                  <ChevronRight className="w-4 h-4" />
                </button>

                <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Seus dados estão protegidos
                </p>
              </div>
            )}

            {/* STEP 2: Endereço */}
            {currentStep === 2 && (
              <div className="p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Onde Entregar?</h3>
                    <p className="text-[10px] text-gray-500">
                      {cepData ? (
                        <span className="text-green-600 font-medium">✓ Endereço preenchido automaticamente</span>
                      ) : (
                        'Preencha o CEP para buscar o endereço'
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    required
                    readOnly={!!cepData}
                    className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400 ${cepData ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-gray-200'}`}
                    placeholder="00000-000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                    placeholder="Rua, Avenida, Travessa..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Número
                    </label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                      placeholder="Nº"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Complemento
                    </label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                      placeholder="Apto, Bloco..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Bairro
                    </label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400"
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Cidade
                    </label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      required
                      readOnly={!!cepData}
                      className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-0 focus:border-primary transition-all placeholder:text-gray-400 ${cepData ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-gray-200'}`}
                      placeholder="Sua cidade"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                    disabled={!!cepData}
                    className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-0 focus:border-primary transition-all ${cepData ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-gray-200'}`}
                  >
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3.5 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-600"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!isStep2Valid}
                    className="flex-1 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    Revisar Pedido
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Revisão e Pagamento */}
            {currentStep === 3 && (
              <div className="p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Resumo do pedido */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Resumo do Pedido
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome</span>
                      <span className="font-medium text-gray-800">{formData.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">WhatsApp</span>
                      <span className="font-medium text-gray-800">{formData.telefone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Endereço</span>
                      <span className="font-medium text-gray-800 text-right max-w-[60%]">
                        {formData.endereco}, {formData.numero} - {formData.bairro}, {formData.cidade}/{formData.estado}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CEP</span>
                      <span className="font-medium text-gray-800">{formData.cep}</span>
                    </div>
                  </div>
                </div>

                {/* Forma de pagamento */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Pagamento via PIX</h4>
                      <p className="text-[10px] text-gray-600">
                        Após confirmar, você receberá um QR Code para pagamento instantâneo
                      </p>
                    </div>
                  </div>
                </div>

                {/* Valor total */}
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="text-2xl font-extrabold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-3.5 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-600"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Confirmar e Pagar {formatPrice(total)}
                      </>
                    )}
                  </button>
                </div>

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Shield className="w-3 h-3" />
                    <span>Compra Segura</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3" />
                    <span>Dados Protegidos</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Garantia</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
