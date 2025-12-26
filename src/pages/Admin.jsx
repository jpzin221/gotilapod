import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService, storeService } from '../lib/supabase';
import {
  LogOut, Loader2, Settings, Home, Image, Package, Store, MessageSquare, ShoppingBag, Route, TrendingUp, Clock, Tag, Sparkles, CreditCard, Users, FolderTree
} from 'lucide-react';
import ProductManager from '../components/admin/ProductManager';
import CategoryManager from '../components/admin/CategoryManager';
import BusinessHoursForm from '../components/admin/BusinessHoursForm';
import CarouselManager from '../components/admin/CarouselManager';
import TestimonialManager from '../components/admin/TestimonialManager';
import PedidosManager from '../components/admin/PedidosManager';
import TrajectoryManager from '../components/admin/TrajectoryManager';
import FluxoStatusManager from '../components/admin/FluxoStatusManager';
import PromotionBannerManager from '../components/admin/PromotionBannerManager';
import FlavorManager from '../components/admin/FlavorManager';
import GatewayManager from '../components/admin/GatewayManager';
import SiteConfigManager from '../components/admin/SiteConfigManager';
import UsersManager from '../components/admin/UsersManager';

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // products, hours, carousel, stores, testimonials, pedidos, trajectory, fluxo
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Prevenir recarregamento ao trocar de aba do navegador
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Não fazer nada ao trocar de aba - manter estado
      if (document.hidden) {
        console.log('🔒 Aba oculta - estado preservado');
      } else {
        console.log('👁️ Aba visível - estado mantido');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, settingsData] = await Promise.all([
        productService.getAll(),
        storeService.getSettings()
      ]);
      setProducts(productsData || []);
      setStoreSettings(settingsData);

      // Carregar pedidos para o TrajectoryManager
      await loadPedidos();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/pedidos/todos`);
      const data = await response.json();

      if (data.success) {
        setPedidos(data.pedidos || []);
      }
    } catch (err) {
      console.error('Error loading pedidos:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    try {
      await productService.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Erro ao deletar produto');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      let savedProduct;
      if (productData.id) {
        // Editando produto existente
        savedProduct = await productService.update(productData.id, productData);
        setProducts(products.map(p => p.id === productData.id ? savedProduct : p));
      } else {
        // Criando novo produto
        savedProduct = await productService.create(productData);
        setProducts([...products, savedProduct]);
      }
      await loadData(); // Recarregar dados
      return savedProduct; // Retornar produto salvo para o ProductForm
    } catch (err) {
      console.error('Error saving product:', err);
      throw err;
    }
  };

  const handleUpdateHours = async (hours) => {
    try {
      const updated = await storeService.updateHours(hours);
      setStoreSettings(updated);
    } catch (err) {
      console.error('Error updating hours:', err);
      throw err;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Ver Loja</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'products'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Produtos</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'categories'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <FolderTree className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Categorias</span>
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'hours'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base hidden sm:inline">Horário de Funcionamento</span>
              <span className="text-xs sm:hidden">Horário</span>
            </button>
            <button
              onClick={() => setActiveTab('carousel')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'carousel'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Image className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Carrossel</span>
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'testimonials'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Depoimentos</span>
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'pedidos'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Pedidos</span>
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'usuarios'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Usuários</span>
            </button>
            <button
              onClick={() => setActiveTab('trajectory')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'trajectory'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Route className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Trajetos</span>
            </button>
            <button
              onClick={() => setActiveTab('fluxo')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'fluxo'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base hidden sm:inline">Fluxo de Status</span>
              <span className="text-xs sm:hidden">Fluxo</span>
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'promotions'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base hidden sm:inline">Banner Promoções</span>
              <span className="text-xs sm:hidden">Promoções</span>
            </button>
            <button
              onClick={() => setActiveTab('flavors')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'flavors'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Sabores</span>
            </button>
            <button
              onClick={() => setActiveTab('gateways')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'gateways'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Pagamentos</span>
            </button>
            <button
              onClick={() => setActiveTab('siteconfig')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${activeTab === 'siteconfig'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base">Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pt-24 sm:pt-28 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className={activeTab === 'products' ? 'block' : 'hidden'}>
          <ProductManager
            products={products}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            onRefresh={loadData}
          />
        </div>

        {activeTab === 'categories' && (
          <CategoryManager />
        )}

        {activeTab === 'hours' && storeSettings && (
          <BusinessHoursForm
            initialHours={storeSettings.business_hours}
            onSave={handleUpdateHours}
          />
        )}

        {activeTab === 'carousel' && (
          <CarouselManager />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialManager />
        )}

        {activeTab === 'pedidos' && (
          <PedidosManager />
        )}

        {activeTab === 'usuarios' && (
          <UsersManager />
        )}

        {activeTab === 'trajectory' && (
          <TrajectoryManager pedidos={pedidos} />
        )}

        {activeTab === 'fluxo' && (
          <FluxoStatusManager />
        )}

        {activeTab === 'promotions' && (
          <PromotionBannerManager />
        )}

        {activeTab === 'flavors' && (
          <FlavorManager />
        )}

        {activeTab === 'gateways' && (
          <GatewayManager />
        )}

        {activeTab === 'siteconfig' && (
          <SiteConfigManager />
        )}
      </main>
    </div>
  );
}
