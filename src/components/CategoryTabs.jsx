import { useState } from 'react';

export default function CategoryTabs({ categories, onCategoryChange }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    onCategoryChange(category);
  };

  return (
    <div className="bg-white border-b shadow-md sticky top-[75px] md:top-[115px] z-30 backdrop-blur-sm bg-white/95 will-change-transform">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="flex gap-0.5 sm:gap-1 md:gap-2 justify-center items-center overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-full whitespace-nowrap text-[10px] sm:text-xs md:text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
