import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, productService, storeService } from '../lib/supabase';
import {
  LogOut, Loader2, Settings, Home, Image, Package, MessageSquare,
  ShoppingBag, Route, TrendingUp, Clock, Tag, Sparkles, CreditCard, Users,
  FolderTree, LayoutDashboard, ChevronLeft, ChevronRight,
  DollarSign, ShoppingCart, UserCheck, PackageCheck, AlertCircle, Moon, Sun, X
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
import CouponManager from '../components/admin/CouponManager';

function DashboardTab({ stats, dark }) {
  const [animatedValues, setAnimatedValues] = useState({});

  useEffect(() => {
    const targets = {
      pedidosHoje: stats.pedidosHoje,
      receitaHoje: stats.receitaHoje,
      pedidosPendentes: stats.pedidosPendentes,
      pedidosEntregues: stats.pedidosEntregues,
      totalUsuarios: stats.totalUsuarios,
      totalProdutos: stats.totalProdutos,
    };
    const duration = 800;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = {};
      for (const key in targets) {
        current[key] = targets[key] * eased;
      }
      setAnimatedValues(current);
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [stats.pedidosHoje, stats.receitaHoje, stats.pedidosPendentes, stats.pedidosEntregues, stats.totalUsuarios, stats.totalProdutos]);

  const formatCurrency = (v) => `R$ ${v.toFixed(2)}`;
  const formatInt = (v) => Math.round(v);

  const cards = [
    {
      label: 'Pedidos Hoje',
      value: formatInt(animatedValues.pedidosHoje || 0),
      icon: ShoppingCart,
      gradient: 'from-blue-600 to-blue-500',
      glow: 'shadow-blue-500/20',
      trend: null,
    },
    {
      label: 'Receita Hoje',
      value: formatCurrency(animatedValues.receitaHoje || 0),
      icon: DollarSign,
      gradient: 'from-emerald-600 to-emerald-500',
      glow: 'shadow-emerald-500/20',
      trend: null,
    },
    {
      label: 'Pendentes',
      value: formatInt(animatedValues.pedidosPendentes || 0),
      icon: AlertCircle,
      gradient: 'from-orange-500 to-amber-500',
      glow: 'shadow-orange-500/20',
      trend: null,
    },
    {
      label: 'Entregues',
      value: formatInt(animatedValues.pedidosEntregues || 0),
      icon: PackageCheck,
      gradient: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/20',
      trend: null,
    },
    {
      label: 'Clientes',
      value: formatInt(animatedValues.totalUsuarios || 0),
      icon: UserCheck,
      gradient: 'from-purple-600 to-violet-500',
      glow: 'shadow-purple-500/20',
      trend: null,
    },
    {
      label: 'Produtos',
      value: formatInt(animatedValues.totalProdutos || 0),
      icon: Package,
      gradient: 'from-indigo-600 to-blue-500',
      glow: 'shadow-indigo-500/20',
      trend: null,
    },
  ];

  const statusColors = {
    confirmado: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-500' },
    pendente: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-500' },
    saiu_entrega: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-500' },
    entregue: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-500' },
    cancelado: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  };

  const getStatusStyle = (status) => statusColors[status] || { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-500' };

  const pedidosPendentesCount = stats.pedidosPendentes;
  const pedidosEntreguesCount = stats.pedidosEntregues;
  const totalRecent = stats.recentPedidos.length;
  const entreguePercent = totalRecent > 0 ? Math.round((pedidosEntreguesCount / (pedidosPendentesCount + pedidosEntreguesCount || 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Bem-vindo ao Painel
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Aqui esta o resumo da sua loja. Dados atualizados em tempo real.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <div
            key={card.label}
            className={`group relative overflow-hidden rounded-2xl bg-gray-800/80 border border-gray-700/50 p-5 hover:border-gray-600/50 transition-all duration-300 hover:shadow-lg ${card.glow}`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300`} />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-full -translate-y-8 translate-x-8" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2 tabular-nums">{card.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row: Pedidos + Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pedidos Recentes */}
        <div className="lg:col-span-2 bg-gray-800/80 rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold text-white text-sm">Pedidos Recentes</h3>
            </div>
            <span className="text-xs text-gray-500">{stats.recentPedidos.length} registros</span>
          </div>
          {stats.recentPedidos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-700/30">
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Pedido</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Cliente</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Valor</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPedidos.map((p) => {
                    const st = getStatusStyle(p.status || 'confirmado');
                    return (
                      <tr key={p.id} className="border-b border-gray-700/20 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-300">{p.numero_pedido}</td>
                        <td className="px-5 py-3.5 text-gray-300">{p.cliente_nome || 'N/A'}</td>
                        <td className="px-5 py-3.5 font-semibold text-white">R$ {(p.valor_total || 0).toFixed(2)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {p.status || 'confirmado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhum pedido recente</p>
            </div>
          )}
        </div>

        {/* Resumo Rápido */}
        <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-white text-sm">Resumo Rapido</h3>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Taxa de Entrega</span>
              <span className="font-semibold text-white">{entreguePercent}%</span>
            </div>
            <div className="h-2.5 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${entreguePercent}%` }}
              />
            </div>
          </div>

          {/* Mini stats */}
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30 border border-gray-700/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-xs text-gray-400">Aguardando</span>
              </div>
              <span className="text-sm font-bold text-orange-400">{stats.pedidosPendentes}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30 border border-gray-700/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-gray-400">Finalizados</span>
              </div>
              <span className="text-sm font-bold text-green-400">{stats.pedidosEntregues}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30 border border-gray-700/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs text-gray-400">Clientes</span>
              </div>
              <span className="text-sm font-bold text-purple-400">{stats.totalUsuarios}</span>
            </div>
          </div>

          {/* Receita destaque */}
          <div className="mt-auto p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium mb-1">Receita Hoje</p>
            <p className="text-2xl font-bold text-emerald-400">R$ {stats.receitaHoje.toFixed(2)}</p>
          </div>
        </div>
      </div>
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
  { id: 'coupons', label: 'Cupons', icon: Tag },
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
  const [touchStart, setTouchStart] = useState(null);
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
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setPedidos(data || []);
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
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart && e.changedTouches[0].clientX - touchStart > 80) {
              setMobileMenuOpen(false);
            }
            setTouchStart(null);
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col
        ${mobileMenuOpen ? 'w-72 translate-x-0' : sidebarOpen ? 'w-60 lg:translate-x-0' : 'w-[70px] lg:translate-x-0'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
          {sidebarOpen || mobileMenuOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-white text-lg truncate">Admin</span>
            </div>
          ) : <div />}
          <button onClick={() => {
            if (mobileMenuOpen) setMobileMenuOpen(false);
            else setSidebarOpen(!sidebarOpen);
          }} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 min-w-[36px] min-h-[36px] flex items-center justify-center">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-0.5 transition text-sm min-h-[44px]
                ${activeTab === item.id
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(sidebarOpen || mobileMenuOpen) && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-2 space-y-1 flex-shrink-0">
          <button
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 text-sm min-h-[44px]"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || mobileMenuOpen) && <span>Ver Loja</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm min-h-[44px]"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || mobileMenuOpen) && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-gray-950">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 h-14 sm:h-16 flex items-center px-3 sm:px-6 gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2.5 rounded-lg hover:bg-gray-800 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-yellow-400 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={dark ? 'Modo claro' : 'Modo escuro'}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-6">
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
          {activeTab === 'coupons' && <CouponManager />}
          {activeTab === 'siteconfig' && <SiteConfigManager />}
        </main>
      </div>
    </div>
  );
}
