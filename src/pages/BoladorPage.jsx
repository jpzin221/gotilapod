import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MessageCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import { storeInfo } from '../data/products';

export default function BoladorPage() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState('P');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const DRIVE_URL = 'https://drive.google.com/drive/mobile/folders/1aFwDFVyYBzHlN0gvHadkcPhZtsZoDc7Z';

    useEffect(() => {
        loadProduct();
    }, []);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const products = await productService.getAll();
            const bolador = products.find(p => p.is_bolador === true);
            setProduct(bolador);
        } catch (err) {
            console.error('Error loading bolador product:', err);
        } finally {
            setLoading(false);
        }
    };

    // Obter array de imagens do produto (suporta campo images ou image única)
    const getProductImages = () => {
        if (!product) return [];

        // Se o produto tem um array de imagens (campo images como JSON)
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images;
        }

        // Se images é uma string JSON, parse
        if (product.images && typeof product.images === 'string') {
            try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) { }
        }

        // Fallback para imagem única
        if (product.image) {
            return [product.image];
        }

        return [];
    };

    const images = getProductImages();

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    const getCurrentPrice = () => {
        if (!product) return 0;
        return selectedModel === 'P' ? (product.price_small || 19.99) : (product.price_large || 39.99);
    };

    const handleAddToCart = () => {
        if (!product) return;

        addToCart({
            ...product,
            quantity: 1,
            selectedModel: selectedModel,
            unitPrice: getCurrentPrice(),
            totalPrice: getCurrentPrice(),
            name: `${product.name} - Modelo ${selectedModel}`,
        });

        navigate('/');
    };

    const openWhatsApp = () => {
        const message = encodeURIComponent(
            `Olá! Tenho interesse no Gorila Bolador (Modelo ${selectedModel}) para compra em atacado.`
        );
        window.open(`https://wa.me/5519982530057?text=${message}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header storeInfo={storeInfo} />
                <div className="pt-[120px] flex items-center justify-center min-h-[60vh]">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header storeInfo={storeInfo} />
                <div className="pt-[120px] text-center py-12">
                    <p className="text-gray-500 text-lg">Produto não encontrado</p>
                    <Link to="/" className="text-amber-600 hover:underline mt-4 inline-block">
                        Voltar à loja
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header storeInfo={storeInfo} />

            {/* Conteúdo com padding para header fixo */}
            <div className="pt-[100px] sm:pt-[120px] pb-24">
                {/* Voltar */}
                <div className="max-w-4xl mx-auto px-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Voltar à loja</span>
                    </button>
                </div>

                <div className="max-w-4xl mx-auto px-4">
                    {/* Hero Section */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Carrossel de Imagens */}
                            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                                {/* Badge */}
                                <div className="absolute top-4 left-4 z-10">
                                    <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                                        ✨ Edição Premium
                                    </div>
                                </div>

                                {/* Imagem Principal */}
                                {images.length > 0 && (
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-[280px] sm:max-h-[300px] object-contain transition-opacity duration-300"
                                    />
                                )}

                                {/* Setas de Navegação (só aparecem se tem mais de 1 imagem) */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300"
                                        >
                                            <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300"
                                        >
                                            <ChevronRight className="w-6 h-6 text-white" />
                                        </button>
                                    </>
                                )}

                                {/* Indicadores (dots) */}
                                {images.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentImageIndex
                                                    ? 'bg-amber-500 w-6'
                                                    : 'bg-white/50 hover:bg-white/80'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Contador de imagens */}
                                {images.length > 1 && (
                                    <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-6 md:p-8 flex flex-col">
                                {/* Badge LANÇAMENTO */}
                                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
                                    🆕 LANÇAMENTO
                                </div>

                                {/* Nome */}
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                    {product.name}
                                </h1>

                                {/* Frase de posicionamento */}
                                <p className="text-gray-600 text-base mb-4">
                                    Pré-bolado premium para quem valoriza qualidade e design.
                                </p>

                                {/* 3 bullets de benefícios (máximo) */}
                                <div className="text-gray-700 text-sm leading-relaxed mb-6 space-y-2">
                                    <p className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">✓</span>
                                        Acabamento artesanal de alta qualidade
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">✓</span>
                                        Design exclusivo em diversas cores
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">✓</span>
                                        Para adultos que fazem escolhas conscientes
                                    </p>
                                </div>

                                {/* Espaçador */}
                                <div className="flex-grow" />

                                {/* Preço atual */}
                                <div className="mt-auto">
                                    <p className="text-sm text-gray-500 mb-1">Modelo {selectedModel}</p>
                                    <p className="text-3xl md:text-4xl font-bold text-amber-600">
                                        {formatPrice(getCurrentPrice())}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seleção de Modelo */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            Escolha o modelo
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Modelo P */}
                            <button
                                onClick={() => setSelectedModel('P')}
                                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${selectedModel === 'P'
                                    ? 'border-amber-500 bg-amber-50 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                {selectedModel === 'P' && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">P</p>
                                    <p className="text-sm text-gray-500 mb-2">Pequeno Premium</p>
                                    <p className="text-xl font-bold text-amber-600">
                                        {formatPrice(product.price_small || 19.99)}
                                    </p>
                                </div>
                            </button>

                            {/* Modelo G */}
                            <button
                                onClick={() => setSelectedModel('G')}
                                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${selectedModel === 'G'
                                    ? 'border-amber-500 bg-amber-50 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                {selectedModel === 'G' && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-1">G</p>
                                    <p className="text-sm text-gray-500 mb-2">Grande Premium</p>
                                    <p className="text-xl font-bold text-amber-600">
                                        {formatPrice(product.price_large || 39.99)}
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Info atacado */}
                        <p className="text-xs text-gray-500 text-center">
                            Atacado disponível a partir de 20 unidades
                        </p>
                    </div>

                    {/* Ver Cores no Drive */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 mb-8 text-center">
                        <h2 className="text-lg font-bold text-white mb-3">
                            Modelos e cores disponíveis
                        </h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Escolha o modelo desejado e volte para finalizar
                        </p>

                        <a
                            href={DRIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/30"
                        >
                            <span>Ver modelos e cores disponíveis</span>
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </div>

                    {/* Fluxo de Compra */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            Como comprar
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Escolha o modelo (P ou G)</p>
                                    <p className="text-sm text-gray-500">Selecione o tamanho desejado acima</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Veja as cores no Drive</p>
                                    <p className="text-sm text-gray-500">Confira as opções disponíveis</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Finalize a compra</p>
                                    <p className="text-sm text-gray-500">Informe o modelo/cor escolhido no checkout</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Atacado */}
                    <div className="text-center mb-8">
                        <button
                            onClick={openWhatsApp}
                            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-green-500 hover:text-green-600 transition-all duration-300"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>Comprar em atacado</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Mínimo 20 unidades • Preços especiais
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Fixo - Botão de Compra + Prova Social */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Botão e Preço */}
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                            <p className="text-sm text-gray-500">Modelo {selectedModel}</p>
                            <p className="text-2xl font-bold text-amber-600">
                                {formatPrice(getCurrentPrice())}
                            </p>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 max-w-xs py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        >
                            Adicionar ao Carrinho
                        </button>
                    </div>

                    {/* Prova Social */}
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="text-amber-500">★★★★★</span>
                            <span>4.9/5</span>
                        </span>
                        <span className="w-px h-3 bg-gray-300" />
                        <span>+150 vendidos</span>
                        <span className="w-px h-3 bg-gray-300" />
                        <span className="flex items-center gap-1">
                            🔒 Compra segura
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
