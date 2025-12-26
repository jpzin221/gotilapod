import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhoneAuth } from '../context/PhoneAuthContext';
import { pedidoService } from '../lib/supabase';
import Header from '../components/Header';
import { storeInfo } from '../data/products';
import { Package, Clock, CheckCircle, ArrowRight, ShoppingBag, Loader2, LogOut } from 'lucide-react';

export default function MeusPedidos() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = usePhoneAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      logout();
      navigate('/');
    }
  };

  // Buscar pedidos do Supabase
  useEffect(() => {
    const loadPedidos = async () => {
      if (!user) {
        console.log('⚠️ Usuário não logado');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando pedidos para usuário:', user.id);

        // Buscar por usuario_id primeiro
        let pedidosEncontrados = await pedidoService.getByUsuario(user.id);

        // Se não encontrou, buscar por telefone
        if (pedidosEncontrados.length === 0 && user.telefone) {
          console.log('🔍 Buscando por telefone:', user.telefone);
          pedidosEncontrados = await pedidoService.getByTelefone(user.telefone);
        }

        console.log('📦 Pedidos encontrados:', pedidosEncontrados.length);
        setPedidos(pedidosEncontrados);
      } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPedidos();
  }, [user]);

  // Redirecionar se não estiver logado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header storeInfo={storeInfo} />
        <div className="max-w-2xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Faça login para ver seus pedidos
          </h2>
          <p className="text-gray-600 mb-6">
            Acesse sua conta para acompanhar todos os seus pedidos
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header storeInfo={storeInfo} />
        <div className="max-w-2xl mx-auto px-4 pt-24 sm:pt-28 pb-16 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'preparando':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'guardando':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'aguardando_transportadora':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'pedido_coletado':
        return 'bg-lime-100 text-lime-700 border-lime-300';
      case 'entregador_iniciou_rota':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'entregador_saiu':
        return 'bg-teal-100 text-teal-700 border-teal-300';
      case 'entregador_indo_localizacao':
        return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'problema_entrega':
      case 'nao_conseguiu_entregar':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'retornado_central':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'entregue':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'cancelado':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="w-5 h-5" />;
      case 'preparando':
      case 'guardando':
        return <Package className="w-5 h-5" />;
      case 'motoboy_caminho':
      case 'coleta':
      case 'em_rota':
        return <ArrowRight className="w-5 h-5" />;
      case 'entregue':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmado':
        return 'Pagamento Confirmado';
      case 'preparando':
        return 'Preparando Pedido';
      case 'guardando':
        return 'Aguardando Coleta';
      case 'aguardando_transportadora':
        return 'Aguardando Entregador da Transportadora';
      case 'pedido_coletado':
        return 'Pedido Coletado';
      case 'entregador_iniciou_rota':
        return 'Entregador Iniciou a Rota';
      case 'entregador_saiu':
        return 'Entregador Saiu com o Pedido';
      case 'entregador_indo_localizacao':
        return 'Entregador Indo em Sua Direção';
      case 'problema_entrega':
        return 'Problema na Entrega';
      case 'nao_conseguiu_entregar':
        return 'Não Foi Possível Entregar';
      case 'retornado_central':
        return 'Retornado para Central';
      case 'entregue':
        return 'Entregue';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Processando';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header storeInfo={storeInfo} />

      <div className="max-w-4xl mx-auto px-4 pt-32 sm:pt-36 pb-8">
        {/* Header da Página */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Meus Pedidos</h1>
                <p className="text-gray-600">Olá, {user?.nome}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                title="Voltar para loja"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar para Loja</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                title="Sair da conta"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Nenhum pedido ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Faça sua primeira compra e acompanhe aqui!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition"
            >
              Começar a Comprar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {pedido.numero_pedido || `#${pedido.id?.slice(0, 8)}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.created_at || pedido.pago_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${getStatusColor(pedido.status)}`}>
                    {getStatusIcon(pedido.status)}
                    <span className="text-sm font-bold">{getStatusText(pedido.status)}</span>
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Itens:</p>
                  <div className="space-y-2">
                    {pedido.itens?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.quantidade}x {item.nome}
                          {item.sabor && <span className="text-gray-500"> - {item.sabor}</span>}
                        </span>
                        <span className="font-semibold text-gray-800">
                          R$ {item.preco.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total e Ações */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-800">
                      R$ {(pedido.valor_total || pedido.valorTotal)?.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Salvar pedido no sessionStorage para rastreamento
                      sessionStorage.setItem('justCompletedPayment', 'true');
                      sessionStorage.setItem('lastPedido', JSON.stringify(pedido));
                      navigate('/rastreamento');
                    }}
                    className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Rastrear Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
