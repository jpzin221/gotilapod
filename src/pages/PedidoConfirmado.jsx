import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle, Package, Truck, MapPin, Clock, Phone,
  Home, ArrowRight, Store, Box, Bike, Navigation,
  CheckCheck, Loader2, ChevronRight
} from 'lucide-react';

const PedidoConfirmado = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('confirmado');

  // Etapas do pedido
  const etapas = [
    {
      id: 'confirmado',
      titulo: 'Pagamento Aprovado',
      descricao: 'Seu pagamento foi confirmado',
      icone: CheckCircle,
      cor: 'green'
    },
    {
      id: 'preparando',
      titulo: 'Preparando Pedido',
      descricao: 'Estamos separando seus produtos',
      icone: Package,
      cor: 'blue'
    },
    {
      id: 'guardando',
      titulo: 'Armazenando',
      descricao: 'Produtos embalados e prontos',
      icone: Box,
      cor: 'purple'
    },
    {
      id: 'motoboy_caminho',
      titulo: 'Motoboy a Caminho',
      descricao: 'Motoboy está indo buscar o pedido',
      icone: Bike,
      cor: 'orange'
    },
    {
      id: 'coleta',
      titulo: 'Coletado',
      descricao: 'Pedido coletado pela loja parceira',
      icone: Store,
      cor: 'indigo'
    },
    {
      id: 'em_rota',
      titulo: 'Em Rota de Entrega',
      descricao: 'Seu pedido está a caminho',
      icone: Truck,
      cor: 'cyan'
    },
    {
      id: 'entregue',
      titulo: 'Entregue',
      descricao: 'Pedido entregue com sucesso!',
      icone: CheckCheck,
      cor: 'green'
    }
  ];

  useEffect(() => {
    // Buscar dados do pedido
    const savedSession = localStorage.getItem('pixPaymentSession');

    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.pedidoCriado) {
          setPedido(session.pedidoCriado);
          setLoading(false);

          // Limpar sessão PIX
          localStorage.removeItem('pixPaymentSession');

          // Simular progresso das etapas (DEMO)
          simulateProgress();
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Erro ao recuperar pedido:', error);
        navigate('/');
      }
    } else {
      // Tentar buscar do backend
      const pedidoId = searchParams.get('pedido');
      if (pedidoId) {
        fetchPedido(pedidoId);
      } else {
        navigate('/');
      }
    }
  }, [searchParams, navigate]);

  const fetchPedido = async (pedidoId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pedidos/${pedidoId}`);
      const data = await response.json();

      if (data.success) {
        setPedido(data.pedido);
        setCurrentStatus(data.pedido.status);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Simular progresso (DEMO - remover em produção)
  const simulateProgress = () => {
    const statusSequence = ['confirmado', 'preparando', 'guardando', 'motoboy_caminho', 'coleta', 'em_rota'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < statusSequence.length) {
        setCurrentStatus(statusSequence[currentIndex]);
      } else {
        clearInterval(interval);
      }
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  };

  const getEtapaIndex = (statusId) => {
    return etapas.findIndex(e => e.id === statusId);
  };

  const isEtapaConcluida = (statusId) => {
    return getEtapaIndex(statusId) <= getEtapaIndex(currentStatus);
  };

  const isEtapaAtual = (statusId) => {
    return statusId === currentStatus;
  };

  const getCorClasse = (cor, tipo = 'bg') => {
    const cores = {
      green: tipo === 'bg' ? 'bg-green-500' : tipo === 'text' ? 'text-green-600' : 'border-green-500',
      blue: tipo === 'bg' ? 'bg-blue-500' : tipo === 'text' ? 'text-blue-600' : 'border-blue-500',
      purple: tipo === 'bg' ? 'bg-purple-500' : tipo === 'text' ? 'text-purple-600' : 'border-purple-500',
      orange: tipo === 'bg' ? 'bg-orange-500' : tipo === 'text' ? 'text-orange-600' : 'border-orange-500',
      indigo: tipo === 'bg' ? 'bg-indigo-500' : tipo === 'text' ? 'text-indigo-600' : 'border-indigo-500',
      cyan: tipo === 'bg' ? 'bg-cyan-500' : tipo === 'text' ? 'text-cyan-600' : 'border-cyan-500',
    };
    return cores[cor] || cores.green;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando seu pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Pedido Confirmado</h1>
              <p className="text-sm text-gray-500">{pedido?.numeroPedido}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar à Loja</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8 pb-8">
        {/* Card de Sucesso */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2">
            🎉 Pagamento Confirmado!
          </h2>
          <p className="text-center text-green-100 text-lg mb-4">
            Seu pedido foi aprovado e já está sendo processado
          </p>
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-sm text-green-200">Pedido</p>
              <p className="text-2xl font-bold">{pedido?.numeroPedido}</p>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <p className="text-sm text-green-200">Valor</p>
              <p className="text-2xl font-bold">R$ {pedido?.valorTotal?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Rastreamento */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline de Rastreamento */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Navigation className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-gray-800">Rastreamento em Tempo Real</h3>
              </div>

              <div className="space-y-4">
                {etapas.map((etapa, index) => {
                  const Icone = etapa.icone;
                  const concluida = isEtapaConcluida(etapa.id);
                  const atual = isEtapaAtual(etapa.id);

                  return (
                    <div key={etapa.id} className="relative">
                      {/* Linha conectora */}
                      {index < etapas.length - 1 && (
                        <div
                          className={`absolute left-6 top-14 w-0.5 h-16 transition-all duration-500 ${concluida ? getCorClasse(etapa.cor, 'bg') : 'bg-gray-200'
                            }`}
                        />
                      )}

                      {/* Card da Etapa */}
                      <div
                        className={`relative flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${atual
                            ? `bg-gradient-to-r from-${etapa.cor}-50 to-${etapa.cor}-100 border-2 ${getCorClasse(etapa.cor, 'border')} shadow-md scale-105`
                            : concluida
                              ? 'bg-gray-50 border-2 border-gray-200'
                              : 'bg-white border-2 border-gray-100 opacity-50'
                          }`}
                      >
                        {/* Ícone */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${concluida
                              ? `${getCorClasse(etapa.cor, 'bg')} text-white shadow-lg`
                              : 'bg-gray-200 text-gray-400'
                            } ${atual ? 'animate-pulse' : ''}`}
                        >
                          {atual ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <Icone className="w-6 h-6" />
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-bold ${atual ? getCorClasse(etapa.cor, 'text') : 'text-gray-800'}`}>
                              {etapa.titulo}
                            </h4>
                            {concluida && !atual && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {atual && (
                              <span className="px-2 py-0.5 bg-white rounded-full text-xs font-semibold text-primary">
                                Em andamento
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{etapa.descricao}</p>
                          {atual && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>Estimativa: 5-10 minutos</span>
                            </div>
                          )}
                        </div>

                        {/* Seta */}
                        {atual && (
                          <ChevronRight className={`w-6 h-6 ${getCorClasse(etapa.cor, 'text')} animate-pulse`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informações de Entrega */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-gray-800">Endereço de Entrega</h3>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <p className="font-semibold text-gray-800 mb-2">{pedido?.nomeCliente}</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {pedido?.endereco?.endereco}, {pedido?.endereco?.numero}
                  {pedido?.endereco?.complemento && `, ${pedido?.endereco?.complemento}`}
                  <br />
                  {pedido?.endereco?.bairro} - {pedido?.endereco?.cidade}/{pedido?.endereco?.estado}
                  <br />
                  CEP: {pedido?.endereco?.cep}
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Ações */}
          <div className="space-y-6">
            {/* Card de Contato */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-bold text-gray-800">Acompanhe</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Use seu telefone para acessar o painel:
              </p>
              <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4 mb-4">
                <p className="text-center text-xl font-bold text-white">
                  {pedido?.telefone}
                </p>
              </div>
              <button
                onClick={() => navigate('/minha-conta', { state: { telefone: pedido?.telefone } })}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                Acessar Painel
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Card de Ajuda */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg p-6 border border-orange-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Precisa de Ajuda?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Entre em contato pelo WhatsApp
              </p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Chamar no WhatsApp
              </button>
            </div>

            {/* Tempo Estimado */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Previsão</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">30-45 min</p>
              <p className="text-sm text-gray-600">Tempo estimado de entrega</p>
            </div>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-4 text-gray-600 hover:text-gray-800 font-medium transition border-2 border-gray-300 rounded-xl hover:border-primary hover:bg-gray-50"
          >
            <Home className="w-5 h-5" />
            Continuar Comprando
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">Obrigado por comprar conosco! 💜</p>
          <p className="text-sm text-gray-500">
            Acompanhe seu pedido em tempo real e receba notificações
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PedidoConfirmado;
