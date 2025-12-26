import { useState, useEffect } from 'react';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Portal from './Portal';

export default function QuickAddModal({ product, isOpen, onClose }) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedFlavor, setSelectedFlavor] = useState(null);

    // Reset quando abrir
    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1);
            setSelectedFlavor(null);
        }
    }, [isOpen, product?.id]);

    if (!isOpen || !product) return null;

    const availableFlavors = product.flavors?.filter(pf => pf.flavor?.is_active !== false) || [];
    const hasFlavors = availableFlavors.length > 0;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    // Calcular desconto por quantidade
    const getDiscount = () => {
        if (quantity >= 5) return 12;
        if (quantity >= 3) return 8;
        if (quantity >= 2) return 5;
        return 0;
    };

    const discount = getDiscount();
    const baseTotal = product.price * quantity;
    const finalPrice = baseTotal * (1 - discount / 100);
    const savings = baseTotal - finalPrice;

    const canAdd = (!hasFlavors || selectedFlavor) && quantity > 0;

    const handleAdd = () => {
        if (!canAdd) return;

        // Criar array de sabores selecionados
        const selectedFlavorsArray = [];
        if (selectedFlavor) {
            for (let i = 0; i < quantity; i++) {
                selectedFlavorsArray.push(selectedFlavor.flavor.name);
            }
        }

        addToCart({
            ...product,
            quantity: quantity,
            selectedFlavors: selectedFlavorsArray.length > 0 ? selectedFlavorsArray : undefined,
            unitPrice: product.price,
            totalPrice: finalPrice
        });

        onClose();
    };

    const incrementQuantity = () => {
        if (quantity < (product.stock_quantity || 99)) {
            setQuantity(q => q + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(q => q - 1);
        }
    };

    return (
        <Portal>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm z-[99999]">
                <div
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header compacto */}
                    <div className="relative bg-gradient-to-r from-primary to-secondary p-3">
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 rounded-full p-1 transition"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="flex items-center gap-3 pr-8">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-14 h-14 rounded-lg object-cover bg-white"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
                                    {product.name}
                                </h3>
                                <p className="text-white/80 text-xs mt-0.5">
                                    {formatPrice(product.price)} / unidade
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4 space-y-4">
                        {/* Seletor de Sabor */}
                        {hasFlavors && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    🍃 Escolha o sabor:
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                                    {availableFlavors.map((pf) => (
                                        <button
                                            key={pf.flavor.id}
                                            onClick={() => setSelectedFlavor(pf)}
                                            className={`p-2 rounded-lg text-xs font-medium transition-all ${selectedFlavor?.flavor.id === pf.flavor.id
                                                    ? 'bg-primary text-white shadow-md scale-105'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            <span className="block text-base mb-0.5">{pf.flavor.emoji || '🍃'}</span>
                                            <span className="line-clamp-1">{pf.flavor.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seletor de Quantidade */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                📦 Quantidade:
                            </label>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={decrementQuantity}
                                    disabled={quantity <= 1}
                                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                                >
                                    <Minus className="w-5 h-5 text-gray-600" />
                                </button>

                                <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                                    {quantity}
                                </span>

                                <button
                                    onClick={incrementQuantity}
                                    disabled={quantity >= (product.stock_quantity || 99)}
                                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                                >
                                    <Plus className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Dica de desconto */}
                            {discount > 0 ? (
                                <p className="text-center text-xs text-green-600 font-semibold mt-2">
                                    🎉 {discount}% de desconto aplicado!
                                </p>
                            ) : quantity < 2 ? (
                                <p className="text-center text-xs text-gray-500 mt-2">
                                    💡 Compre 2+ e ganhe até 12% de desconto
                                </p>
                            ) : null}
                        </div>

                        {/* Resumo de preço */}
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total:</span>
                                <div className="text-right">
                                    {discount > 0 && (
                                        <span className="text-xs text-gray-400 line-through mr-2">
                                            {formatPrice(baseTotal)}
                                        </span>
                                    )}
                                    <span className="text-lg font-bold text-primary">
                                        {formatPrice(finalPrice)}
                                    </span>
                                </div>
                            </div>
                            {savings > 0 && (
                                <p className="text-xs text-green-600 text-right mt-1">
                                    Você economiza {formatPrice(savings)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Botão de adicionar */}
                    <div className="p-4 pt-0">
                        <button
                            onClick={handleAdd}
                            disabled={!canAdd}
                            className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${canAdd
                                    ? 'bg-primary hover:bg-primary/90 shadow-lg active:scale-[0.98]'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {hasFlavors && !selectedFlavor
                                ? 'Escolha um sabor'
                                : `Adicionar ao Carrinho`}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
        </Portal>
    );
}
