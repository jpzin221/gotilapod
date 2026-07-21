import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, productService, storeService } from '../lib/supabase';
import {
  LogOut, Loader2, Settings, Home, Image, Package, MessageSquare,
  ShoppingBag, Route, TrendingUp, Clock, Tag, Sparkles, CreditCard, Users,
  FolderTree, LayoutDashboard, ChevronLeft, ChevronRight,
  DollarSign, ShoppingCart, UserCheck, PackageCheck, AlertCircle, Moon, Sun
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

function DashboardTab({ stats, dark }) {
  const cards = [
    { label: 'Pedidos Hoje', value: stats.pedidosHoje, icon: ShoppingCart, bg: 'bg-blue-500/10 dark:bg-blue-500/20', iconColor: 'text-blue-500' },
    { label: 'Receita Hoje', value: `R$ ${stats.receitaHoje.toFixed(2)}`, icon: DollarSign, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', iconColor: 'text-emerald-500' },
    { label: 'Pendentes', value: stats.pedidosPendentes, icon: AlertCircle, bg: 'bg-orange-500/10 dark:bg-orange-500/20', iconColor: 'text-orange-500' },
    { label: 'Entregues', value: stats.pedidosEntregues, icon: PackageCheck, bg: 'bg-green-500/10 dark:bg-green-500/20', iconColor: 'text-green-500' },
    { label: 'Clientes', value: stats.totalUsuarios, icon: UserCheck, bg: 'bg-purple-500/10 dark:bg-purple-500/20', iconColor: 'text-purple-500' },
    { label: 'Produtos', value: stats.totalProdutos, icon: Package, bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', iconColor: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visao geral da sua loja</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.recentPedidos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pedidos Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">Pedido</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Valor</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPedidos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <td className="py-3 font-mono text-xs text-gray-900 dark:text-gray-300">{p.numero_pedido}</td>
                    <td className="py-3 text-gray-900 dark:text-gray-300">{p.cliente_nome || 'N/A'}</td>
                    <td className="py-3 font-medium text-gray-900 dark:text-gray-300">R$ {(p.valor_total || 0).toFixed(2)}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 capitalize">
                        {p.status || 'confirmado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'categories', label: 'Categorias', icon: FolderTree },
  { id: 'flavors', label: 'Sabores', icon: Sparkles },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { id: 'usuarios', label: 'Clientes', icon: Users },
  { id: 'carousel', label: 'Carrossel', icon: Image },
  { id: 'testimonials', label: 'Depoimentos', icon: MessageSquare },
  { id: 'promotions', label: 'Promocoes', icon: Tag },
  { id: 'trajectory', label: 'Trajetos', icon: Route },
  { id: 'fluxo', label: 'Fluxo Status', icon: TrendingUp },
  { id: 'gateways', label: 'Pagamentos', icon: CreditCard },
  { id: 'hours', label: 'Horarios', icon: Clock },
  { id: 'siteconfig', label: 'Configuracoes', icon: Settings },
];

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [stats, setStats] = useState({
    pedidosHoje: 0,
    receitaHoje: 0,
    pedidosPendentes: 0,
    pedidosEntregues: 0,
    totalUsuarios: 0,
    totalProdutos: 0,
    recentPedidos: []
  });

  // Aplicar dark mode no <html>
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('admin-dark-mode', JSON.stringify(dark));
  }, [dark]);

  // Garantir dark mode ao entrar no admin
  useEffect(() => {
    document.documentElement.classList.add('dark');
    setDark(true);
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, settingsData] = await Promise.all([
        productService.getAll(),
        storeService.getSettings()
      ]);
      setProducts(productsData || []);
      setStoreSettings(settingsData);
      await loadPedidos();
      await loadStats(productsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (productsData) => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const [pedidosRes, usuariosRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('usuarios').select('id', { count: 'exact', head: true })
      ]);
      const allPedidos = pedidosRes.data || [];
      const pedidosHoje = allPedidos.filter(p => new Date(p.created_at) >= hoje);
      const pendentes = allPedidos.filter(p => !['entregue', 'cancelado'].includes(p.status));
      const entregues = allPedidos.filter(p => p.status === 'entregue');
      setStats({
        pedidosHoje: pedidosHoje.length,
        receitaHoje: pedidosHoje.reduce((sum, p) => sum + (p.valor_total || 0), 0),
        pedidosPendentes: pendentes.length,
        pedidosEntregues: entregues.length,
        totalUsuarios: usuariosRes.count || 0,
        totalProdutos: (productsData || []).length,
        recentPedidos: allPedidos.slice(0, 5)
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadPedidos = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/pedidos/todos`);
      const data = await response.json();
      if (data.success) setPedidos(data.pedidos || []);
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
        savedProduct = await productService.update(productData.id, productData);
        setProducts(products.map(p => p.id === productData.id ? savedProduct : p));
      } else {
        savedProduct = await productService.create(productData);
        setProducts([...products, savedProduct]);
      }
      await loadData();
      return savedProduct;
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex text-gray-900 dark:text-gray-100">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col
        ${sidebarOpen ? 'w-60' : 'w-[70px]'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-white text-lg truncate">Admin</span>
            </div>
          )}
          <button onClick={() => {
            if (window.innerWidth < 1024) setMobileMenuOpen(false);
            else setSidebarOpen(!sidebarOpen);
          }} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition text-sm
                ${activeTab === item.id
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 text-sm"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Ver Loja</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-gray-950">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 h-16 flex items-center px-4 sm:px-6 gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-yellow-400 transition"
            title={dark ? 'Modo claro' : 'Modo escuro'}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardTab stats={stats} dark={dark} />}
          {activeTab === 'products' && (
            <ProductManager products={products} onSave={handleSaveProduct} onDelete={handleDeleteProduct} onRefresh={loadData} />
          )}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'hours' && storeSettings && (
            <BusinessHoursForm initialHours={storeSettings.business_hours} onSave={handleUpdateHours} />
          )}
          {activeTab === 'carousel' && <CarouselManager />}
          {activeTab === 'testimonials' && <TestimonialManager />}
          {activeTab === 'pedidos' && <PedidosManager />}
          {activeTab === 'usuarios' && <UsersManager />}
          {activeTab === 'trajectory' && <TrajectoryManager pedidos={pedidos} />}
          {activeTab === 'fluxo' && <FluxoStatusManager />}
          {activeTab === 'promotions' && <PromotionBannerManager />}
          {activeTab === 'flavors' && <FlavorManager />}
          {activeTab === 'gateways' && <GatewayManager />}
          {activeTab === 'siteconfig' && <SiteConfigManager />}
        </main>
      </div>
    </div>
  );
}
