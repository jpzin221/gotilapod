import { Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function FreeShippingBar() {
  const { 
    hasFreeShipping, 
    getShippingProgress, 
    getRemainingForFreeShipping 
  } = useCart();

  const progress = getShippingProgress();
  const remaining = getRemainingForFreeShipping();

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Barra de progresso */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              hasFreeShipping() 
                ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600' 
                : 'bg-gradient-to-r from-primary via-secondary to-accent'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Mensagem */}
      <div className="flex items-center gap-2 text-sm">
        <Truck className={`w-5 h-5 ${hasFreeShipping() ? 'text-green-500' : 'text-gray-500'}`} />
        {hasFreeShipping() ? (
          <p className="text-green-600 font-semibold">
            🎉 Parabéns! Você ganhou frete grátis!
          </p>
        ) : (
          <p className="text-gray-700">
            Faltam <span className="font-bold text-primary">{formatPrice(remaining)}</span> para frete grátis
          </p>
        )}
      </div>
    </div>
  );
}
