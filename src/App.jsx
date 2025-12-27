import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Instagram } from 'lucide-react';
import Header from './components/Header';
import ValueProposition from './components/ValueProposition';
import HeroSection from './components/HeroSection';
import CategoryButtons from './components/CategoryButtons';
import CategoryTabs from './components/CategoryTabs';
import SearchBar from './components/SearchBar';
import ProductSection from './components/ProductSection';
import ProductFilters from './components/ProductFilters';
import FeaturedProducts from './components/FeaturedProducts';
import PromotionsSection from './components/PromotionsSection';
import ReviewsSection from './components/ReviewsSection';
import Cart from './components/Cart';
import ProductModal from './components/ProductModal';
import Toast from './components/Toast';
import PixSessionBanner from './components/PixSessionBanner';
import FloatingCartButton from './components/FloatingCartButton';
import WhatsAppButton from './components/WhatsAppButton';
import InstagramButton from './components/InstagramButton';
import SocialProofNotification from './components/SocialProofNotification';
import BoladorSection from './components/BoladorSection';
import { useCart } from './context/CartContext';
import { useSiteConfig } from './context/SiteConfigContext';
import { storeInfo } from './data/products';
import { storeService, productService, categoryService } from './lib/supabase';

function App() {
  const { showToast, setShowToast, toastMessage, setIsCartOpen } = useCart();
  const { get } = useSiteConfig();
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // Para matching de nomes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [selectedPuff, setSelectedPuff] = useState(null);

  const handleRestorePixSession = () => {
    // Abrir o carrinho para continuar o pagamento
    setIsCartOpen(true);
  };

  useEffect(() => {
    loadBusinessHours();
    loadCategories();
    loadProducts();

    // Recarregar produtos quando a janela volta ao foco (garante dados atualizados)
    const handleFocus = () => {
      console.log('🔄 Janela voltou ao foco - recarregando produtos...');
      loadProducts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);;

  const loadBusinessHours = async () => {
    try {
      const settings = await storeService.getSettings();
      setBusinessHours(settings?.business_hours);
    } catch (err) {
      console.error('Error loading business hours:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setAllCategories(data || []); // Todas as categorias para matching de nomes
      setCategories(data.filter(cat => cat.is_active)); // Apenas ativas para filtros
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
      setAllCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  }, []);

  // Memoized: Produtos filtrados e ordenados
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      // Filtrar por categoria
      if (activeCategory !== 'all' && product.category_id !== activeCategory) return false;

      // Filtrar por busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!product.name.toLowerCase().includes(term) &&
          !product.description?.toLowerCase().includes(term)) return false;
      }

      // Filtrar por sabor
      if (selectedFlavor) {
        if (!product.flavors?.some(pf => pf.flavor?.name === selectedFlavor)) return false;
      }

      // Filtrar por puffs
      if (selectedPuff && product.puff_count !== selectedPuff) return false;

      return true;
    });

    // Ordenar
    if (sortBy === 'best-sellers') {
      result = [...result].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    } else if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, activeCategory, searchTerm, selectedFlavor, selectedPuff, sortBy]);

  // Memoized: Produtos em promoção
  const promotionProducts = useMemo(() => {
    return products.filter(product => {
      if (!product.em_promocao) return false;
      if (activeCategory !== 'TODOS' && product.category?.toUpperCase() !== activeCategory) return false;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedFlavor && !product.flavors?.some(pf => pf.flavor?.name === selectedFlavor)) return false;
      if (selectedPuff && product.puff_count !== selectedPuff) return false;
      return true;
    });
  }, [products, activeCategory, searchTerm, selectedFlavor, selectedPuff]);

  // Memoized: Sabores e puffs disponíveis
  const { availableFlavors, availablePuffs } = useMemo(() => {
    const productsForFilters = products.filter(product => {
      if (activeCategory !== 'all' && product.category_id !== activeCategory) return false;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    const flavors = [...new Set(
      productsForFilters.flatMap(p => p.flavors || []).map(pf => pf.flavor?.name).filter(Boolean)
    )].sort();

    const puffs = [...new Set(
      productsForFilters.map(p => p.puff_count).filter(count => count != null)
    )].sort((a, b) => a - b);

    return { availableFlavors: flavors, availablePuffs: puffs };
  }, [products, activeCategory, searchTerm]);

  // Memoized: Produtos agrupados por categoria
  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      // Usar allCategories para encontrar o nome (inclui inativas)
      const category = allCategories.find(c => c.id === product.category_id);
      const categoryName = category?.name || 'Sem Categoria';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {});
  }, [filteredProducts, allCategories]);

  // Ordenar categorias e esconder "Sem Categoria" no final (ou não exibir)
  const orderedCategories = useMemo(() => {
    const entries = Object.entries(groupedProducts);
    // Separar "Sem Categoria" do resto
    const semCategoria = entries.filter(([name]) => name === 'Sem Categoria');
    const outras = entries.filter(([name]) => name !== 'Sem Categoria');
    // Não exibir "Sem Categoria" no frontend público (apenas admin vê)
    return outras;
  }, [groupedProducts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header storeInfo={storeInfo} />

      {/* Conteúdo com padding para compensar header fixo */}
      <div className="pt-[120px] sm:pt-[160px]">
        {/* Bloco de Proposta de Valor - Responde "por que comprar aqui?" */}
        <ValueProposition />

        {/* Hero Section Centralizada */}
        <HeroSection
          businessHours={businessHours}
          storeLocation={storeInfo.location}
          deliveryRadius={storeInfo.delivery.radiusKm}
        />
      </div>

      {/* Botões de Categoria - FORA da div com padding para sticky funcionar */}
      <CategoryButtons
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Filtros de Ordenação */}
      <ProductFilters
        onSortChange={setSortBy}
        currentSort={sortBy}
        onFlavorFilter={setSelectedFlavor}
        onPuffFilter={setSelectedPuff}
        selectedFlavor={selectedFlavor}
        selectedPuff={selectedPuff}
        availableFlavors={availableFlavors}
        availablePuffs={availablePuffs}
      />

      <SearchBar onSearch={setSearchTerm} />

      <div>
        <main className="max-w-7xl mx-auto py-4 sm:py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-gray-500 text-lg mt-4">Carregando produtos...</p>
            </div>
          ) : (
            <>
              {/* Seção Gorila Bolador - Premium (sempre no topo) */}
              <BoladorSection
                products={products.filter(p => p.is_bolador === true)}
              />

              {/* Seção de Promoções (Produtos em Destaque) */}
              <FeaturedProducts
                products={filteredProducts.filter(p => !p.is_bolador)}
                onProductClick={handleProductClick}
              />

              {/* Seção de Promoções de Fim de Ano */}
              <PromotionsSection
                products={promotionProducts.filter(p => !p.is_bolador)}
                onProductClick={handleProductClick}
                activeCategory={activeCategory}
              />

              {/* Seções de Produtos por Categoria */}
              {orderedCategories.length > 0 ? (
                orderedCategories.map(([category, categoryProducts]) => (
                  <ProductSection
                    key={category}
                    title={category}
                    products={categoryProducts}
                    onProductClick={handleProductClick}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Nenhum produto encontrado 😔
                  </p>
                </div>
              )}
            </>
          )}
        </main>

        {/* Reviews */}
        <div className="max-w-7xl mx-auto">
          <ReviewsSection />
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-dark via-gray-900 to-dark text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            {/* Aviso de Idade */}
            <div className="bg-red-600 border-2 border-red-400 rounded-lg p-2 sm:p-3 md:p-4 mb-4 sm:mb-6 text-center">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2">⚠️ VENDA PROIBIDA PARA MENORES DE 18 ANOS</p>
              <p className="text-[10px] sm:text-xs md:text-sm leading-tight">
                Nossos produtos contêm nicotina, substância que causa dependência química.
                A venda é destinada exclusivamente para maiores de 18 anos.
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {get('site_name') || storeInfo.name}
              </h3>
              <p className="text-gray-400 mb-4">
                {get('site_slogan') || 'Vaporizadores e Pods de Qualidade'}
              </p>

              {/* Redes Sociais */}
              <div className="flex justify-center gap-4 mb-6">
                {get('instagram') && (
                  <a
                    href={`https://instagram.com/${get('instagram')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition transform hover:scale-105 shadow-lg"
                    title="Siga-nos no Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="font-semibold">@{get('instagram')}</span>
                  </a>
                )}
              </div>

              {/* Dados da Empresa */}
              <div className="border-t border-gray-700 pt-6 mt-6">
                <p className="text-xs text-gray-500 mb-2">Informações Legais</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p><span className="text-gray-500">{storeInfo.fantasyName}</span> - {storeInfo.legalName}</p>
                  <p>CNPJ: {storeInfo.cnpj} | IE: {storeInfo.stateRegistration}</p>
                </div>
              </div>

              <div className="flex justify-center gap-6 text-sm mb-4">
                <Link to="/sobre" className="hover:text-primary transition">Sobre</Link>
                <Link to="/contato" className="hover:text-primary transition">Contato</Link>
                <Link to="/termos" className="hover:text-primary transition">Termos</Link>
                <Link to="/privacidade" className="hover:text-primary transition">Privacidade</Link>
              </div>
              <p className="text-gray-500 text-xs">
                © 2024 {storeInfo.legalName}. Todos os direitos reservados.
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Imagens meramente ilustrativas. Preços e disponibilidade sujeitos a alteração.
              </p>
            </div>
          </div>
        </footer>

        {/* Botão Flutuante do Carrinho */}
        <FloatingCartButton />

        {/* Botão Flutuante do WhatsApp */}
        <WhatsAppButton />

        {/* Botão Flutuante do Instagram */}
        <InstagramButton />

        {/* Notificações de Prova Social */}
        <SocialProofNotification />
      </div>

      {/* Carrinho */}
      <Cart />

      {/* Modal de detalhes do produto */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Toast de feedback */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Banner de Sessão PIX Pendente */}
      <PixSessionBanner onRestore={handleRestorePixSession} />
    </div>
  );
}

export default App;
