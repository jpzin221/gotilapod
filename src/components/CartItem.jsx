import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productService } from '../lib/supabase';

export default function CartItem({ item }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart, addFlavorToItem } = useCart();
  const [showFlavorPicker, setShowFlavorPicker] = useState(false);
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [loadingFlavors, setLoadingFlavors] = useState(false);

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const itemTotal = item.totalPrice || (item.price * item.quantity);
  const unitPriceDisplay = item.totalPrice ? item.totalPrice / item.quantity : item.price;

  const loadFlavors = async () => {
    setLoadingFlavors(true);
    try {
      const products = await productService.getAll();
      const product = products.find(p => p.id === item.id);
      if (product && product.flavors && product.flavors.length > 0) {
        setAvailableFlavors(product.flavors);
      } else {
        increaseQuantity(item.cartItemKey);
        setShowFlavorPicker(false);
      }
    } catch (error) {
      console.error('Erro ao carregar sabores:', error);
      increaseQuantity(item.cartItemKey);
      setShowFlavorPicker(false);
    } finally {
      setLoadingFlavors(false);
    }
  };

  const handlePlusClick = () => {
    if (item.selectedFlavors && item.selectedFlavors.length > 0) {
      setShowFlavorPicker(true);
      loadFlavors();
    } else {
      increaseQuantity(item.cartItemKey);
    }
  };

  const handleAddWithFlavor = () => {
    if (selectedFlavor) {
      addFlavorToItem(item.cartItemKey, selectedFlavor);
      setShowFlavorPicker(false);
      setSelectedFlavor(null);
    }
  };

  return (
    <div className="bg-white">
      <div className="flex gap-3 p-3">
        {/* Imagem */}
        <img
          src={item.image_url}
          alt={item.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.name}</h4>

              {/* Sabores */}
              {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                <div className="mt-1">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(
                      item.selectedFlavors.reduce((acc, flavor) => {
                        acc[flavor] = (acc[flavor] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([flavor, count]) => (
                      <span key={flavor} className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        🍃 {flavor} {count > 1 && <span className="text-purple-500">x{count}</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {item.quantity}x • {item.selectedFlavors.length} {item.selectedFlavors.length === 1 ? 'sabor' : 'sabores'}
                  </p>
                </div>
              )}

              {/* Sabor unico */}
              {!item.selectedFlavors && item.selectedFlavor && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium mt-1">
                  🍃 {item.selectedFlavor.name}
                </span>
              )}

              {/* Puffs */}
              {item.puff_count && (
                <p className="text-[10px] text-gray-400 mt-0.5">{item.puff_count.toLocaleString()} Puffs</p>
              )}
            </div>

            {/* Preco */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-primary">{formatPrice(itemTotal)}</p>
              {item.quantity > 1 && item.totalPrice && item.totalPrice < item.price * item.quantity && (
                <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                  -{Math.round((1 - item.totalPrice / (item.price * item.quantity)) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center bg-gray-100 rounded-lg">
              <button
                onClick={() => item.quantity === 1 ? removeFromCart(item.cartItemKey) : decreaseQuantity(item.cartItemKey)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-l-lg transition"
              >
                {item.quantity === 1 ? (
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                )}
              </button>
              <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
              <button
                onClick={handlePlusClick}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-r-lg transition"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            {item.quantity > 1 && (
              <p className="text-[10px] text-gray-400">{formatPrice(unitPriceDisplay)}/un</p>
            )}
          </div>
        </div>
      </div>

      {/* Painel de Sabores */}
      {showFlavorPicker && (
        <div className="px-3 pb-3 bg-purple-50 border-t border-purple-100">
          <div className="flex items-center justify-between mb-2 pt-2">
            <p className="text-xs font-semibold text-purple-800">Escolha o sabor:</p>
            <button onClick={() => { setShowFlavorPicker(false); setSelectedFlavor(null); }} className="p-1 hover:bg-purple-100 rounded">
              <X className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>

          {loadingFlavors ? (
            <p className="text-xs text-purple-600 animate-pulse">Carregando sabores...</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableFlavors.map((pf) => (
                  <button
                    key={pf.flavor.id}
                    onClick={() => setSelectedFlavor(pf.flavor.name)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${selectedFlavor === pf.flavor.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-purple-300 text-purple-700 hover:border-purple-500'
                    }`}
                  >
                    {pf.flavor.emoji && <span className="mr-0.5">{pf.flavor.emoji}</span>}
                    {pf.flavor.name}
                  </button>
                ))}
              </div>

              {selectedFlavor && (
                <button
                  onClick={handleAddWithFlavor}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar {selectedFlavor}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
