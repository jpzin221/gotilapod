import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, Search, Filter, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PedidosManager() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const statusOptions = [
    { value: 'confirmado', label: 'Confirmado', color: 'blue' },
    { value: 'preparando', label: 'Preparando', color: 'yellow' },
    { value: 'guardando', label: 'Guardando', color: 'orange' },
    { value: 'aguardando_transportadora', label: 'Aguardando Entregador da Transportadora', color: 'amber' },
    { value: 'pedido_coletado', label: 'Pedido Coletado', color: 'lime' },
    { value: 'entregador_iniciou_rota', label: 'Entregador Iniciou a Rota de Entrega', color: 'emerald' },
    { value: 'entregador_saiu', label: 'Entregador Saiu com o Pedido', color: 'teal' },
    { value: 'entregador_indo_localizacao', label: 'Entregador Indo em Direção à Sua Localização', color: 'cyan' },
    { value: 'problema_entrega', label: 'Entregador Relatou Problema com a Entrega', color: 'orange' },
    { value: 'nao_conseguiu_entregar', label: 'Entregador Não Conseguiu Entregar', color: 'red' },
    { value: 'retornado_central', label: 'Pedido Retornado para a Central', color: 'pink' },
    { value: 'entregue', label: 'Entregue', color: 'green' },
    { value: 'cancelado', label: 'Cancelado', color: 'red' }
  ];

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);

      // Buscar diretamente do Supabase
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        return;
      }

      // Parse do endereco_entrega e itens se vierem como string
      const pedidosFormatados = (data || []).map(pedido => ({
        ...pedido,
        endereco_entrega: typeof pedido.endereco_entrega === 'string'
          ? JSON.parse(pedido.endereco_entrega)
          : pedido.endereco_entrega,
        itens: typeof pedido.itens === 'string'
          ? JSON.parse(pedido.itens)
          : pedido.itens
      }));

      console.log('📦 Pedidos carregados do Supabase:', pedidosFormatados.length);
      setPedidos(pedidosFormatados);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (pedidoId, novoStatus) => {
    try {
      // Atualizar diretamente no Supabase
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status: ' + error.message);
        return;
      }

      // Atualizar lista local
      setPedidos(pedidos.map(p =>
        p.id === pedidoId ? { ...p, status: novoStatus } : p
      ));
      alert('✅ Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do pedido');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getStatusLabel = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.label || status;
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchStatus = filtroStatus === 'todos' || pedido.status === filtroStatus;
    const matchBusca = !busca ||
      pedido.numero_pedido?.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.telefone?.includes(busca);

    return matchStatus && matchBusca;
  });

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Mini Timeline Component
  const MiniTimeline = ({ currentStatus }) => {
    const steps = [
      { id: 0, label: 'Confirmado', icon: CheckCircle, status: 'confirmado' },
      { id: 1, label: 'Preparando', icon: Package, status: 'preparando' },
      { id: 2, label: 'Guardando', icon: Clock, status: 'guardando' },
      { id: 3, label: 'Aguard. Transp.', icon: Clock, status: 'aguardando_transportadora' },
      { id: 4, label: 'Coletado', icon: CheckCircle, status: 'pedido_coletado' },
      { id: 5, label: 'Iniciou Rota', icon: TrendingUp, status: 'entregador_iniciou_rota' },
      { id: 6, label: 'Saiu', icon: Truck, status: 'entregador_saiu' },
      { id: 7, label: 'Indo p/ Você', icon: ArrowRight, status: 'entregador_indo_localizacao' },
      { id: 8, label: 'Entregue', icon: CheckCircle, status: 'entregue' }
    ];

    // Status especiais (problemas)
    const problemStatuses = ['problema_entrega', 'nao_conseguiu_entregar', 'retornado_central'];
    const isProblem = problemStatuses.includes(currentStatus);

    let currentStepIndex = steps.findIndex(s => s.status === currentStatus);

    // Se for status de problema, mostrar no step 7 (antes da entrega)
    if (isProblem) {
      currentStepIndex = 7;
    }

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-3">Timeline do Pedido:</p>
        <div className="relative">
          {/* Linha de fundo */}
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
          {/* Linha de progresso */}
          <div
            className="absolute top-3 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isCanceled = currentStatus === 'cancelado';

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-300 ${isCanceled
                      ? 'bg-red-200 text-red-600'
                      : isProblem && isCurrent
                        ? 'bg-orange-500 text-white scale-110 animate-pulse'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-gradient-to-br from-primary to-secondary text-white scale-110'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                  >
                    <StepIcon className="w-3 h-3" />
                  </div>
                  <p className={`text-[10px] text-center ${isProblem && isCurrent
                    ? 'text-orange-600 font-bold'
                    : isCurrent
                      ? 'text-primary font-bold'
                      : 'text-gray-500'
                    }`} style={{ maxWidth: '50px' }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Alerta de Problema */}
          {isProblem && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-800 font-semibold flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {currentStatus === 'problema_entrega' && 'Problema relatado na entrega'}
                {currentStatus === 'nao_conseguiu_entregar' && 'Não foi possível entregar'}
                {currentStatus === 'retornado_central' && 'Pedido retornou para central'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gerenciar Pedidos</h2>
          <p className="text-gray-600 mt-1">
            {pedidos.length} pedidos no total
          </p>
        </div>
        <button
          onClick={carregarPedidos}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filtro Status */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="todos">Todos os Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum pedido encontrado</p>
          </div>
        ) : (
          pedidosFiltrados.map(pedido => (
            <div key={pedido.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Informações do Pedido */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {pedido.numero_pedido}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(pedido.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Cliente:</span> {pedido.nome_cliente || 'N/A'}</p>
                    <p><span className="font-semibold">CPF:</span> {pedido.cpf_cliente || 'N/A'}</p>
                    <p><span className="font-semibold">Telefone:</span> {pedido.telefone || 'N/A'}</p>
                    <p><span className="font-semibold">Valor:</span> {formatPrice(pedido.valor_total)}</p>

                    {pedido.endereco_entrega && (
                      <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        <span className="font-semibold">Endereço:</span>
                        <br />
                        {pedido.endereco_entrega.endereco || ''}, {pedido.endereco_entrega.numero || 'S/N'}
                        {pedido.endereco_entrega.complemento && ` - ${pedido.endereco_entrega.complemento}`}
                        <br />
                        {pedido.endereco_entrega.bairro || ''} - {pedido.endereco_entrega.cidade || ''}/{pedido.endereco_entrega.estado || ''}
                        <br />
                        CEP: {pedido.endereco_entrega.cep || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Atual */}
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-gray-600 mb-2">Status Atual:</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${getStatusColor(pedido.status)}-100 text-${getStatusColor(pedido.status)}-800`}>
                    {getStatusLabel(pedido.status)}
                  </span>
                </div>

                {/* Alterar Status */}
                <div className="flex flex-col justify-center">
                  <label className="text-sm text-gray-600 mb-2">Alterar para:</label>
                  <select
                    value={pedido.status}
                    onChange={(e) => alterarStatus(pedido.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Itens do Pedido */}
              {pedido.itens && pedido.itens.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Itens:</p>
                  <div className="space-y-1">
                    {pedido.itens.map((item, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {item.quantidade}x {item.nome}
                        {item.sabor && <span className="text-primary"> - {item.sabor}</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Timeline */}
              <MiniTimeline currentStatus={pedido.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
