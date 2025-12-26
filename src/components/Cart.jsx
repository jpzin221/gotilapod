import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import CartItem from './CartItem';
import FreeShippingBar from './FreeShippingBar';
import CheckoutForm from './CheckoutForm';
import PixPayment from './PixPayment';
import Portal from './Portal';
import CartCrossSell from './cart/CartCrossSell';

export default function Cart() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    getTotal,
    getTotalItems,
    clearCart,
    getDeliveryFee,
    hasFreeShipping
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [pedidoData, setPedidoData] = useState(null);
  const [cep, setCep] = useState('');
  const [validatingCep, setValidatingCep] = useState(false);
  const [cepValid, setCepValid] = useState(false);
  const [cepData, setCepData] = useState(null);
  const [calculatedShipping, setCalculatedShipping] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState(null);

  const total = getTotal();
  const totalItems = getTotalItems();

  // Verificar se é CEP de teste com frete grátis
  const isTestCepWithFreeShipping = cepData?.frete_gratis === true;

  // Verificar se atingiu frete grátis pelo valor mínimo (R$150)
  const hasMinValueFreeShipping = hasFreeShipping();

  // Frete grátis se: CEP de teste OU atingiu valor mínimo
  const shippingCost = !cepValid ? 0 : (isTestCepWithFreeShipping || hasMinValueFreeShipping ? 0 : calculatedShipping || 0);
  const finalTotal = total + shippingCost;

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const validateCEP = async (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setCepValid(false);
      setCepData(null);
      return;
    }

    // CEP DE TESTE: 06768-100 (Frete Grátis)
    if (cleanCep === '06768100') {
      // Gerar tempo de entrega aleatório entre 15 e 60 minutos
      const randomTime = Math.floor(Math.random() * (60 - 15 + 1)) + 15;
      setDeliveryTime(randomTime);
      setCepValid(true);
      setCepData({
        cep: '06768-100',
        logradouro: 'Rua de Teste',
        bairro: 'Bairro Teste',
        localidade: 'Taboão da Serra',
        uf: 'SP',
        frete_gratis: true // Flag especial para frete grátis
      });
      console.log(`🎉 CEP DE TESTE: Frete Grátis! Entrega em ${randomTime} min`);
      return;
    }

    try {
      setValidatingCep(true);

      let data = null;
      let success = false;

      // Tentar ViaCEP primeiro
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (response.ok) {
          data = await response.json();
          if (!data.erro) {
            success = true;
            console.log('✅ CEP validado via ViaCEP');
          }
        }
      } catch (viaCepError) {
        console.log('⚠️ ViaCEP indisponível, tentando BrasilAPI...');
      }

      // Fallback para BrasilAPI se ViaCEP falhar
      if (!success) {
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
          if (response.ok) {
            const brasilData = await response.json();
            // Converter formato BrasilAPI para formato ViaCEP
            data = {
              cep: brasilData.cep,
              logradouro: brasilData.street,
              bairro: brasilData.neighborhood,
              localidade: brasilData.city,
              uf: brasilData.state
            };
            success = true;
            console.log('✅ CEP validado via BrasilAPI');
          }
        } catch (brasilError) {
          console.error('❌ BrasilAPI também falhou:', brasilError);
        }
      }

      if (success && data) {
        // Gerar tempo de entrega aleatório entre 15 e 60 minutos
        const randomTime = Math.floor(Math.random() * (60 - 15 + 1)) + 15;
        setDeliveryTime(randomTime);
        setCepValid(true);
        setCepData(data);
        // Gerar frete aleatório entre R$ 8,00 e R$ 13,50
        const randomShipping = (Math.random() * (13.50 - 8.00) + 8.00).toFixed(2);
        setCalculatedShipping(parseFloat(randomShipping));
        console.log(`✅ CEP válido! Entrega em ${randomTime} min`);
      } else {
        setCepValid(false);
        setCepData(null);
        setCalculatedShipping(null);
        alert('CEP não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao validar CEP:', error);
      setCepValid(false);
      setCepData(null);
      alert('Erro ao validar CEP. Tente novamente.');
    } finally {
      setValidatingCep(false);
    }
  };

  const handleCepChange = (e) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);

    if (formatted.replace(/\D/g, '').length === 8) {
      validateCEP(formatted);
    } else {
      setCepValid(false);
      setCepData(null);
    }
  };

  const handleFinalizarPedido = () => {
    if (!cepValid) {
      alert('Por favor, insira um CEP válido antes de finalizar o pedido.');
      return;
    }
    setShowCheckout(true);
    setIsCartOpen(false); // Fecha o carrinho ao abrir o checkout
  };

  const handleCheckoutSubmit = async (formData) => {
    // Preparar dados do pedido
    const pedido = {
      id: Date.now(),
      valorTotal: finalTotal,
      nomeCliente: formData.nome,
      cpfCliente: formData.cpf.replace(/\D/g, ''),
      telefone: formData.telefone,
      endereco: {
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      },
      itens: cartItems.map(item => ({
        nome: item.name,
        quantidade: item.quantity,
        preco: item.price,
        sabor: item.selectedFlavors ? item.selectedFlavors.join(', ') : (item.selectedFlavor?.name || null)
      }))
    };

    setPedidoData(pedido);
    setShowCheckout(false);
    setShowPix(true);
  };

  const handlePixClose = () => {
    setShowPix(false);
    setPedidoData(null);
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <>
      {/* Carrinho Lateral */}
      {isCartOpen && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            style={{ zIndex: 999999 }}
            onClick={() => setIsCartOpen(false)}
          />

          {/* Carrinho lateral */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-2xl flex flex-col animate-slide-in" style={{ zIndex: 999999 }}>
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Seu Carrinho</h2>
                  <p className="text-sm opacity-90">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lista de itens - Área scrollável */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <ShoppingBag className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg font-semibold mb-2">Carrinho vazio</p>
                  <p className="text-sm text-center">
                    Adicione produtos deliciosos ao seu carrinho!
                  </p>
                </div>
              ) : (
                <>
                  {/* Itens do carrinho */}
                  {cartItems.map(item => (
                    <CartItem key={item.cartItemKey} item={item} />
                  ))}

                  {/* Botão limpar carrinho */}
                  {cartItems.length > 0 && (
                    <div className="p-4 border-b border-gray-200">
                      <button
                        onClick={clearCart}
                        className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Limpar carrinho</span>
                      </button>
                    </div>
                  )}

                  {/* Barra de frete grátis - APÓS itens do carrinho */}
                  <FreeShippingBar />

                  {/* Cross-sell: Blocos estratégicos */}
                  <CartCrossSell />
                </>
              )}
            </div>

            {/* Footer com totais */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-gray-200 p-4">
                {/* Campo de CEP */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 CEP para Entrega
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      maxLength={9}
                    />
                    {validatingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    )}
                    {cepValid && !validatingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Mensagem de Entrega Disponível */}
                  {cepValid && cepData && (
                    <div className={`mt-3 p-3 border rounded-lg ${isTestCepWithFreeShipping
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-300'
                      : 'bg-green-50 border-green-200'
                      }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{isTestCepWithFreeShipping ? '🎉' : '🏍️'}</span>
                        <div className="flex-1">
                          {isTestCepWithFreeShipping ? (
                            <>
                              <p className="text-sm font-bold text-orange-800">
                                🎁 CEP DE TESTE - FRETE GRÁTIS!
                              </p>
                              <p className="text-xs text-orange-700 mt-1">
                                {cepData.logradouro && `${cepData.logradouro}, `}
                                {cepData.bairro} - {cepData.localidade}/{cepData.uf}
                              </p>
                              <p className="text-xs text-orange-600 mt-1 font-semibold">
                                ✨ Frete totalmente GRÁTIS para este CEP!
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-green-800">
                                Entrega Disponível via Motoboy!
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                {cepData.logradouro && `${cepData.logradouro}, `}
                                {cepData.bairro} - {cepData.localidade}/{cepData.uf}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                ⚡ Entrega rápida em até {deliveryTime || 60} minutos
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!cepValid && cep.length > 0 && !validatingCep && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Digite um CEP válido para verificar disponibilidade
                    </p>
                  )}
                </div>

                {/* Resumo */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa de entrega</span>
                    <span className={`font-semibold ${shippingCost === 0 && cepValid ? 'text-green-600' : ''}`}>
                      {!cepValid ? (
                        <span className="text-gray-400 text-xs">Preencha o CEP</span>
                      ) : shippingCost === 0 ? (
                        <span className="flex items-center gap-1">
                          {(isTestCepWithFreeShipping || hasMinValueFreeShipping) && '🎉 '}
                          Grátis
                        </span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Selo de Confiança - Prova Social Discreta */}
                <div className="flex items-center justify-center gap-2 mb-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400">★</span>
                    <span className="font-medium">4.9</span>
                  </span>
                  <span>•</span>
                  <span>Compra segura</span>
                  <span>•</span>
                  <span>Clientes verificados</span>
                </div>

                {/* Botão finalizar */}
                <button
                  onClick={handleFinalizarPedido}
                  className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Finalizar Pedido
                </button>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full mt-2 text-gray-600 hover:text-gray-800 py-2 text-sm font-semibold"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </div>

          <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
        </Portal>
      )}

      {/* Modal de Checkout - Fora do Portal do carrinho */}
      <CheckoutForm
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSubmit={handleCheckoutSubmit}
        total={finalTotal}
        cepData={cepData}
      />

      {/* Modal de Pagamento PIX - Fora do Portal do carrinho */}
      <PixPayment
        isOpen={showPix}
        onClose={handlePixClose}
        onBack={() => {
          // Voltar para o formulário de checkout
          setShowPix(false);
          setShowCheckout(true);
        }}
        pedido={pedidoData}
      />
    </>
  );
}
