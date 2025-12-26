import { SlidersHorizontal, TrendingUp, ArrowDownNarrowWide, ArrowUpNarrowWide, Cloud, Sparkles, Grid3x3 } from 'lucide-react';
import { useState } from 'react';

export default function ProductFilters({ onSortChange, currentSort, onFlavorFilter, onPuffFilter, selectedFlavor, selectedPuff, availableFlavors, availablePuffs }) {
  const sortOptions = [
    { value: 'default', label: 'Padrão', icon: Grid3x3 },
    { value: 'best-sellers', label: 'Mais Vendidos', icon: TrendingUp },
    { value: 'price-low', label: 'Menor Preço', icon: ArrowDownNarrowWide },
    { value: 'price-high', label: 'Maior Preço', icon: ArrowUpNarrowWide },
  ];

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 shadow-md sticky top-[116px] md:top-[185px] z-20 backdrop-blur-sm bg-white/95 will-change-transform">
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-2">
        {/* Ordenação e Filtros em linha única */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botões de Ordenação */}
          <div className="flex items-center gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = currentSort === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botão de Filtros Avançados */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ml-auto flex-shrink-0 ${
              showFilters || selectedFlavor || selectedPuff
                ? 'bg-gradient-to-r from-secondary to-accent text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Filtros</span>
            {(selectedFlavor || selectedPuff) && (
              <span className="bg-white text-secondary rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0">
                {(selectedFlavor ? 1 : 0) + (selectedPuff ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-4 animate-fadeIn">
            {/* Filtro de Sabores */}
            {availableFlavors && availableFlavors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-gray-800">
                    Sabor
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-200">
                  <button
                    onClick={() => onFlavorFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      !selectedFlavor
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {availableFlavors.map((flavor) => (
                    <button
                      key={flavor}
                      onClick={() => onFlavorFilter(selectedFlavor === flavor ? null : flavor)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                        selectedFlavor === flavor
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {flavor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro de Puffs */}
            {availablePuffs && availablePuffs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-gray-800">
                    Puffs
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-200">
                  <button
                    onClick={() => onPuffFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      !selectedPuff
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {availablePuffs.map((puff) => (
                    <button
                      key={puff}
                      onClick={() => onPuffFilter(selectedPuff === puff ? null : puff)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                        selectedPuff === puff
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {puff.toLocaleString()} Puffs
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Limpar Filtros */}
            {(selectedFlavor || selectedPuff) && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    onFlavorFilter(null);
                    onPuffFilter(null);
                  }}
                  className="px-6 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-all hover:shadow-md"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
