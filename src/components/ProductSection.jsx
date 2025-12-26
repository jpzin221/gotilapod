import ProductCard from './ProductCard';

export default function ProductSection({ title, products, onProductClick }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 px-4">
        {title}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-4 auto-rows-fr">
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
