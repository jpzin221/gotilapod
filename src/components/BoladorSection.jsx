import BoladorCard from './BoladorCard';

export default function BoladorSection({ products }) {
    if (!products || products.length === 0) return null;

    return (
        <section className="mb-8 px-4">
            {/* Header compacto */}
            <div className="max-w-7xl mx-auto mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-xl font-bold text-gray-800">Gorila Bolador</h2>
                <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                    PREMIUM
                </span>
            </div>

            {/* Grid compacto - máximo 2 colunas */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    {products.map((product) => (
                        <BoladorCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
