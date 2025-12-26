import { useState, useEffect } from 'react';
import { X, ShoppingCart, Star, Package, Cloud, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Portal from './Portal';
import ImageModal from './ImageModal';

export default function ProductModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [selectedQuantityOption, setSelectedQuantityOption] = useState('1');
  const [customQuantity, setCustomQuantity] = useState(6);
  const [flavorSelections, setFlavorSelections] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setSelectedQuantityOption('1');
      setCustomQuantity(6);
      setFlavorSelections({});
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const availableFlavors = product.flavors || [];

  // DEBUG: Verificar sabores
  console.log('🔍 DEBUG ProductModal:');
  console.log('  Product ID:', product.id);
  console.log('  Product Name:', product.name);
  console.log('  Product.flavors:', product.flavors);
  console.log('  availableFlavors:', availableFlavors);
  console.log('  availableFlavors.length:', availableFlavors.length);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getQuantityAndPrice = () => {
    const basePrice = product.price;
    let units = 1;
    let discount = 0;

    switch (selectedQuantityOption) {
      case '1':
        units = 1;
        discount = 0;
        break;
      case '2':
        units = 2;
        discount = 5;
        break;
      case '3':
        units = 3;
        discount = 8;
        break;
      case '5':
        units = 5;
        discount = 12;
        break;
      case 'box':
        units = product.units_per_box || 10;
        discount = product.box_discount_percent || 15;
        break;
      case 'custom':
        units = customQuantity;
        discount = 15; // 15% desconto para quantidades personalizadas
        break;
      default:
        units = 1;
        discount = 0;
    }

    const totalWithoutDiscount = basePrice * units;
    const finalPrice = totalWithoutDiscount * (1 - discount / 100);
    const originalPrice = totalWithoutDiscount; // Preço original sem desconto

    return {
      units,
      discount,
      totalWithoutDiscount,
      finalPrice,
      originalPrice
    };
  };

  const priceInfo = getQuantityAndPrice();
  const totalSelected = Object.values(flavorSelections).reduce((a, b) => a + b, 0);

  // Verificar se está esgotado
  const isOutOfStock = product.stock_quantity === 0;

  // Se for caixa fechada, não precisa selecionar sabores
  const isBoxOption = selectedQuantityOption === 'box';
  const canAddToCart = !isOutOfStock && (isBoxOption || availableFlavors.length === 0 || totalSelected === priceInfo.units);

  const handleAddToCart = () => {
    if (!canAddToCart || isOutOfStock) return;

    const selectedFlavorsArray = [];
    Object.entries(flavorSelections).forEach(([flavorId, count]) => {
      const flavor = availableFlavors.find(pf => pf.flavor.id === parseInt(flavorId));
      if (flavor) {
        for (let i = 0; i < count; i++) {
          selectedFlavorsArray.push(flavor.flavor.name);
        }
      }
    });

    console.log('🛒 Adicionando ao carrinho:', {
      name: product.name,
      quantity: priceInfo.units,
      selectedFlavors: selectedFlavorsArray,
      unitPrice: product.price,
      totalPrice: priceInfo.finalPrice
    });

    addToCart({
      ...product,
      quantity: priceInfo.units,
      selectedFlavors: selectedFlavorsArray.length > 0 ? selectedFlavorsArray : undefined,
      unitPrice: product.price,
      totalPrice: priceInfo.finalPrice
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none" style={{ zIndex: 999999 }}>
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-[95vw] sm:w-[85vw] max-w-lg max-h-[92vh] overflow-hidden pointer-events-auto animate-modal-in flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com imagem */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-3 flex items-center justify-center flex-shrink-0">
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowImageModal(true)}
              title="Clique para ampliar"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white hover:bg-gray-100 rounded-full p-1.5 sm:p-2 shadow-lg transition-all hover:scale-110"
            >
              <X className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600" />
            </button>
          </div>

          {/* Informações do produto */}
          <div className="p-2 sm:p-3 bg-white flex-shrink-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 leading-tight mb-1.5">
                  {product.name}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {formatPrice(priceInfo.finalPrice)}
                  </span>
                  {priceInfo.discount > 0 && (
                    <>
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        {formatPrice(priceInfo.originalPrice)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {priceInfo.discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {priceInfo.units > 1 && (
                  <div className="flex items-center gap-1.5 mt-1.5 p-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-xs sm:text-sm font-bold shadow-sm">
                        {priceInfo.units}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-gray-800">
                        {priceInfo.units} unidade{priceInfo.units > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      {formatPrice(priceInfo.finalPrice / priceInfo.units)}/un
                    </span>
                  </div>
                )}
              </div>
              {product.rating && (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">{product.rating}</span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-xs sm:text-sm text-gray-600 leading-snug mb-2 line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Badges de informação */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {product.puff_count && (
                <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs sm:text-sm">
                  <Cloud className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-semibold">{product.puff_count.toLocaleString()} Puffs</span>
                </div>
              )}
              {product.stock_quantity !== undefined && (
                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs sm:text-sm">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-semibold">
                    {product.stock_quantity > 0 ? `${product.stock_quantity} un` : 'Esgotado'}
                  </span>
                </div>
              )}
              {product.allergens && product.allergens.length > 0 && (
                <div className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-200">
                  <span className="font-semibold">⚠️ {product.allergens.join(', ')}</span>
                </div>
              )}
              {product.units_per_box > 0 && (
                <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                  <Package className="w-3 h-3" />
                  <span className="font-semibold">Caixa: {product.units_per_box} un</span>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Quantidade - Design Premium */}
          <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Quantidade</span>
              {priceInfo.discount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">
                  {priceInfo.discount}% OFF
                </span>
              )}
            </div>

            {/* Grid de Quantidades - Estilo Mercado Livre/Amazon */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {['1', '2', '3', '5'].map((qty) => {
                const q = parseInt(qty);
                const d = q === 1 ? 0 : q === 2 ? 5 : q === 3 ? 8 : 12;
                const price = product.price * q * (1 - d / 100);
                const isSelected = selectedQuantityOption === qty;
                const isDisabled = product.stock_quantity < q;

                return (
                  <button
                    key={qty}
                    onClick={() => setSelectedQuantityOption(qty)}
                    disabled={isDisabled}
                    className={`flex-shrink-0 min-w-[72px] px-3 py-2.5 rounded-xl transition-all duration-200 ${isSelected
                      ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2'
                      : isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-base font-bold">{qty}</div>
                      <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                        {formatPrice(price)}
                      </div>
                      {d > 0 && (
                        <div className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-green-200' : 'text-green-600'}`}>
                          -{d}%
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Opção Caixa inline */}
              {product.units_per_box > 0 && (
                <button
                  onClick={() => setSelectedQuantityOption('box')}
                  disabled={product.stock_quantity < product.units_per_box}
                  className={`flex-shrink-0 min-w-[90px] px-3 py-2.5 rounded-xl transition-all duration-200 ${selectedQuantityOption === 'box'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md ring-2 ring-purple-400 ring-offset-2'
                    : 'bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-base font-bold">📦 {product.units_per_box}</div>
                    <div className={`text-xs ${selectedQuantityOption === 'box' ? 'text-white/90' : 'text-purple-600'}`}>
                      {formatPrice(product.price * product.units_per_box * (1 - (product.box_discount_percent || 15) / 100))}
                    </div>
                    <div className={`text-[10px] font-bold mt-0.5 ${selectedQuantityOption === 'box' ? 'text-green-200' : 'text-green-600'}`}>
                      -{product.box_discount_percent || 15}%
                    </div>
                  </div>
                </button>
              )}

              {/* Opção Quantidade Personalizada */}
              <button
                onClick={() => setSelectedQuantityOption('custom')}
                className={`flex-shrink-0 min-w-[90px] px-3 py-2.5 rounded-xl transition-all duration-200 ${selectedQuantityOption === 'custom'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md ring-2 ring-orange-400 ring-offset-2'
                  : 'bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800'
                  }`}
              >
                <div className="text-center">
                  <div className="text-base font-bold">✏️ +5</div>
                  <div className={`text-xs ${selectedQuantityOption === 'custom' ? 'text-white/90' : 'text-orange-600'}`}>
                    Personalizar
                  </div>
                </div>
              </button>
            </div>

            {/* Input de quantidade customizada */}
            {selectedQuantityOption === 'custom' && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <label className="block text-sm font-semibold text-orange-900 mb-2">
                  Quantas unidades? (6 ou mais)
                </label>
                <input
                  type="number"
                  min="6"
                  max={product.stock_quantity || 999}
                  value={customQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 6;
                    setCustomQuantity(Math.max(6, Math.min(val, product.stock_quantity || 999)));
                  }}
                  className="w-full px-4 py-2 text-center text-lg font-bold border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="6"
                />
                <p className="text-xs text-orange-700 mt-1 text-center">
                  15% de desconto em compras acima de 5 unidades
                </p>
              </div>
            )}
          </div>

          {/* Seção de Sabores - COM SCROLL */}
          <div className="overflow-y-auto max-h-[45vh] p-3 sm:p-4 bg-white">
            {/* Mensagem para Caixa Fechada */}
            {isBoxOption && availableFlavors.length > 0 && (
              <div className="mb-3 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-2xl">📦</span>
                  <div>
                    <p className="text-xs sm:text-base font-bold text-purple-900 mb-0.5">Caixa com Sabores Variados</p>
                    <p className="text-[10px] sm:text-sm text-purple-700 leading-snug">
                      {product.units_per_box} unidades com sabores sortidos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Divisor Visual */}
            {availableFlavors.length > 0 && !isBoxOption && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                  <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
                    Escolha os Sabores
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                </div>
              </div>
            )}

            {/* Seletor de Sabores */}
            {availableFlavors.length > 0 && !isBoxOption && (
              <div className="mb-2">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-1.5 sm:p-2 mb-2 border border-primary/20">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-bold text-gray-800">
                      Escolha {priceInfo.units} sabor{priceInfo.units > 1 ? 'es' : ''}:
                    </label>
                    <span className={`text-xs sm:text-sm font-bold px-2 py-1 rounded-full shadow-sm ${totalSelected === priceInfo.units
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white animate-pulse'
                      }`}>
                      {totalSelected} / {priceInfo.units}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-snug">
                    {totalSelected === priceInfo.units
                      ? '✓ Todos selecionados!'
                      : `Escolha ${priceInfo.units} sabor${priceInfo.units > 1 ? 'es' : ''}`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 pb-2">
                  {availableFlavors.map((pf, index) => {
                    const count = flavorSelections[pf.flavor.id] || 0;
                    // Limitar ao menor valor entre unidades selecionadas e estoque disponível
                    const maxAllowed = Math.min(priceInfo.units, product.stock_quantity);
                    const maxReached = totalSelected >= maxAllowed;
                    const isSelected = count > 0;

                    // Alternar direção do gradiente para criar efeito espelhado
                    const gradientClass = index % 2 === 0
                      ? 'bg-gradient-to-r from-primary to-secondary'
                      : 'bg-gradient-to-r from-secondary to-primary';

                    return (
                      <button
                        key={pf.flavor.id}
                        type="button"
                        onClick={() => {
                          const newSelections = { ...flavorSelections };
                          const maxAllowed = Math.min(priceInfo.units, product.stock_quantity);

                          if (count === 0) {
                            // Se não está selecionado, adiciona 1
                            if (!maxReached) {
                              newSelections[pf.flavor.id] = 1;
                            }
                          } else if (count < maxAllowed && !maxReached) {
                            // Se já está selecionado e não atingiu o máximo, adiciona mais 1
                            newSelections[pf.flavor.id] = count + 1;
                          } else {
                            // Se já está no máximo ou quer desselecionar, remove tudo
                            delete newSelections[pf.flavor.id];
                          }

                          setFlavorSelections(newSelections);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (count > 0) {
                            const newSelections = { ...flavorSelections };
                            newSelections[pf.flavor.id] = count - 1;
                            if (newSelections[pf.flavor.id] === 0) {
                              delete newSelections[pf.flavor.id];
                            }
                            setFlavorSelections(newSelections);
                          }
                        }}
                        disabled={false}
                        className={`relative p-2 sm:p-2.5 rounded-lg font-semibold text-xs transition-all duration-300 ease-in-out transform min-h-[50px] ${isSelected
                          ? `${gradientClass} text-white shadow-lg scale-105 animate-pulse-once`
                          : maxReached
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:shadow-md hover:scale-105 active:scale-95'
                          }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5 h-full">
                          {pf.flavor.emoji && (
                            <span className="text-base sm:text-lg">{pf.flavor.emoji}</span>
                          )}
                          <span className="leading-tight text-center line-clamp-2 text-[10px] sm:text-xs font-medium">{pf.flavor.name}</span>
                          {isSelected && (
                            <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-white text-primary rounded-full text-[10px] sm:text-xs font-bold animate-bounce-once">
                              {count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center leading-tight pb-3">
                  💡 Clique para adicionar • Toque longo para remover
                </p>
              </div>
            )}
          </div>

          {/* Footer Fixo - Design Premium */}
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
            {/* Resumo de Preço */}
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-sm text-gray-500">
                  {priceInfo.units} {priceInfo.units === 1 ? 'unidade' : 'unidades'}
                </span>
                {priceInfo.discount > 0 && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">
                    Economia: {formatPrice(priceInfo.totalWithoutDiscount - priceInfo.finalPrice)}
                  </span>
                )}
              </div>
              <div className="text-right">
                {priceInfo.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through mr-2">
                    {formatPrice(priceInfo.totalWithoutDiscount)}
                  </span>
                )}
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(priceInfo.finalPrice)}
                </span>
              </div>
            </div>

            {/* Aviso de Sabores */}
            {!canAddToCart && !isOutOfStock && availableFlavors.length > 0 && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 text-center font-medium">
                  👆 Selecione {priceInfo.units - totalSelected} sabor{priceInfo.units - totalSelected > 1 ? 'es' : ''} acima
                </p>
              </div>
            )}

            {/* Botão Adicionar - Estilo Premium */}
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${canAddToCart
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed text-gray-500'
                }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>
                {isOutOfStock
                  ? 'Produto Esgotado'
                  : canAddToCart
                    ? 'Adicionar ao Carrinho'
                    : `Selecione ${priceInfo.units - totalSelected} sabor${priceInfo.units - totalSelected > 1 ? 'es' : ''}`}
              </span>
            </button>

            {/* Selo de Confiança - Prova Social Discreta */}
            {!isOutOfStock && (
              <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium">4.9</span>
                </span>
                <span>•</span>
                <span>Compra segura</span>
                <span>•</span>
                <span>Clientes verificados</span>
              </div>
            )}

            {isOutOfStock && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Avisaremos quando estiver disponível
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Visualização de Imagem */}
      {showImageModal && (
        <ImageModal
          imageUrl={product.image}
          imageName={product.name}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </Portal>
  );
}
