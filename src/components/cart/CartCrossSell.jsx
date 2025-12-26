import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { productService } from '../../lib/supabase';

/**
 * Cross-sell minimalista para fundo de funil
 * - Apenas UM bloco de sugestão
 * - Mostra sabores ao clicar em Adicionar
 * - Layout vertical compacto
 */
export default function CartCrossSell() {
    const {
        cartItems,
        hasFreeShipping,
        getRemainingForFreeShipping,
        addToCart
    } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFlavors, setShowFlavors] = useState(false);
    const [selectedFlavor, setSelectedFlavor] = useState(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await productService.getAll();
                setProducts(data || []);
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
            } finally {
                setLoading(false);
            }
        };

        if (cartItems.length > 0) {
            loadProducts();
        }
    }, [cartItems.length]);

    // Resetar quando muda o carrinho
    useEffect(() => {
        setShowFlavors(false);
        setSelectedFlavor(null);
    }, [cartItems.length]);

    if (cartItems.length === 0 || loading || products.length === 0) return null;

    const hasFreeShippingNow = hasFreeShipping();
    const remainingValue = getRemainingForFreeShipping();
    const cartProductIds = cartItems.map(item => item.id);

    // Encontrar UMA sugestão ideal
    const getSuggestion = () => {
        const available = products.filter(p =>
            !cartProductIds.includes(p.id) && p.is_active
        );

        if (available.length === 0) return null;

        if (!hasFreeShippingNow && remainingValue > 0) {
            const maxPrice = remainingValue * 1.05;
            const suggestion = available
                .filter(p => p.price <= maxPrice)
                .sort((a, b) => Math.abs(remainingValue - a.price) - Math.abs(remainingValue - b.price))[0];

            return suggestion || available.sort((a, b) => a.price - b.price)[0];
        } else {
            return available.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
        }
    };

    const suggestion = getSuggestion();
    if (!suggestion) return null;

    const formatPrice = (price) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const availableFlavors = suggestion.flavors || [];
    const hasFlavors = availableFlavors.length > 0;

    const handleAddClick = () => {
        if (hasFlavors && !selectedFlavor) {
            setShowFlavors(true);
        } else {
            handleAddToCart();
        }
    };

    const handleAddToCart = () => {
        addToCart({
            id: suggestion.id,
            name: suggestion.name,
            price: suggestion.price,
            image: suggestion.image_url || '/images/placeholder.webp',
            description: suggestion.description,
            quantity: 1,
            selectedFlavors: selectedFlavor ? [selectedFlavor] : undefined
        });
        setShowFlavors(false);
        setSelectedFlavor(null);
    };

    const handleSelectFlavor = (flavorName) => {
        setSelectedFlavor(flavorName);
    };

    const wouldGetFreeShipping = !hasFreeShippingNow && suggestion.price >= remainingValue;

    return (
        <div className="bg-gray-50 border-y border-gray-200 py-2 px-3">
            {/* Linha principal: sugestão + botão */}
            <div className="flex items-center gap-2">
                {/* Imagem mini */}
                <img
                    src={suggestion.image_url || '/images/placeholder.webp'}
                    alt={suggestion.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                />

                {/* Info compacta */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 leading-tight truncate">
                        {!hasFreeShippingNow ? (
                            wouldGetFreeShipping ? '🎁 Adicione e ganhe frete grátis:' : '➕ Você também pode gostar:'
                        ) : (
                            '➕ Aproveite também:'
                        )}
                    </p>
                    <p className="text-xs font-medium text-gray-800 truncate">
                        {suggestion.name} • <span className="text-primary font-bold">{formatPrice(suggestion.price)}</span>
                    </p>
                </div>

                {/* Botão compacto */}
                <button
                    onClick={handleAddClick}
                    className="flex-shrink-0 bg-primary hover:bg-secondary text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                    {showFlavors ? (
                        <>
                            <X className="w-3 h-3" />
                            Fechar
                        </>
                    ) : (
                        <>
                            <Plus className="w-3 h-3" />
                            {hasFlavors ? 'Escolher' : 'Adicionar'}
                        </>
                    )}
                </button>
            </div>

            {/* Painel de Sabores */}
            {showFlavors && hasFlavors && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">
                        Escolha um sabor:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {availableFlavors.map((pf) => (
                            <button
                                key={pf.flavor.id}
                                onClick={() => handleSelectFlavor(pf.flavor.name)}
                                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${selectedFlavor === pf.flavor.name
                                        ? 'bg-primary text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:border-primary'
                                    }`}
                            >
                                {pf.flavor.emoji && <span className="mr-1">{pf.flavor.emoji}</span>}
                                {pf.flavor.name}
                            </button>
                        ))}
                    </div>

                    {/* Botão confirmar */}
                    {selectedFlavor && (
                        <button
                            onClick={handleAddToCart}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Adicionar {selectedFlavor}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
