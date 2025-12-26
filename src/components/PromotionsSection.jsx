import { useState, useEffect } from 'react';
import { Sparkles, Tag, TrendingUp } from 'lucide-react';
import ProductCard from './ProductCard';
import { promotionBannerService } from '../lib/supabase';

export default function PromotionsSection({ products, onProductClick, activeCategory }) {
  const [bannerSettings, setBannerSettings] = useState({
    title: '🎄 Promoções de Fim de Ano 🎅',
    subtitle: 'Celebre as festas com os melhores preços!',
    badge_text: '🎁 OFERTA NATAL',
    footer_text: '🎉 Aproveite as festas! Ofertas especiais de fim de ano',
    is_active: true
  });
  const [loading, setLoading] = useState(true);

  // Adiciona espaço incondicional (non-breaking space) após emojis
  const formatTextWithEmojis = (text) => {
    if (!text) return text;
    // Substitui espaço normal após emoji por espaço incondicional
    return text.replace(/([\u{1F300}-\u{1F9FF}])\s/gu, '$1\u00A0');
  };

  useEffect(() => {
    loadBannerSettings();
  }, []);

  const loadBannerSettings = async () => {
    try {
      const data = await promotionBannerService.getSettings();
      if (data) {
        setBannerSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do banner:', error);
      // Mantém valores padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Filtrar apenas produtos em promoção
  const promotionProducts = products.filter(product => product.em_promocao === true);

  // IMPORTANTE: Só mostrar o banner quando "TODOS" estiver selecionado
  // Se uma categoria específica estiver selecionada, não mostrar o banner
  // (os produtos em promoção continuarão aparecendo nas suas seções normais)
  if (
    activeCategory !== 'all' ||
    promotionProducts.length === 0 ||
    !bannerSettings.is_active ||
    loading
  ) {
    return null;
  }

  return (
    <section className="mb-12">
      {/* Header da Seção */}
      <div className="bg-gradient-to-r from-red-600 via-green-600 to-red-700 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl border-4 border-yellow-400">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 leading-tight">
                {formatTextWithEmojis(bannerSettings.title)}
              </h2>
              <p className="text-white/90 text-xs sm:text-sm leading-tight">
                {formatTextWithEmojis(bannerSettings.subtitle)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-full flex-shrink-0">
            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap">
              {promotionProducts.length} {promotionProducts.length === 1 ? 'Produto' : 'Produtos'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {promotionProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>

      {/* Footer da Seção */}
      <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 via-green-50 to-red-50 border-2 border-red-300 rounded-lg">
        <div className="flex items-center gap-2 sm:gap-3 justify-center text-center">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-bold text-red-600">{formatTextWithEmojis(bannerSettings.footer_text)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
