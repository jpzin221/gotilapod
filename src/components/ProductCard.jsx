import { Star, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useCallback } from 'react';
import { promotionBannerService } from '../lib/supabase';
import QuickAddModal from './QuickAddModal';

export default function ProductCard({ product, onClick }) {
  const { addToCart } = useCart();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [promotionBadgeText, setPromotionBadgeText] = useState('🎁 OFERTA NATAL');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productImages = (product.images && Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.image_url ? [product.image_url] : []);

  const nextImage = useCallback((e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % productImages.length);
  }, [productImages.length]);

  const prevImage = useCallback((e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length);
  }, [productImages.length]);

  // Buscar texto do badge de promoção
  useEffect(() => {
    const loadPromotionBadge = async () => {
      try {
        const settings = await promotionBannerService.getSettings();
        if (settings?.badge_text) {
          setPromotionBadgeText(settings.badge_text);
        }
      } catch (error) {
        console.error('Erro ao carregar badge de promoção:', error);
        // Mantém valor padrão
      }
    };

    if (product.em_promocao) {
      loadPromotionBadge();
    }
  }, [product.em_promocao]);

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Calcular preço original automaticamente se não existir mas tiver badge de promoção
  const getOriginalPrice = () => {
    // Validar se o preço principal é válido
    const currentPrice = parseFloat(product.price);
    if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
      return null;
    }

    // Se já tem original_price no banco, usar ele
    const origPrice = parseFloat(product.original_price);
    if (origPrice && !isNaN(origPrice) && origPrice > currentPrice) {
      return origPrice;
    }

    // Se tem originalPrice (formato antigo), usar ele
    const oldOrigPrice = parseFloat(product.originalPrice);
    if (oldOrigPrice && !isNaN(oldOrigPrice) && oldOrigPrice > currentPrice) {
      return oldOrigPrice;
    }

    // Se tem badge de PROMOÇÃO, calcular desconto de 15%
    if (product.badge && product.badge.toUpperCase().includes('PROMOÇÃO')) {
      return currentPrice / 0.85; // Simula 15% de desconto
    }

    return null;
  };

  const originalPrice = getOriginalPrice();

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Evita abrir o modal do produto ao clicar no botão

    // Não adicionar se estiver esgotado
    if (product.stock_quantity === 0) {
      return;
    }

    // Abrir modal de adição rápida para escolher sabor e quantidade
    setShowQuickAdd(true);
  };

  const isOutOfStock = product.stock_quantity === 0;

  const toggleDescription = (e) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar na descrição
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 border-gray-100 transition-all duration-300 overflow-hidden group flex flex-col h-full ${isOutOfStock
        ? 'opacity-75 cursor-default'
        : 'hover:border-primary hover:shadow-2xl cursor-pointer'
        }`}
      onClick={isOutOfStock ? undefined : onClick}
    >
      {/* Imagem - mais alta no mobile para melhor visualização */}
      <div className="relative aspect-[3/4] sm:aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 overflow-hidden">
        {/* Container de Badges - Hierarquia clara e sem duplicação */}
        <div className="absolute top-2 left-2 right-2 z-[5] flex flex-col sm:flex-row sm:justify-between gap-1.5">
          <div className="flex flex-col gap-1.5">
            {/* HIERARQUIA DE BADGES (ordem de prioridade):
                1. Badge de Promoção (mais importante - chama atenção)
                2. Badge Principal (categoria/destaque)
                Nunca mostrar ambos para evitar poluição visual
            */}

            {/* Badge de Promoção - PRIORIDADE MÁXIMA */}
            {product.em_promocao ? (
              <div className="bg-gradient-to-r from-red-600 to-green-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce border-2 border-yellow-400 whitespace-nowrap w-fit">
                {promotionBadgeText}
              </div>
            ) : (
              /* Badge Principal - só aparece se NÃO estiver em promoção */
              product.badge && (() => {
                const badgeColor = product.badge_color || product.badgeColor || 'purple';
                const isCustomColor = badgeColor.startsWith('#');
                const gradientMap = {
                  'purple': 'linear-gradient(to right, #8B5CF6, #6366F1)',
                  'red': 'linear-gradient(to right, #EF4444, #EC4899)',
                  'gold': 'linear-gradient(to right, #F59E0B, #F97316)',
                  'green': 'linear-gradient(to right, #10B981, #059669)',
                  'blue': 'linear-gradient(to right, #3B82F6, #2563EB)',
                  'pink': 'linear-gradient(to right, #EC4899, #DB2777)'
                };
                return (
                  <div
                    className="text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap w-fit"
                    style={{ background: isCustomColor ? badgeColor : (gradientMap[badgeColor] || gradientMap['purple']) }}
                  >
                    {product.badge}
                  </div>
                );
              })()
            )}
          </div>

          {/* Alerta de Estoque Baixo - sempre no canto direito */}
          {product.stock_quantity > 0 && product.stock_quantity < (product.low_stock_threshold || 5) && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse whitespace-nowrap w-fit">
              🔥 Últimas unidades!
            </div>
          )}
        </div>

        {/* Sem Estoque */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[5] rounded-lg">
            <span className="text-white font-bold text-sm sm:text-base">Esgotado</span>
          </div>
        )}

        {/* Carousel de Imagens */}
        <div className="relative w-full h-full">
          {productImages.length > 0 ? (
            <>
              <img
                src={productImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {productImages.length > 1 && (
                <>
                  <button onClick={prevImage}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-[6]">
                    <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button onClick={nextImage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-[6]">
                    <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-[6]">
                    {productImages.map((_, i) => (
                      <div key={i} className={`rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-3 h-2' : 'bg-white/50 w-2 h-2'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Star className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>
      </div>

      {/* Informações do produto */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow">
        {/* Título - 2 linhas máximo compacto */}
        <h3 className="font-bold text-gray-800 mb-1.5 line-clamp-2 text-sm sm:text-base leading-tight min-h-[1.5rem] sm:min-h-[1.75rem]">
          {product.name}
        </h3>

        {/* Rating - Altura compacta */}
        <div className="min-h-[1rem] mb-1.5">
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm font-semibold">{product.rating}</span>
              <span className="text-xs text-gray-500">({product.reviews})</span>
            </div>
          )}
        </div>

        {/* Informação de Caixa OU Destaque do Produto - Altura Mínima Reduzida */}
        {product.units_per_box && product.units_per_box > 0 ? (
          // Card com informação de caixa fechada
          <div className="mb-2 p-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg min-h-[2.75rem]">
            <div className="text-xs font-bold text-blue-800 flex items-center gap-1">
              <span>📦</span>
              <span>{product.units_per_box} unidades</span>
            </div>
            {product.puff_count && (
              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                {product.puff_count.toLocaleString()} Puffs cada
              </div>
            )}
            {product.box_discount_percent > 0 && (
              <div className="text-[10px] text-green-700 font-semibold mt-0.5">
                Economize {product.box_discount_percent}%
              </div>
            )}
          </div>
        ) : (
          // Card com informações destacadas para produtos sem caixa
          <div className="mb-2 space-y-1 min-h-[2.75rem]">
            {/* Informação de Puffs */}
            {product.puff_count && (
              <div className="p-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💨</span>
                  <span className="text-xs font-bold text-purple-800">
                    {product.puff_count.toLocaleString()} Puffs
                  </span>
                </div>
              </div>
            )}

            {/* Badge de Destaque - Alterna entre diferentes estilos */}
            {!product.puff_count && (
              <div className="p-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">⭐</span>
                    <span className="text-xs font-bold text-green-800">
                      Produto Premium
                    </span>
                  </div>
                  <span className="text-[10px] text-green-600 font-semibold">
                    Alta qualidade
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Espaçador */}
        <div className="flex-grow"></div>

        {/* Preço e botão - sempre no final */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            {originalPrice && originalPrice > product.price && !isNaN(originalPrice) && !isNaN(product.price) && (
              <>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                    {Math.round(((originalPrice - parseFloat(product.price)) / originalPrice) * 100)}%&nbsp;OFF
                  </span>
                </div>
              </>
            )}
            <span className="text-base sm:text-xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`${isOutOfStock
              ? 'bg-gray-400 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl'
              } text-white p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 flex-shrink-0`}
            title={isOutOfStock ? 'Produto esgotado' : 'Adicionar ao carrinho'}
          >
            <Plus className={`w-4 h-4 sm:w-5 sm:h-5 ${isOutOfStock ? 'opacity-70' : ''}`} />
          </button>
        </div>
      </div>

      {/* Modal de Adição Rápida */}
      <QuickAddModal
        product={product}
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </div>
  );
}
