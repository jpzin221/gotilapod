import { X, ShoppingBag, Trash2, Ticket, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import CartItem from './CartItem';
import FreeShippingBar from './FreeShippingBar';
import CheckoutForm from './CheckoutForm';
import PixPayment from './PixPayment';
import Portal from './Portal';
import CartCrossSell from './cart/CartCrossSell';

const CART_ADDRESS_KEY = 'gorila_cart_address';

export default function Cart() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    getTotal,
    getTotalWithCoupon,
    getTotalItems,
    clearCart,
    getDeliveryFee,
    hasFreeShipping,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon
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
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Restaurar endereco salvo no localStorage ao abrir o carrinho
  useEffect(() => {
    if (isCartOpen) {
      const saved = localStorage.getItem(CART_ADDRESS_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.cep && data.cepData && data.shipping !== null) {
            setCep(data.cep);
            setCepValid(true);
            setCepData(data.cepData);
            setCalculatedShipping(data.shipping);
            setDeliveryTime(data.deliveryTime || 30);
          }
        } catch (e) {
          console.warn('Erro ao restaurar endereco:', e);
        }
      }
    }
  }, [isCartOpen]);

  const total = getTotal();
  const totalWithCoupon = getTotalWithCoupon();
  const totalItems = getTotalItems();

  const isTestCepWithFreeShipping = cepData?.frete_gratis === true;
  const hasMinValueFreeShipping = hasFreeShipping();
  const shippingCost = !cepValid ? 0 : (isTestCepWithFreeShipping || hasMinValueFreeShipping ? 0 : calculatedShipping || 0);
  const finalTotal = totalWithCoupon + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const result = await applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponCode('');
    } else {
      setCouponError(result.error);
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatCEP = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const validateCEP = async (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepValid(false);
      setCepData(null);
      return;
    }

    try {
      setValidatingCep(true);
      let data = null;
      let success = false;

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (response.ok) {
          data = await response.json();
          if (!data.erro) success = true;
        }
      } catch (viaCepError) {}

      if (!success) {
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
          if (response.ok) {
            const brasilData = await response.json();
            data = { cep: brasilData.cep, logradouro: brasilData.street, bairro: brasilData.neighborhood, localidade: brasilData.city, uf: brasilData.state };
            success = true;
          }
        } catch (brasilError) {}
      }

      if (success && data) {
        const randomTime = Math.floor(Math.random() * (60 - 15 + 1)) + 15;
        setDeliveryTime(randomTime);
        setCepValid(true);
        setCepData(data);
        const randomShipping = (Math.random() * (13.50 - 8.00) + 8.00).toFixed(2);
        setCalculatedShipping(parseFloat(randomShipping));

        // Salvar endereco no localStorage
        localStorage.setItem(CART_ADDRESS_KEY, JSON.stringify({
          cep: formatted,
          cepData: data,
          shipping: parseFloat(randomShipping),
          deliveryTime: randomTime
        }));
      } else {
        setCepValid(false);
        setCepData(null);
        setCalculatedShipping(null);
        alert('CEP nao encontrado!');
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
      alert('Por favor, insira um CEP valido antes de finalizar o pedido.');
      return;
    }
    setShowCheckout(true);
    setIsCartOpen(false);
  };

  const handleCheckoutSubmit = async (formData) => {
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
      })),
      appliedCoupon: appliedCoupon,
      couponDiscount: couponDiscount
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
      {isCartOpen && (
        <Portal>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 999999 }}
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-gray-50 shadow-2xl flex flex-col" style={{ zIndex: 9999999 }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Seu Carrinho</h2>
                  <p className="text-xs text-white/80">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de itens - scrollavel */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <ShoppingBag className="w-16 h-16 mb-3 opacity-20" />
                  <p className="text-lg font-semibold mb-1">Carrinho vazio</p>
                  <p className="text-sm text-center text-gray-400">Adicione produtos ao seu carrinho!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cartItems.map(item => (
                    <CartItem key={item.cartItemKey} item={item} />
                  ))}

                  {/* Cross-sell - so aparece apos CEP validado */}
                  {cepValid && (
                    <div className="bg-gray-50">
                      <CartCrossSell />
                    </div>
                  )}

                  {/* Barra de frete gratis */}
                  <div className="bg-white px-4 py-3">
                    <FreeShippingBar />
                  </div>

                  {/* Limpar carrinho */}
                  <div className="bg-white px-4 py-2">
                    <button
                      onClick={() => {
                        clearCart();
                        localStorage.removeItem(CART_ADDRESS_KEY);
                        setCep('');
                        setCepValid(false);
                        setCepData(null);
                        setCalculatedShipping(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar carrinho
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixo */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-gray-200 flex-shrink-0">
                {/* Secoes colapsaveis */}
                <div className="divide-y divide-gray-100">
                  {/* Cupom - colapsavel */}
                  <div className="px-4">
                    {appliedCoupon ? (
                      <div className="py-3">
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-sm font-bold text-green-800">{appliedCoupon.code}</p>
                              <p className="text-xs text-green-600">
                                {appliedCoupon.discount_percent ? `${appliedCoupon.discount_percent}% OFF` : `R$ ${appliedCoupon.discount_amount} OFF`}
                                {' '}- {formatPrice(couponDiscount)}
                              </p>
                            </div>
                          </div>
                          <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1">
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCouponInput(!showCouponInput)}
                        className="w-full py-3 flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 text-gray-600 font-medium">
                          <Ticket className="w-4 h-4" />
                          Cupom de Desconto
                        </span>
                        {showCouponInput ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                    )}

                    {!appliedCoupon && showCouponInput && (
                      <div className="pb-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                            placeholder="Digite seu cupom"
                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-4 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition flex items-center gap-1"
                          >
                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                        {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                      </div>
                    )}
                  </div>

                  {/* CEP - colapsavel */}
                  <div className="px-4">
                    <button
                      onClick={() => {}}
                      className="w-full py-3 flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-600 font-medium">
                        <span className="text-base">📍</span>
                        CEP para Entrega
                      </span>
                      {cepValid && <span className="text-green-600 text-xs font-semibold">✓ Validado</span>}
                    </button>
                    <div className="pb-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          maxLength={9}
                        />
                        {validatingCep && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          </div>
                        )}
                        {cepValid && !validatingCep && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-green-600 text-sm font-bold">✓</span>
                          </div>
                        )}
                      </div>

                      {cepValid && cepData && (
                        <div className={`mt-2 p-2.5 rounded-lg text-xs ${isTestCepWithFreeShipping ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                          <p className={`font-bold ${isTestCepWithFreeShipping ? 'text-orange-800' : 'text-green-800'}`}>
                            {isTestCepWithFreeShipping ? '🎁 FRETE GRATIS!' : '🏍️ Entrega via Motoboy'}
                          </p>
                          <p className="text-gray-600 mt-0.5">
                            {cepData.bairro} - {cepData.localidade}/{cepData.uf}
                          </p>
                          <p className="text-gray-500 mt-0.5">⚡ Em ate {deliveryTime || 60} min</p>
                        </div>
                      )}

                      {!cepValid && cep.length >= 9 && !validatingCep && (
                        <p className="text-xs text-orange-500 mt-1.5">⚠️ Digite um CEP valido</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumo + Botao - sempre visivel */}
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          Cupom
                        </span>
                        <span className="font-medium text-green-600">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Frete</span>
                      <span className={`font-medium ${shippingCost === 0 && cepValid ? 'text-green-600' : ''}`}>
                        {!cepValid ? 'A calcular' : shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                      </span>
                    </div>

                    <div className="flex justify-between pt-1.5 border-t border-gray-200">
                      <span className="font-bold text-base">Total</span>
                      <span className="font-bold text-base text-primary">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Selo */}
                  <div className="flex items-center justify-center gap-2 mb-3 text-[10px] text-gray-400">
                    <span>⭐ 4.9</span>
                    <span>•</span>
                    <span>Compra segura</span>
                    <span>•</span>
                    <span>Verificados</span>
                  </div>

                  {/* Botoes */}
                  <button
                    onClick={handleFinalizarPedido}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 text-sm"
                  >
                    Finalizar Pedido
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full text-gray-500 hover:text-gray-700 py-2 text-xs font-medium mt-1"
                  >
                    Continuar comprando
                  </button>
                </div>
              </div>
            )}
          </div>
        </Portal>
      )}

      <CheckoutForm
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSubmit={handleCheckoutSubmit}
        total={finalTotal}
        cepData={cepData}
      />

      <PixPayment
        isOpen={showPix}
        onClose={handlePixClose}
        onBack={() => { setShowPix(false); setShowCheckout(true); }}
        pedido={pedidoData}
      />
    </>
  );
}
