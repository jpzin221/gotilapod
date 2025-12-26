import { useNavigate } from 'react-router-dom';

export default function BoladorCard({ product }) {
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const handleClick = () => {
        navigate('/produto/gorila-bolador');
    };

    // Preço mínimo (modelo P)
    const startingPrice = product.price_small || product.price || 19.99;

    return (
        <div
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-amber-500/30 overflow-hidden group cursor-pointer transition-all duration-500 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/20 transform hover:-translate-y-1"
            onClick={handleClick}
        >
            {/* Imagem Hero */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                {/* Badge Premium */}
                <div className="absolute top-3 left-3 z-10">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        ✨ Edição Premium
                    </div>
                </div>

                {/* Badge Lançamento */}
                <div className="absolute top-3 right-3 z-10">
                    <div className="bg-white/90 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-full">
                        🆕 NOVO
                    </div>
                </div>

                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
            </div>

            {/* Informações */}
            <div className="p-5">
                {/* Nome */}
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                    {product.name}
                </h3>

                {/* Descrição curta */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    Design exclusivo • Acabamento artesanal
                </p>

                {/* Preço - "A partir de" */}
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xs text-gray-500">A partir de</span>
                    <span className="text-2xl font-bold text-amber-400">
                        {formatPrice(startingPrice)}
                    </span>
                </div>

                {/* Botão Ver Detalhes (sem botão +) */}
                <button
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-amber-500/30"
                >
                    Ver detalhes
                </button>
            </div>
        </div>
    );
}
