import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartButton() {
  const { setIsCartOpen, getTotalItems, getTotal } = useCart();
  const totalItems = getTotalItems();
  const total = getTotal();

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  // Só mostra o botão se houver itens no carrinho
  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-6 right-6 bg-primary hover:bg-secondary text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 z-50 flex items-center gap-3 px-6 py-4"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-xs opacity-90">Ver carrinho</span>
        <span className="font-bold">{formatPrice(total)}</span>
      </div>
    </button>
  );
}
