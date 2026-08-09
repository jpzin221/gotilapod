import { Truck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function FreeShippingBar() {
  const { hasFreeShipping, getShippingProgress, getRemainingForFreeShipping } = useCart();
  const progress = getShippingProgress();
  const remaining = getRemainingForFreeShipping();
  const freeShipping = hasFreeShipping();

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            freeShipping
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-primary to-secondary'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mensagem */}
      <div className="flex items-center gap-2">
        {freeShipping ? (
          <>
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <p className="text-xs text-green-700 font-semibold">Frete gratis conquistado!</p>
          </>
        ) : (
          <>
            <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Faltam <span className="font-bold text-primary">{formatPrice(remaining)}</span> para frete gratis
            </p>
          </>
        )}
      </div>
    </div>
  );
}
