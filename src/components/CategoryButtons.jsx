export default function CategoryButtons({ categories, activeCategory, onCategoryChange }) {
    // Check if category is Gorila Bolador
    const isBoladorCategory = (category) => {
        return category.slug === 'gorila-bolador' || category.name.toLowerCase().includes('bolador');
    };

    return (
        <div className="bg-white border-b shadow-md sticky top-[75px] md:top-[115px] z-30 backdrop-blur-sm bg-white/95 will-change-transform">
            <div className="max-w-7xl mx-auto px-2 sm:px-3 py-3 sm:py-4">
                <div className="flex gap-0.5 sm:gap-1 md:gap-2 justify-center items-center overflow-x-auto scrollbar-hide">
                    {/* Botão TODOS */}
                    <button
                        onClick={() => onCategoryChange('all')}
                        className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-full whitespace-nowrap text-[10px] sm:text-xs md:text-sm font-semibold transition-all duration-200 flex-shrink-0 ${activeCategory === 'all'
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                            }`}
                    >
                        TODOS
                    </button>

                    {/* Categorias do banco */}
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => onCategoryChange(category.id)}
                            className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-full whitespace-nowrap text-[10px] sm:text-xs md:text-sm font-semibold transition-all duration-200 flex-shrink-0 ${activeCategory === category.id
                                    ? isBoladorCategory(category)
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg scale-105'
                                        : 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105'
                                    : isBoladorCategory(category)
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:shadow-md border border-amber-300'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                }`}
                        >
                            {isBoladorCategory(category) && '🎯 '}
                            {category.name.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
