import { Search } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Pesquise no cardápio"
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="mt-2 sm:mt-3 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            🎉 <span className="font-semibold text-primary">Aproveite</span> nossas promoções! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
