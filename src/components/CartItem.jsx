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
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Usar totalPrice com desconto se existir, senão calcular normalmente
  const itemTotal = item.totalPrice || (item.price * item.quantity);
  const unitPriceDisplay = item.totalPrice
    ? item.totalPrice / item.quantity
    : item.price;

  // Carregar sabores do produto quando abrir o picker
  const loadFlavors = async () => {
    setLoadingFlavors(true);
    try {
      const products = await productService.getAll();
      const product = products.find(p => p.id === item.id);
      if (product && product.flavors && product.flavors.length > 0) {
        setAvailableFlavors(product.flavors);
      } else {
        // Sem sabores, adiciona direto
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
    // Se já tem sabores no item, precisa escolher para adicionar mais
    if (item.selectedFlavors && item.selectedFlavors.length > 0) {
      setShowFlavorPicker(true);
      loadFlavors();
    } else {
      // Sem sabores, adiciona direto
      increaseQuantity(item.cartItemKey);
    }
  };

  const handleAddWithFlavor = () => {
    if (selectedFlavor) {
      // Adiciona sabor ao item existente (usa addFlavorToItem)
      addFlavorToItem(item.cartItemKey, selectedFlavor);
      setShowFlavorPicker(false);
      setSelectedFlavor(null);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition">
        {/* Imagem */}
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
        />

        {/* Informações */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm sm:text-base mb-1 leading-tight">
              {item.name}
              {item.isBundle && (
                <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Pacote
                </span>
              )}
            </h4>

            {/* Sabores Selecionados com Contagem */}
            {item.selectedFlavors && item.selectedFlavors.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {/* Agrupar sabores iguais e mostrar contagem */}
                  {Object.entries(
                    item.selectedFlavors.reduce((acc, flavor) => {
                      acc[flavor] = (acc[flavor] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([flavor, count]) => (
                    <span key={flavor} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      🍃 {flavor} {count > 1 && <span className="text-purple-500">×{count}</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'} • {item.selectedFlavors.length} {item.selectedFlavors.length === 1 ? 'sabor' : 'sabores'}
                </p>
              </div>
            )}


            {/* Fallback para sabor único (compatibilidade) */}
            {!item.selectedFlavors && item.selectedFlavor && (
              <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full mb-2">
                <span className="text-xs font-semibold">🍃 {item.selectedFlavor.name}</span>
              </div>
            )}

            {/* Descrição completa */}
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            {/* Informações extras */}
            {item.puff_count && (
              <p className="text-xs text-gray-500">
                <span className="font-semibold">{item.puff_count.toLocaleString()}</span> Puffs
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            {/* Controles de quantidade */}
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  if (item.quantity === 1) {
                    removeFromCart(item.cartItemKey);
                  } else {
                    decreaseQuantity(item.cartItemKey);
                  }
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-gray-200 rounded transition"
                title={item.quantity === 1 ? 'Remover' : 'Diminuir'}
              >
                {item.quantity === 1 ? (
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                ) : (
                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                )}
              </button>

              <span className="w-8 sm:w-10 text-center font-bold text-sm sm:text-base">
                {item.quantity}
              </span>

              <button
                onClick={handlePlusClick}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-gray-200 rounded transition"
                title="Aumentar"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
              </button>
            </div>

            {/* Preço */}
            <div className="text-right">
              <p className="text-base sm:text-lg font-bold text-primary">
                {formatPrice(itemTotal)}
              </p>
              {item.quantity > 1 && (
                <div className="flex items-center justify-end gap-1">
                  {item.totalPrice && item.totalPrice < item.price * item.quantity && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                      -{Math.round((1 - item.totalPrice / (item.price * item.quantity)) * 100)}%
                    </span>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatPrice(unitPriceDisplay)} cada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Seleção de Sabor */}
      {
        showFlavorPicker && (
          <div className="px-3 pb-3 bg-purple-50 border-t border-purple-100">
            <div className="flex items-center justify-between mb-2 pt-2">
              <p className="text-xs font-semibold text-purple-800">
                Escolha o sabor para adicionar:
              </p>
              <button
                onClick={() => {
                  setShowFlavorPicker(false);
                  setSelectedFlavor(null);
                }}
                className="p-1 hover:bg-purple-100 rounded"
              >
                <X className="w-4 h-4 text-purple-600" />
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
                      {pf.flavor.emoji && <span className="mr-1">{pf.flavor.emoji}</span>}
                      {pf.flavor.name}
                    </button>
                  ))}
                </div>

                {selectedFlavor && (
                  <button
                    onClick={handleAddWithFlavor}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar {selectedFlavor}
                  </button>
                )}
              </>
            )}
          </div>
        )
      }
    </div >
  );
}
