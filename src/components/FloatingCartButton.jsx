import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function FloatingCartButton() {
  const { setIsCartOpen, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
      aria-label="Abrir carrinho"
    >
      <ShoppingCart className="w-6 h-6" />
      
      {/* Badge com contador */}
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-bounce">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}

      {/* Tooltip */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        {totalItems === 0 ? 'Carrinho vazio' : `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} no carrinho`}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-gray-900"></span>
      </span>
    </button>
  );
}
