import { Zap, CheckCircle, Package } from 'lucide-react';
import { storeInfo } from '../data/products';

/**
 * Bloco de Proposta de Valor - Urbano Confiante
 * Comunica estilo de vida em 3 segundos
 * Tom: direto, urbano, confiante
 */
export default function ValueProposition() {
    const rating = storeInfo.rating || 4.9;

    const pillars = [
        {
            icon: Zap,
            label: 'Rápido'
        },
        {
            icon: CheckCircle,
            label: 'Original'
        },
        {
            icon: Package,
            label: 'Discreto'
        }
    ];

    return (
        <div className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
                {/* Pilares - Ícones minimalistas */}
                <div className="flex justify-center items-center gap-6 sm:gap-10 mb-3">
                    {pillars.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" strokeWidth={2} />
                            <span className="text-xs sm:text-sm font-medium text-white/90">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Linha de posicionamento - Confiante, direto */}
                <div className="text-center">
                    <p className="text-[11px] sm:text-xs text-white/60 tracking-wide uppercase">
                        Escolha adulta • Entrega urbana • Sem enrolação
                    </p>
                </div>

                {/* Badge de confiança - Discreto */}
                <div className="flex justify-center mt-3">
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                        <span className="text-amber-400 text-xs font-bold">{rating}</span>
                        <span className="text-[10px] text-white/50">★ avaliação</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
