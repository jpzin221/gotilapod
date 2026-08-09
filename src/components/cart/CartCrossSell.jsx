import { useState, useEffect, useRef } from 'react';
import { Plus, X, Check, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { productService } from '../../lib/supabase';

export default function CartCrossSell() {
    const { cartItems, hasFreeShipping, getRemainingForFreeShipping, addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFlavorModal, setShowFlavorModal] = useState(false);
    const [selectedFlavor, setSelectedFlavor] = useState(null);
    const bannerRef = useRef(null);
    const hasScrolledRef = useRef(false);

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
        if (cartItems.length > 0) loadProducts();
    }, [cartItems.length]);

    useEffect(() => {
        setShowFlavorModal(false);
        setSelectedFlavor(null);
        hasScrolledRef.current = false;
    }, [cartItems.length]);

    // Auto-scroll quando o banner aparece
    useEffect(() => {
        if (bannerRef.current && !hasScrolledRef.current && !loading && products.length > 0) {
            hasScrolledRef.current = true;
            setTimeout(() => {
                bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [loading, products.length]);

    if (cartItems.length === 0 || loading || products.length === 0) return null;

    const hasFreeShippingNow = hasFreeShipping();
    const remainingValue = getRemainingForFreeShipping();
    const cartProductIds = cartItems.map(item => item.id);

    // Lógica: encontrar EXATAMENTE UM produto que feche o valor do frete gratis
    const getSuggestion = () => {
        const available = products.filter(p => !cartProductIds.includes(p.id) && p.is_active);
        if (available.length === 0) return null;

        if (!hasFreeShippingNow && remainingValue > 0) {
            // Pegar produto com preco >= valor restante (mais proximo possivel)
            const candidates = available
                .filter(p => p.price >= remainingValue)
                .sort((a, b) => a.price - b.price);

            // Se nao achar nenhum >=, pegar o mais caro disponivel
            return candidates[0] || available.sort((a, b) => b.price - a.price)[0];
        }

        // Ja tem frete gratis - mostrar mais vendido
        return available.sort((a, b) => (b.reviews || 0) - (a.reviews || 0))[0];
    };

    const suggestion = getSuggestion();
    if (!suggestion) return null;

    const formatPrice = (price) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const availableFlavors = suggestion.flavors || [];
    const hasFlavors = availableFlavors.length > 0;
    const wouldGetFreeShipping = !hasFreeShippingNow && suggestion.price >= remainingValue;

    const getImageUrl = (product) => {
        return product.image_url || product.image || '/images/placeholder.svg';
    };

    const handleAddClick = () => {
        if (hasFlavors) {
            setSelectedFlavor(null);
            setShowFlavorModal(true);
        } else {
            addToCart({
                id: suggestion.id,
                name: suggestion.name,
                price: suggestion.price,
                image_url: getImageUrl(suggestion),
                description: suggestion.description,
                quantity: 1
            });
        }
    };

    const handleConfirmFlavor = () => {
        if (!selectedFlavor) return;
        addToCart({
            id: suggestion.id,
            name: suggestion.name,
            price: suggestion.price,
            image_url: getImageUrl(suggestion),
            description: suggestion.description,
            quantity: 1,
            selectedFlavors: [selectedFlavor]
        });
        setShowFlavorModal(false);
        setSelectedFlavor(null);
    };

    return (
        <>
            {/* Banner de sugestao */}
            <div ref={bannerRef} className="px-3 py-3">
                <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-3 border border-primary/20">
                    <img
                        src={getImageUrl(suggestion)}
                        alt={suggestion.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = '/images/placeholder.svg'; }}
                    />
                    <div className="flex-1 min-w-0">
                        {wouldGetFreeShipping ? (
                            <>
                                <p className="text-[11px] text-primary font-bold leading-tight">
                                    🎁 Adicione e ganhe frete gratis!
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Falta {formatPrice(remainingValue)} • Este produto fecha!
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    ➕ Voce tambem pode gostar:
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Frete gratis ja conquistado
                                </p>
                            </>
                        )}
                        <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">
                            {suggestion.name}
                        </p>
                        <p className="text-sm font-bold text-primary">{formatPrice(suggestion.price)}</p>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="flex-shrink-0 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-transform"
                    >
                        <Plus className="w-4 h-4" />
                        {hasFlavors ? 'Escolher' : 'Adicionar'}
                    </button>
                </div>
            </div>

            {/* Modal de Selecao de Sabores */}
            {showFlavorModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center" style={{ zIndex: 99999999 }}>
                    <div className="bg-white w-full max-w-md rounded-t-3xl animate-slide-up">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getImageUrl(suggestion)}
                                    alt={suggestion.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                    onError={(e) => { e.target.src = '/images/placeholder.svg'; }}
                                />
                                <div>
                                    <p className="text-xs text-gray-500">Escolha o sabor</p>
                                    <p className="text-sm font-bold text-gray-800">{suggestion.name}</p>
                                    <p className="text-sm font-bold text-primary">{formatPrice(suggestion.price)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowFlavorModal(false); setSelectedFlavor(null); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-4 max-h-[50vh] overflow-y-auto">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 font-semibold">
                                Selecione um sabor:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {availableFlavors.map((pf) => (
                                    <button
                                        key={pf.flavor.id}
                                        onClick={() => setSelectedFlavor(pf.flavor.name)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                                            selectedFlavor === pf.flavor.name
                                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="text-lg">{pf.flavor.emoji || '🍃'}</span>
                                        <span className={`text-sm font-medium flex-1 ${
                                            selectedFlavor === pf.flavor.name ? 'text-primary' : 'text-gray-700'
                                        }`}>
                                            {pf.flavor.name}
                                        </span>
                                        {selectedFlavor === pf.flavor.name && (
                                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={handleConfirmFlavor}
                                disabled={!selectedFlavor}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                    selectedFlavor
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20 active:scale-[0.98]'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {selectedFlavor ? `Adicionar ${selectedFlavor} ao carrinho` : 'Selecione um sabor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
