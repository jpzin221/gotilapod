import { useState, useEffect } from 'react';
import { 
  Clock, Save, Plus, Trash2, ArrowRight, AlertCircle, 
  RefreshCw, Settings, User, Users, CheckCircle, XCircle, GripVertical
} from 'lucide-react';
import { 
  orderTrajectoryService, 
  formatarTempo, 
  parseTempoParaMinutos,
  STATUS_PEDIDO,
  STATUS_ESPECIAIS,
  getProximosStatus
} from '../../lib/orderTrajectoryService';

export default function TrajectoryManager({ pedidos = [] }) {
  const [mode, setMode] = useState('global'); // 'global' ou 'individual'
  const [trajetoGlobal, setTrajetoGlobal] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [trajetoIndividual, setTrajetoIndividual] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMode, setAddModalMode] = useState('global');
  const [availableStatuses, setAvailableStatuses] = useState([]);

  useEffect(() => {
    loadData();
    checkStoreStatus();
    loadAvailableStatuses();
  }, []);

  useEffect(() => {
    if (pedidoSelecionado) {
      loadTrajetoIndividual();
    }
  }, [pedidoSelecionado]);

  const checkStoreStatus = async () => {
    const isOpen = await orderTrajectoryService.isStoreOpen();
    setIsStoreOpen(isOpen);
  };

  const loadAvailableStatuses = async () => {
    try {
      const trajeto = await orderTrajectoryService.getDefaultTrajectory();
      // Extrair todos os status únicos
      const statusSet = new Set();
      trajeto.forEach(t => {
        statusSet.add(t.status_atual);
        statusSet.add(t.proximo_status);
      });
      setAvailableStatuses(Array.from(statusSet));
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const trajeto = await orderTrajectoryService.getDefaultTrajectory();
      setTrajetoGlobal(trajeto);
    } catch (error) {
      console.error('Erro ao carregar trajeto:', error);
      showMessage('error', 'Erro ao carregar trajeto padrão');
    } finally {
      setLoading(false);
    }
  };

  const loadTrajetoIndividual = async () => {
    try {
      setLoading(true);
      const trajeto = await orderTrajectoryService.getOrderTrajectory(pedidoSelecionado);
      
      if (trajeto.length === 0) {
        // Usar trajeto global como base
        setTrajetoIndividual(trajetoGlobal.map(t => ({ ...t })));
      } else {
        setTrajetoIndividual(trajeto);
      }
    } catch (error) {
      console.error('Erro ao carregar trajeto individual:', error);
      showMessage('error', 'Erro ao carregar trajeto do pedido');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSaveGlobal = async () => {
    try {
      setSaving(true);
      await orderTrajectoryService.updateDefaultTrajectory(trajetoGlobal);
      showMessage('success', 'Trajeto padrão atualizado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showMessage('error', 'Erro ao salvar trajeto padrão');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividual = async () => {
    if (!pedidoSelecionado) return;

    try {
      setSaving(true);
      await orderTrajectoryService.createCustomTrajectory(pedidoSelecionado, trajetoIndividual);
      showMessage('success', 'Trajeto personalizado salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showMessage('error', 'Erro ao salvar trajeto personalizado');
    } finally {
      setSaving(false);
    }
  };

  const handleResetIndividual = async () => {
    if (!pedidoSelecionado) return;
    if (!confirm('Deseja remover o trajeto personalizado e voltar ao padrão?')) return;

    try {
      setSaving(true);
      await orderTrajectoryService.removeCustomTrajectory(pedidoSelecionado);
      showMessage('success', 'Trajeto resetado para o padrão');
      await loadTrajetoIndividual();
    } catch (error) {
      console.error('Erro ao resetar:', error);
      showMessage('error', 'Erro ao resetar trajeto');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = (isGlobal) => {
    setAddModalMode(isGlobal ? 'global' : 'individual');
    setShowAddModal(true);
  };

  const addEtapaFromStatus = (statusAtual, proximoStatus) => {
    const newEtapa = {
      status_atual: statusAtual,
      proximo_status: proximoStatus,
      minutos_espera: 30,
      descricao: ''
    };

    if (addModalMode === 'global') {
      setTrajetoGlobal([...trajetoGlobal, newEtapa]);
    } else {
      setTrajetoIndividual([...trajetoIndividual, newEtapa]);
    }
    
    setShowAddModal(false);
    showMessage('success', 'Etapa adicionada! Clique em "Salvar" para confirmar.');
  };

  const removeEtapa = (index, isGlobal) => {
    if (isGlobal) {
      setTrajetoGlobal(trajetoGlobal.filter((_, i) => i !== index));
    } else {
      setTrajetoIndividual(trajetoIndividual.filter((_, i) => i !== index));
    }
  };

  const updateEtapa = (index, field, value, isGlobal) => {
    const trajeto = isGlobal ? [...trajetoGlobal] : [...trajetoIndividual];
    
    if (field === 'minutos_espera_texto') {
      trajeto[index].minutos_espera = parseTempoParaMinutos(value);
    } else {
      trajeto[index][field] = value;
    }

    if (isGlobal) {
      setTrajetoGlobal(trajeto);
    } else {
      setTrajetoIndividual(trajeto);
    }
  };

  const updateTempoEtapa = (index, tipo, valor, isGlobal) => {
    const trajeto = isGlobal ? [...trajetoGlobal] : [...trajetoIndividual];
    const minutosAtuais = trajeto[index].minutos_espera || 0;
    
    // Converter minutos atuais para dias, horas e minutos
    const dias = Math.floor(minutosAtuais / 1440);
    const horas = Math.floor((minutosAtuais % 1440) / 60);
    const minutos = minutosAtuais % 60;
    
    let novosDias = dias;
    let novasHoras = horas;
    let novosMinutos = minutos;
    
    if (tipo === 'dias') novosDias = parseInt(valor) || 0;
    if (tipo === 'horas') novasHoras = parseInt(valor) || 0;
    if (tipo === 'minutos') novosMinutos = parseInt(valor) || 0;
    
    // Converter tudo para minutos
    const totalMinutos = (novosDias * 1440) + (novasHoras * 60) + novosMinutos;
    trajeto[index].minutos_espera = totalMinutos;
    
    if (isGlobal) {
      setTrajetoGlobal(trajeto);
    } else {
      setTrajetoIndividual(trajeto);
    }
  };

  const getTempoComponents = (minutos) => {
    const dias = Math.floor(minutos / 1440);
    const horas = Math.floor((minutos % 1440) / 60);
    const mins = minutos % 60;
    return { dias, horas, minutos: mins };
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex, isGlobal) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const trajeto = isGlobal ? [...trajetoGlobal] : [...trajetoIndividual];
    const draggedItem = trajeto[draggedIndex];
    
    // Remover item da posição original
    trajeto.splice(draggedIndex, 1);
    
    // Inserir na nova posição
    trajeto.splice(dropIndex, 0, draggedItem);

    if (isGlobal) {
      setTrajetoGlobal(trajeto);
      showMessage('success', 'Ordem alterada! Clique em "Salvar" para confirmar.');
    } else {
      setTrajetoIndividual(trajeto);
      showMessage('success', 'Ordem alterada! Clique em "Salvar" para confirmar.');
    }
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderEtapa = (etapa, index, isGlobal) => (
    <div 
      key={index} 
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index, isGlobal)}
      onDragEnd={handleDragEnd}
      className={`bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-move transition-all ${
        draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-gray-400" title="Arrastar para reordenar" />
          <span className="text-sm font-semibold text-gray-700">
            Etapa {index + 1}
          </span>
        </div>
        <button
          onClick={() => removeEtapa(index, isGlobal)}
          className="text-red-600 hover:text-red-800 transition"
          title="Remover etapa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Status Atual */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status Atual
          </label>
          <select
            value={etapa.status_atual}
            onChange={(e) => updateEtapa(index, 'status_atual', e.target.value, isGlobal)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {Object.entries(STATUS_PEDIDO).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Próximo Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Próximo Status
          </label>
          <select
            value={etapa.proximo_status}
            onChange={(e) => updateEtapa(index, 'proximo_status', e.target.value, isGlobal)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {Object.entries(STATUS_PEDIDO).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tempo de Espera */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          ⏱️ Tempo de Espera
        </label>
        <div className="grid grid-cols-3 gap-3">
          {/* Dias */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dias</label>
            <input
              type="number"
              min="0"
              max="30"
              value={getTempoComponents(etapa.minutos_espera).dias}
              onChange={(e) => updateTempoEtapa(index, 'dias', e.target.value, isGlobal)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Horas */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Horas</label>
            <input
              type="number"
              min="0"
              max="23"
              value={getTempoComponents(etapa.minutos_espera).horas}
              onChange={(e) => updateTempoEtapa(index, 'horas', e.target.value, isGlobal)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Minutos */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Minutos</label>
            <input
              type="number"
              min="0"
              max="59"
              value={getTempoComponents(etapa.minutos_espera).minutos}
              onChange={(e) => updateTempoEtapa(index, 'minutos', e.target.value, isGlobal)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Preview do tempo total */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Total: <strong className="text-primary">{formatarTempo(etapa.minutos_espera)}</strong>
          </span>
          <span className="text-xs text-gray-400">
            ({etapa.minutos_espera} minutos)
          </span>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Descrição (opcional)
        </label>
        <input
          type="text"
          value={etapa.descricao || ''}
          onChange={(e) => updateEtapa(index, 'descricao', e.target.value, isGlobal)}
          placeholder="Ex: Pedido urgente, entrega expressa..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Visualização */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
        <span className="font-medium">{STATUS_PEDIDO[etapa.status_atual]}</span>
        <ArrowRight className="w-4 h-4" />
        <span className="font-medium">{STATUS_PEDIDO[etapa.proximo_status]}</span>
        <span className="text-xs text-gray-500">
          em {formatarTempo(etapa.minutos_espera)}
        </span>
      </div>
    </div>
  );

  if (loading && trajetoGlobal.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Gerenciar Trajetos de Pedidos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure o fluxo de status dos pedidos
          </p>
        </div>

        {/* Status da Loja */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isStoreOpen 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {isStoreOpen ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Loja Aberta</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Loja Fechada</span>
            </>
          )}
        </div>
      </div>

      {/* Alerta de Horário */}
      {!isStoreOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Atualizações de status bloqueadas
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Os status dos pedidos não podem ser atualizados fora do horário de funcionamento da loja.
            </p>
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('global')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              mode === 'global'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-5 h-5" />
            Trajeto Padrão (Todos os Pedidos)
          </button>
          <button
            onClick={() => setMode('individual')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              mode === 'individual'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="w-5 h-5" />
            Trajeto Individual
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {mode === 'global' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Trajeto Padrão:</strong> Este trajeto será aplicado automaticamente a todos os novos pedidos.
            </p>
            <p className="text-xs text-blue-700 mt-2 flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              <span>Arraste as etapas para reordenar</span>
            </p>
          </div>

          {/* Etapas */}
          <div className="space-y-3">
            {trajetoGlobal.map((etapa, index) => renderEtapa(etapa, index, true))}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={() => openAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar Etapa
            </button>
            <button
              onClick={handleSaveGlobal}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Trajeto Padrão'}
            </button>
          </div>

          {/* Preview/Simulação do Trajeto */}
          {trajetoGlobal.length > 0 && (
            <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  📊 Simulação do Trajeto
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Visualize como o pedido fluirá através das etapas:
              </p>

              <div className="space-y-3">
                {trajetoGlobal.map((etapa, index) => {
                  const tempoTotal = trajetoGlobal
                    .slice(0, index + 1)
                    .reduce((acc, e) => acc + (e.minutos_espera || 0), 0);
                  
                  return (
                    <div key={index} className="relative">
                      {/* Linha conectora */}
                      {index < trajetoGlobal.length - 1 && (
                        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-blue-300 z-0" />
                      )}
                      
                      {/* Card da etapa */}
                      <div className="relative bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition z-10">
                        <div className="flex items-start gap-4">
                          {/* Número da etapa */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                            {index + 1}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {STATUS_PEDIDO[etapa.status_atual] || etapa.status_atual}
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                {STATUS_PEDIDO[etapa.proximo_status] || etapa.proximo_status}
                              </span>
                            </div>
                            
                            {etapa.descricao && (
                              <p className="text-sm text-gray-600 mb-2">
                                💬 {etapa.descricao}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                ⏱️ <strong>{formatarTempo(etapa.minutos_espera)}</strong> nesta etapa
                              </span>
                              <span className="flex items-center gap-1">
                                🕐 <strong>{formatarTempo(tempoTotal)}</strong> tempo total acumulado
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumo Final */}
              <div className="mt-6 bg-white rounded-lg shadow-md p-4 border-2 border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      ⏱️ Tempo Total Estimado
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Do pedido confirmado até a entrega
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatarTempo(
                        trajetoGlobal.reduce((acc, e) => acc + (e.minutos_espera || 0), 0)
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {trajetoGlobal.length} etapa{trajetoGlobal.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Trajeto Individual:</strong> Personalize o trajeto de um pedido específico. Isso sobrescreve o trajeto padrão apenas para este pedido.
            </p>
          </div>

          {/* Seletor de Pedido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Pedido
            </label>
            <select
              value={pedidoSelecionado || ''}
              onChange={(e) => setPedidoSelecionado(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecione um pedido...</option>
              {pedidos
                .filter(p => p.status !== 'entregue' && p.status !== 'cancelado')
                .map(pedido => (
                  <option key={pedido.id} value={pedido.id}>
                    #{pedido.numero_pedido} - {pedido.nome_cliente || 'Cliente'} - {STATUS_PEDIDO[pedido.status]}
                  </option>
                ))}
            </select>
          </div>

          {pedidoSelecionado && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-700 flex items-center gap-2">
                  <GripVertical className="w-4 h-4" />
                  <span>Arraste as etapas para reordenar</span>
                </p>
              </div>

              {/* Etapas */}
              <div className="space-y-3">
                {trajetoIndividual.map((etapa, index) => renderEtapa(etapa, index, false))}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => openAddModal(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Etapa
                </button>
                <button
                  onClick={handleSaveIndividual}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Salvando...' : 'Salvar Trajeto Individual'}
                </button>
                <button
                  onClick={handleResetIndividual}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resetar para Padrão
                </button>
              </div>

              {/* Preview/Simulação do Trajeto Individual */}
              {trajetoIndividual.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                      📊 Simulação do Trajeto Individual
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Visualize como este pedido específico fluirá através das etapas:
                  </p>

                  <div className="space-y-3">
                    {trajetoIndividual.map((etapa, index) => {
                      const tempoTotal = trajetoIndividual
                        .slice(0, index + 1)
                        .reduce((acc, e) => acc + (e.minutos_espera || 0), 0);
                      
                      return (
                        <div key={index} className="relative">
                          {/* Linha conectora */}
                          {index < trajetoIndividual.length - 1 && (
                            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-blue-300 z-0" />
                          )}
                          
                          {/* Card da etapa */}
                          <div className="relative bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition z-10">
                            <div className="flex items-start gap-4">
                              {/* Número da etapa */}
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                {index + 1}
                              </div>
                              
                              {/* Conteúdo */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                    {STATUS_PEDIDO[etapa.status_atual] || etapa.status_atual}
                                  </span>
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                    {STATUS_PEDIDO[etapa.proximo_status] || etapa.proximo_status}
                                  </span>
                                </div>
                                
                                {etapa.descricao && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    💬 {etapa.descricao}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    ⏱️ <strong>{formatarTempo(etapa.minutos_espera)}</strong> nesta etapa
                                  </span>
                                  <span className="flex items-center gap-1">
                                    🕐 <strong>{formatarTempo(tempoTotal)}</strong> tempo total acumulado
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo Final */}
                  <div className="mt-6 bg-white rounded-lg shadow-md p-4 border-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          ⏱️ Tempo Total Estimado
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Do pedido confirmado até a entrega
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatarTempo(
                            trajetoIndividual.reduce((acc, e) => acc + (e.minutos_espera || 0), 0)
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {trajetoIndividual.length} etapa{trajetoIndividual.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Adicionar Etapa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                Selecione a Etapa do Fluxo de Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Escolha uma transição de status configurada no fluxo
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Fluxo Normal */}
              {trajetoGlobal.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Fluxo Normal
                  </h4>
                  <div className="space-y-3">
                    {trajetoGlobal.map((etapa, index) => (
                      <button
                        key={index}
                        onClick={() => addEtapaFromStatus(etapa.status_atual, etapa.proximo_status)}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {STATUS_PEDIDO[etapa.status_atual] || etapa.status_atual}
                              </span>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                {STATUS_PEDIDO[etapa.proximo_status] || etapa.proximo_status}
                              </span>
                            </div>
                            {etapa.descricao && (
                              <p className="text-sm text-gray-600 mt-2">{etapa.descricao}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              ⏱️ Tempo estimado: {formatarTempo(etapa.minutos_espera)}
                            </p>
                          </div>
                          <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Especiais */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Status Especiais (Informações/Problemas)
                </h4>
                <div className="space-y-3">
                  {Object.entries(STATUS_ESPECIAIS).map(([key, label]) => {
                    // Definir cor baseado no tipo de status
                    const isInfo = key === 'motoboy_destino';
                    const isWarning = ['ocorrencia_entrega', 'aguardando_cliente', 'endereco_incorreto', 'cliente_ausente'].includes(key);
                    const isError = ['cancelado', 'problema'].includes(key);
                    
                    const borderColor = isInfo ? 'border-blue-200' : isWarning ? 'border-orange-200' : 'border-red-200';
                    const bgColor = isInfo ? 'bg-blue-50/50' : isWarning ? 'bg-orange-50/50' : 'bg-red-50/50';
                    const hoverBorder = isInfo ? 'hover:border-blue-400' : isWarning ? 'hover:border-orange-400' : 'hover:border-red-400';
                    const hoverBg = isInfo ? 'hover:bg-blue-100/50' : isWarning ? 'hover:bg-orange-100/50' : 'hover:bg-red-100/50';
                    const badgeBg = isInfo ? 'bg-blue-100' : isWarning ? 'bg-orange-100' : 'bg-red-100';
                    const badgeText = isInfo ? 'text-blue-700' : isWarning ? 'text-orange-700' : 'text-red-700';
                    const arrowColor = isInfo ? 'text-blue-400 group-hover:text-blue-600' : isWarning ? 'text-orange-400 group-hover:text-orange-600' : 'text-red-400 group-hover:text-red-600';
                    const plusColor = isInfo ? 'text-blue-400 group-hover:text-blue-600' : isWarning ? 'text-orange-400 group-hover:text-orange-600' : 'text-red-400 group-hover:text-red-600';
                    const icon = isInfo ? '📍' : isWarning ? '⚠️' : '❌';
                    
                    return (
                      <button
                        key={key}
                        onClick={() => addEtapaFromStatus('*', key)}
                        className={`w-full text-left p-4 border-2 ${borderColor} ${bgColor} rounded-lg ${hoverBorder} ${hoverBg} transition group`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                                Qualquer Status
                              </span>
                              <ArrowRight className={`w-5 h-5 ${arrowColor} transition`} />
                              <span className={`px-3 py-1 ${badgeBg} ${badgeText} rounded-full text-sm font-semibold`}>
                                {label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              {icon} Pode ser acessado de qualquer etapa do pedido
                            </p>
                          </div>
                          <Plus className={`w-5 h-5 ${plusColor} transition`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {trajetoGlobal.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Nenhuma etapa configurada no Fluxo de Status
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Configure as etapas primeiro na aba "Fluxo de Status"
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
