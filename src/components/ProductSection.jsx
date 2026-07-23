import ProductCard from './ProductCard';

export default function ProductSection({ title, products, onProductClick }) {
  return (
    <section className="mb-10">
      {/* Separador visual de categoria */}
      <div className="relative mb-5">
        <div className="flex items-center gap-3 px-4">
          <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-secondary rounded-full flex-shrink-0"></div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight uppercase">
            {title}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4 px-3 sm:px-4 auto-rows-fr">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>
    </section>
  );
}
