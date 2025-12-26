import { Zap, TrendingUp } from 'lucide-react';
import ProductCard from './ProductCard';

export default function FeaturedProducts({ products, onProductClick }) {
  // Filtrar apenas produtos marcados como destaque
  const featuredProducts = products.filter(product => product.is_featured);

  // Se não houver produtos em destaque, não renderiza nada
  if (featuredProducts.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Header da Seção */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 mx-2 sm:mx-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
                🔥 Promoções Imperdíveis
              </h2>
              <p className="text-white text-opacity-90 text-xs sm:text-sm mt-1">
                Ofertas especiais selecionadas para você
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">
              {featuredProducts.length} {featuredProducts.length === 1 ? 'Produto' : 'Produtos'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Produtos em Destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-4 auto-rows-fr">
        {featuredProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onClick={() => onProductClick(product)}
            isFeatured={true}
          />
        ))}
      </div>
    </section>
  );
}
