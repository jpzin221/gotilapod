import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Package, Archive, Truck, MapPin, Home } from 'lucide-react';

const OrderTracking = ({ pedidoId, numeroPedido }) => {
  const [status, setStatus] = useState('confirmado');
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusConfig = {
    confirmado: {
      icon: CheckCircle,
      label: 'Pedido Confirmado',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Seu pedido foi confirmado com sucesso!'
    },
    preparando: {
      icon: Package,
      label: 'Preparando Pedido',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Estamos preparando seus produtos'
    },
    guardando: {
      icon: Archive,
      label: 'Guardando Pedido',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Seu pedido está sendo embalado'
    },
    motoboy_caminho: {
      icon: Truck,
      label: 'Motoboy a Caminho',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'O motoboy está indo buscar seu pedido'
    },
    coleta: {
      icon: MapPin,
      label: 'Coleta Realizada',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Seu pedido foi coletado'
    },
    em_rota: {
      icon: Truck,
      label: 'Em Rota de Entrega',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Seu pedido está a caminho!'
    },
    entregue: {
      icon: Home,
      label: 'Entregue',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Pedido entregue com sucesso!'
    }
  };

  const statusOrder = [
    'confirmado',
    'preparando',
    'guardando',
    'motoboy_caminho',
    'coleta',
    'em_rota',
    'entregue'
  ];

  useEffect(() => {
    buscarStatusPedido();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(buscarStatusPedido, 30000);
    
    return () => clearInterval(interval);
  }, [pedidoId]);

  const buscarStatusPedido = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/pedidos/${pedidoId}/status`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setHistorico(data.historico || []);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentIndex = () => statusOrder.indexOf(status);

  const getStatusState = (index) => {
    const currentIndex = getCurrentIndex();
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentConfig = statusConfig[status];
  const CurrentIcon = currentConfig.icon;

  return (
    <div>
      {/* Status Atual Destacado */}
      <div className={`${currentConfig.bgColor} p-4 rounded-xl mb-6 flex items-center gap-4`}>
        <div className={`w-12 h-12 ${currentConfig.bgColor} rounded-full flex items-center justify-center`}>
          <CurrentIcon className={`w-6 h-6 ${currentConfig.color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${currentConfig.color} mb-1`}>
            {currentConfig.label}
          </h3>
          <p className="text-sm text-gray-600">
            {currentConfig.description}
          </p>
        </div>
      </div>

      {/* Timeline Visual */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-4">Acompanhamento:</h4>
        
        {statusOrder.map((statusKey, index) => {
          const config = statusConfig[statusKey];
          const Icon = config.icon;
          const state = getStatusState(index);
          const historicoItem = historico.find(h => h.status === statusKey);

          return (
            <div key={statusKey} className="flex items-start gap-4">
              {/* Ícone e Linha */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    state === 'completed'
                      ? 'bg-green-100 border-2 border-green-500'
                      : state === 'current'
                      ? `${config.bgColor} border-2 border-current ${config.color} animate-pulse`
                      : 'bg-gray-100 border-2 border-gray-300'
                  }`}
                >
                  {state === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${
                        state === 'current' ? config.color : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
                
                {/* Linha conectora */}
                {index < statusOrder.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      state === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-4">
                <h5
                  className={`font-medium ${
                    state === 'completed' || state === 'current'
                      ? 'text-gray-800'
                      : 'text-gray-400'
                  }`}
                >
                  {config.label}
                </h5>
                {historicoItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatDate(historicoItem.created_at)}
                  </p>
                )}
                {state === 'current' && (
                  <p className="text-sm text-gray-600 mt-1">
                    {config.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimativa */}
      {status !== 'entregue' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            ⏱️ <strong>Previsão de entrega:</strong> Aproximadamente{' '}
            {statusOrder.length - getCurrentIndex() - 1 === 0
              ? '30 minutos'
              : `${(statusOrder.length - getCurrentIndex() - 1) * 15} minutos`}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
