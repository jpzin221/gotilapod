import { useState, useEffect } from 'react';
import { X, ShoppingCart, Star, Package, Cloud, ChevronLeft, ChevronRight, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Portal from './Portal';
import ImageModal from './ImageModal';

export default function ProductModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [selectedQuantityOption, setSelectedQuantityOption] = useState('1');
  const [customQuantity, setCustomQuantity] = useState(6);
  const [flavorSelections, setFlavorSelections] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileStep, setMobileStep] = useState(1);

  const productImages = (product?.images && Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product?.image_url ? [product.image_url] : []);

  useEffect(() => {
    if (isOpen && product) {
      setSelectedQuantityOption('1');
      setCustomQuantity(6);
      setFlavorSelections({});
      setMobileStep(1);

      try {
        if (window.utmify) {
          window.utmify.track('ViewContent', {
            content_name: product.name,
            content_ids: [product.id],
            content_type: 'product',
            value: product.price,
            currency: 'BRL'
          });
        }
      } catch (e) {
        console.warn('UTMFY ViewContent error:', e);
      }
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const availableFlavors = product.flavors || [];

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
      case '1': units = 1; discount = 0; break;
      case '2': units = 2; discount = 5; break;
      case '3': units = 3; discount = 8; break;
      case '5': units = 5; discount = 12; break;
      case 'box': units = product.units_per_box || 10; discount = product.box_discount_percent || 15; break;
      case 'custom': units = customQuantity; discount = 15; break;
      default: units = 1; discount = 0;
    }

    const totalWithoutDiscount = basePrice * units;
    const finalPrice = totalWithoutDiscount * (1 - discount / 100);

    return { units, discount, totalWithoutDiscount, finalPrice, originalPrice: totalWithoutDiscount };
  };

  const priceInfo = getQuantityAndPrice();
  const totalSelected = Object.values(flavorSelections).reduce((a, b) => a + b, 0);

  const isOutOfStock = product.stock_quantity === 0;
  const isBoxOption = selectedQuantityOption === 'box';
  const needsFlavors = availableFlavors.length > 0 && !isBoxOption;
  const canAddToCart = !isOutOfStock && (!needsFlavors || totalSelected === priceInfo.units);

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

    addToCart({
      ...product,
      quantity: priceInfo.units,
      selectedFlavors: selectedFlavorsArray.length > 0 ? selectedFlavorsArray : undefined,
      unitPrice: product.price,
      totalPrice: priceInfo.finalPrice
    });

    onClose();
  };

  const handleNextStep = () => {
    setMobileStep(2);
  };

  const handleBackStep = () => {
    setMobileStep(1);
  };

  return (
    <Portal>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 pointer-events-none" style={{ zIndex: 999999 }}>
        <div
          className="bg-white sm:rounded-2xl shadow-2xl w-full sm:w-[85vw] max-w-lg h-full sm:max-h-[92vh] sm:rounded-xl overflow-hidden pointer-events-auto animate-modal-in flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* === MOBILE: Two-step flow === */}
          <div className="flex flex-col h-full sm:hidden">
            {mobileStep === 1 ? (
              <>
                {/* STEP 1 MOBILE: Imagem + Info + Quantidade */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                  <div className="relative w-full">
                    <div
                      className="w-full aspect-square cursor-pointer flex items-center justify-center p-6"
                      onClick={() => setShowImageModal(true)}
                    >
                      <img
                        src={productImages[currentImageIndex] || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain drop-shadow-lg"
                      />
                    </div>
                    {productImages.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2.5 shadow-md transition">
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % productImages.length); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2.5 shadow-md transition">
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {productImages.map((_, i) => (
                            <div key={i} className={`rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-3 h-2' : 'bg-white/50 w-2 h-2'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all hover:scale-110"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {productImages.length > 1 && (
                  <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-white border-b border-gray-100 flex-shrink-0">
                    {productImages.map((img, i) => (
                      <button key={i} onClick={() => setCurrentImageIndex(i)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition ${i === currentImageIndex ? 'border-primary' : 'border-gray-200 opacity-60'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="text-lg font-bold text-gray-800 leading-tight flex-1">{product.name}</h2>
                      {product.rating && (
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {formatPrice(priceInfo.finalPrice)}
                      </span>
                      {priceInfo.discount > 0 && (
                        <>
                          <span className="text-sm text-gray-500 line-through">{formatPrice(priceInfo.originalPrice)}</span>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{priceInfo.discount}% OFF</span>
                        </>
                      )}
                    </div>

                    {priceInfo.units > 1 && (
                      <div className="flex items-center gap-1.5 mb-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-xs font-bold">{priceInfo.units}</span>
                        <span className="text-sm font-bold text-gray-800">{priceInfo.units} unidades</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm font-semibold text-gray-700">{formatPrice(priceInfo.finalPrice / priceInfo.units)}/un</span>
                      </div>
                    )}

                    {product.description && (
                      <p className="text-sm text-gray-600 leading-snug mb-3">{product.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {product.puff_count && (
                        <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs">
                          <Cloud className="w-3.5 h-3.5" />
                          <span className="font-semibold">{product.puff_count.toLocaleString()} Puffs</span>
                        </div>
                      )}
                      {product.stock_quantity !== undefined && (
                        <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs">
                          <Package className="w-3.5 h-3.5" />
                          <span className="font-semibold">{product.stock_quantity > 0 ? `${product.stock_quantity} un` : 'Esgotado'}</span>
                        </div>
                      )}
                      {product.units_per_box > 0 && (
                        <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-xs">
                          <Package className="w-3.5 h-3.5" />
                          <span className="font-semibold">Caixa: {product.units_per_box} un</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">Quantidade</span>
                        {priceInfo.discount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">{priceInfo.discount}% OFF</span>
                        )}
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                        {['1', '2', '3', '5'].map((qty) => {
                          const q = parseInt(qty);
                          const d = q === 1 ? 0 : q === 2 ? 5 : q === 3 ? 8 : 12;
                          const price = product.price * q * (1 - d / 100);
                          const isSelected = selectedQuantityOption === qty;
                          const isDisabled = product.stock_quantity < q;
                          return (
                            <button key={qty} onClick={() => setSelectedQuantityOption(qty)} disabled={isDisabled}
                              className={`flex-shrink-0 min-w-[72px] px-3 py-2.5 rounded-xl transition-all ${isSelected ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2' : isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}>
                              <div className="text-center">
                                <div className="text-base font-bold">{qty}</div>
                                <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>{formatPrice(price)}</div>
                                {d > 0 && <div className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-green-200' : 'text-green-600'}`}>-{d}%</div>}
                              </div>
                            </button>
                          );
                        })}
                        {product.units_per_box > 0 && (
                          <button onClick={() => setSelectedQuantityOption('box')} disabled={product.stock_quantity < product.units_per_box}
                            className={`flex-shrink-0 min-w-[90px] px-3 py-2.5 rounded-xl transition-all ${selectedQuantityOption === 'box' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md ring-2 ring-purple-400 ring-offset-2' : 'bg-purple-50 border border-purple-200 text-purple-800'}`}>
                            <div className="text-center">
                              <div className="text-base font-bold">📦 {product.units_per_box}</div>
                              <div className={`text-xs ${selectedQuantityOption === 'box' ? 'text-white/90' : 'text-purple-600'}`}>
                                {formatPrice(product.price * product.units_per_box * (1 - (product.box_discount_percent || 15) / 100))}
                              </div>
                            </div>
                          </button>
                        )}
                        <button onClick={() => setSelectedQuantityOption('custom')}
                          className={`flex-shrink-0 min-w-[90px] px-3 py-2.5 rounded-xl transition-all ${selectedQuantityOption === 'custom' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md ring-2 ring-orange-400 ring-offset-2' : 'bg-orange-50 border border-orange-200 text-orange-800'}`}>
                          <div className="text-center">
                            <div className="text-base font-bold">✏️ +5</div>
                            <div className={`text-xs ${selectedQuantityOption === 'custom' ? 'text-white/90' : 'text-orange-600'}`}>Personalizar</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Step 1 */}
                <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{priceInfo.units} {priceInfo.units === 1 ? 'unidade' : 'unidades'}</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(priceInfo.finalPrice)}</span>
                  </div>
                  <button
                    onClick={needsFlavors ? handleNextStep : handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white shadow-lg active:scale-[0.98]'}`}
                  >
                    {isOutOfStock ? 'Produto Esgotado' : needsFlavors ? (
                      <>Escolher Sabores <ArrowRight className="w-5 h-5" /></>
                    ) : (
                      <><ShoppingCart className="w-5 h-5" /> Adicionar ao Carrinho</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* STEP 2 MOBILE: Sabores + Carrinho */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                  <button onClick={handleBackStep} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500">{priceInfo.units} {priceInfo.units === 1 ? 'unidade' : 'unidades'} • {formatPrice(priceInfo.finalPrice)}</p>
                  </div>
                  <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {isBoxOption && availableFlavors.length > 0 && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="text-sm font-bold text-purple-900 mb-0.5">Caixa com Sabores Variados</p>
                          <p className="text-xs text-purple-700">{product.units_per_box} unidades com sabores sortidos</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {needsFlavors && (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Escolha os Sabores</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                        </div>

                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-3 mb-3 border border-primary/20">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-bold text-gray-800">
                              Escolha {priceInfo.units} sabor{priceInfo.units > 1 ? 'es' : ''}:
                            </label>
                            <span className={`text-sm font-bold px-2.5 py-1 rounded-full shadow-sm ${totalSelected === priceInfo.units ? 'bg-green-500 text-white' : 'bg-orange-500 text-white animate-pulse'}`}>
                              {totalSelected} / {priceInfo.units}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {totalSelected === priceInfo.units ? '✓ Todos selecionados!' : `Faltam ${priceInfo.units - totalSelected} sabor${priceInfo.units - totalSelected > 1 ? 'es' : ''}`}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {availableFlavors.map((pf, index) => {
                            const count = flavorSelections[pf.flavor.id] || 0;
                            const maxAllowed = Math.min(priceInfo.units, product.stock_quantity);
                            const maxReached = totalSelected >= maxAllowed;
                            const isSelected = count > 0;
                            const gradientClass = index % 2 === 0 ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-gradient-to-r from-secondary to-primary';

                            return (
                              <button key={pf.flavor.id} type="button"
                                onClick={() => {
                                  const newSelections = { ...flavorSelections };
                                  const max = Math.min(priceInfo.units, product.stock_quantity);
                                  if (count === 0) { if (!maxReached) newSelections[pf.flavor.id] = 1; }
                                  else if (count < max && !maxReached) { newSelections[pf.flavor.id] = count + 1; }
                                  else { delete newSelections[pf.flavor.id]; }
                                  setFlavorSelections(newSelections);
                                }}
                                className={`relative p-3 rounded-xl font-semibold text-xs transition-all duration-300 min-h-[60px] ${isSelected ? `${gradientClass} text-white shadow-lg scale-105` : maxReached ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' : 'bg-white border-2 border-gray-200 text-gray-700 active:scale-95'}`}
                              >
                                <div className="flex flex-col items-center justify-center gap-1 h-full">
                                  {pf.flavor.emoji && <span className="text-xl">{pf.flavor.emoji}</span>}
                                  <span className="leading-tight text-center line-clamp-2 text-xs font-medium">{pf.flavor.name}</span>
                                  {isSelected && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-white text-primary rounded-full text-[10px] font-bold">
                                      {count}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">Toque para adicionar • Toque novamente para mais</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Step 2 */}
                <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{priceInfo.units} {priceInfo.units === 1 ? 'unidade' : 'unidades'}</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(priceInfo.finalPrice)}</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${canAddToCart ? 'bg-primary hover:bg-primary/90 text-white shadow-lg active:scale-[0.98]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {canAddToCart ? 'Adicionar ao Carrinho' : `Selecione ${priceInfo.units - totalSelected} sabor${priceInfo.units - totalSelected > 1 ? 'es' : ''}`}
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-gray-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">4.9</span>
                    <span>•</span>
                    <span>Compra segura</span>
                    <span>•</span>
                    <span>Clientes verificados</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* === DESKTOP: Single-page layout === */}
          <div className="hidden sm:flex flex-col h-full">
            {/* Header com imagem */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
              <div className="relative w-full">
                <div className="w-full aspect-[4/3] max-h-[40vh] cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center p-6"
                  onClick={() => setShowImageModal(true)}>
                  <img src={productImages[currentImageIndex] || product.image_url} alt={product.name} className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                {productImages.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition">
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition">
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>
              <button onClick={onClose} className="absolute top-3 right-3 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all hover:scale-110">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-white border-b border-gray-100">
                {productImages.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === currentImageIndex ? 'border-primary' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-white flex-shrink-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800 leading-tight mb-1">{product.name}</h2>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{formatPrice(priceInfo.finalPrice)}</span>
                    {priceInfo.discount > 0 && (
                      <>
                        <span className="text-sm text-gray-500 line-through">{formatPrice(priceInfo.originalPrice)}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{priceInfo.discount}% OFF</span>
                      </>
                    )}
                  </div>
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
                  </div>
                )}
              </div>
              {product.description && <p className="text-sm text-gray-600 leading-snug mb-2 line-clamp-2">{product.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {product.puff_count && (
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs">
                    <Cloud className="w-3.5 h-3.5" /><span className="font-semibold">{product.puff_count.toLocaleString()} Puffs</span>
                  </div>
                )}
                {product.stock_quantity !== undefined && (
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs">
                    <Package className="w-3.5 h-3.5" /><span className="font-semibold">{product.stock_quantity > 0 ? `${product.stock_quantity} un` : 'Esgotado'}</span>
                  </div>
                )}
                {product.units_per_box > 0 && (
                  <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-xs">
                    <Package className="w-3.5 h-3.5" /><span className="font-semibold">Caixa: {product.units_per_box} un</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantidade */}
            <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">Quantidade</span>
                {priceInfo.discount > 0 && <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">{priceInfo.discount}% OFF</span>}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {['1', '2', '3', '5'].map((qty) => {
                  const q = parseInt(qty);
                  const d = q === 1 ? 0 : q === 2 ? 5 : q === 3 ? 8 : 12;
                  const price = product.price * q * (1 - d / 100);
                  const isSelected = selectedQuantityOption === qty;
                  const isDisabled = product.stock_quantity < q;
                  return (
                    <button key={qty} onClick={() => setSelectedQuantityOption(qty)} disabled={isDisabled}
                      className={`flex-shrink-0 min-w-[72px] px-3 py-2.5 rounded-xl transition-all ${isSelected ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2' : isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800'}`}>
                      <div className="text-center">
                        <div className="text-base font-bold">{qty}</div>
                        <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>{formatPrice(price)}</div>
                        {d > 0 && <div className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-green-200' : 'text-green-600'}`}>-{d}%</div>}
                      </div>
                    </button>
                  );
                })}
                {product.units_per_box > 0 && (
                  <button onClick={() => setSelectedQuantityOption('box')} disabled={product.stock_quantity < product.units_per_box}
                    className={`flex-shrink-0 min-w-[90px] px-3 py-2.5 rounded-xl transition-all ${selectedQuantityOption === 'box' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md ring-2 ring-purple-400 ring-offset-2' : 'bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800'}`}>
                    <div className="text-center">
                      <div className="text-base font-bold">📦 {product.units_per_box}</div>
                      <div className={`text-xs ${selectedQuantityOption === 'box' ? 'text-white/90' : 'text-purple-600'}`}>
                        {formatPrice(product.price * product.units_per_box * (1 - (product.box_discount_percent || 15) / 100))}
                      </div>
                      <div className={`text-[10px] font-bold mt-0.5 ${selectedQuantityOption === 'box' ? 'text-green-200' : 'text-green-600'}`}>-{product.box_discount_percent || 15}%</div>
                    </div>
                  </button>
                )}
                <button onClick={() => setSelectedQuantityOption('custom')}
                  className={`flex-shrink-0 min-w-[90px] px-3 py-2.5 rounded-xl transition-all ${selectedQuantityOption === 'custom' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md ring-2 ring-orange-400 ring-offset-2' : 'bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800'}`}>
                  <div className="text-center">
                    <div className="text-base font-bold">✏️ +5</div>
                    <div className={`text-xs ${selectedQuantityOption === 'custom' ? 'text-white/90' : 'text-orange-600'}`}>Personalizar</div>
                  </div>
                </button>
              </div>
              {selectedQuantityOption === 'custom' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <label className="block text-sm font-semibold text-orange-900 mb-2">Quantas unidades? (6 ou mais)</label>
                  <input type="number" min="6" max={product.stock_quantity || 999} value={customQuantity}
                    onChange={(e) => { const val = parseInt(e.target.value) || 6; setCustomQuantity(Math.max(6, Math.min(val, product.stock_quantity || 999))); }}
                    className="w-full px-4 py-2 text-center text-lg font-bold border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
                  <p className="text-xs text-orange-700 mt-1 text-center">15% de desconto em compras acima de 5 unidades</p>
                </div>
              )}
            </div>

            {/* Sabores */}
            <div className="overflow-y-auto max-h-[45vh] p-4 bg-white">
              {isBoxOption && availableFlavors.length > 0 && (
                <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">📦</span>
                    <div>
                      <p className="text-sm font-bold text-purple-900 mb-0.5">Caixa com Sabores Variados</p>
                      <p className="text-xs text-purple-700">{product.units_per_box} unidades com sabores sortidos</p>
                    </div>
                  </div>
                </div>
              )}
              {needsFlavors && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Escolha os Sabores</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-2 mb-2 border border-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-bold text-gray-800">Escolha {priceInfo.units} sabor{priceInfo.units > 1 ? 'es' : ''}:</label>
                      <span className={`text-sm font-bold px-2 py-1 rounded-full shadow-sm ${totalSelected === priceInfo.units ? 'bg-green-500 text-white' : 'bg-orange-500 text-white animate-pulse'}`}>
                        {totalSelected} / {priceInfo.units}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{totalSelected === priceInfo.units ? '✓ Todos selecionados!' : `Escolha ${priceInfo.units} sabor${priceInfo.units > 1 ? 'es' : ''}`}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4 pb-2">
                    {availableFlavors.map((pf, index) => {
                      const count = flavorSelections[pf.flavor.id] || 0;
                      const maxAllowed = Math.min(priceInfo.units, product.stock_quantity);
                      const maxReached = totalSelected >= maxAllowed;
                      const isSelected = count > 0;
                      const gradientClass = index % 2 === 0 ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-gradient-to-r from-secondary to-primary';
                      return (
                        <button key={pf.flavor.id} type="button"
                          onClick={() => {
                            const ns = { ...flavorSelections };
                            const max = Math.min(priceInfo.units, product.stock_quantity);
                            if (count === 0) { if (!maxReached) ns[pf.flavor.id] = 1; }
                            else if (count < max && !maxReached) { ns[pf.flavor.id] = count + 1; }
                            else { delete ns[pf.flavor.id]; }
                            setFlavorSelections(ns);
                          }}
                          onContextMenu={(e) => { e.preventDefault(); if (count > 0) { const ns = { ...flavorSelections }; ns[pf.flavor.id] = count - 1; if (ns[pf.flavor.id] === 0) delete ns[pf.flavor.id]; setFlavorSelections(ns); } }}
                          className={`relative p-2.5 rounded-lg font-semibold text-xs transition-all duration-300 min-h-[50px] ${isSelected ? `${gradientClass} text-white shadow-lg scale-105` : maxReached ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:shadow-md hover:scale-105 active:scale-95'}`}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5 h-full">
                            {pf.flavor.emoji && <span className="text-lg">{pf.flavor.emoji}</span>}
                            <span className="leading-tight text-center line-clamp-2 text-[10px] sm:text-xs font-medium">{pf.flavor.name}</span>
                            {isSelected && (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-white text-primary rounded-full text-xs font-bold">{count}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center leading-tight pb-3">Clique para adicionar • Toque longo para remover</p>
                </div>
              )}
            </div>

            {/* Footer Desktop */}
            <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-sm text-gray-500">{priceInfo.units} {priceInfo.units === 1 ? 'unidade' : 'unidades'}</span>
                  {priceInfo.discount > 0 && <span className="ml-2 text-xs text-green-600 font-semibold">Economia: {formatPrice(priceInfo.totalWithoutDiscount - priceInfo.finalPrice)}</span>}
                </div>
                <div className="text-right">
                  {priceInfo.discount > 0 && <span className="text-sm text-gray-400 line-through mr-2">{formatPrice(priceInfo.totalWithoutDiscount)}</span>}
                  <span className="text-xl font-bold text-gray-900">{formatPrice(priceInfo.finalPrice)}</span>
                </div>
              </div>
              {!canAddToCart && !isOutOfStock && needsFlavors && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 text-center font-medium">👆 Selecione {priceInfo.units - totalSelected} sabor{priceInfo.units - totalSelected > 1 ? 'es' : ''} acima</p>
                </div>
              )}
              <button onClick={handleAddToCart} disabled={!canAddToCart}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${canAddToCart ? 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed text-gray-500'}`}>
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? 'Produto Esgotado' : canAddToCart ? 'Adicionar ao Carrinho' : `Selecione ${priceInfo.units - totalSelected} sabor${priceInfo.units - totalSelected > 1 ? 'es' : ''}`}
              </button>
              {!isOutOfStock && (
                <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="font-medium">4.9</span></span>
                  <span>•</span><span>Compra segura</span><span>•</span><span>Clientes verificados</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showImageModal && (
        <ImageModal
          imageUrl={productImages[currentImageIndex] || product.image_url}
          imageName={product.name}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </Portal>
  );
}
