import { useState, useEffect } from 'react';
import { 
  Save, Plus, Trash2, GripVertical, AlertCircle, CheckCircle, 
  Package, Clock, TrendingUp, Truck, MapPin, XCircle, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function FluxoStatusManager() {
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Ícones disponíveis
  const iconesDisponiveis = [
    { value: 'CheckCircle', label: 'Check', component: CheckCircle },
    { value: 'Package', label: 'Pacote', component: Package },
    { value: 'Clock', label: 'Relógio', component: Clock },
    { value: 'TrendingUp', label: 'Tendência', component: TrendingUp },
    { value: 'Truck', label: 'Caminhão', component: Truck },
    { value: 'MapPin', label: 'Localização', component: MapPin },
    { value: 'XCircle', label: 'Erro', component: XCircle },
    { value: 'FileText', label: 'Documento', component: FileText },
  ];

  // Etapas padrão (template inicial)
  const etapasPadrao = [
    { ordem: 1, titulo: 'Pedido recebido', descricao: 'Recebemos seu pedido', icone: 'CheckCircle', ativo: true, is_error: false, is_final: false },
    { ordem: 2, titulo: 'Pagamento aprovado', descricao: 'Pagamento confirmado', icone: 'TrendingUp', ativo: true, is_error: false, is_final: false },
    { ordem: 3, titulo: 'Preparando pedido', descricao: 'Separando produtos', icone: 'Package', ativo: true, is_error: false, is_final: false },
    { ordem: 4, titulo: 'Nota fiscal emitida', descricao: 'Nota fiscal gerada', icone: 'FileText', ativo: true, is_error: false, is_final: false },
    { ordem: 5, titulo: 'Aguardando coleta da transportadora', descricao: 'Aguardando coleta', icone: 'Clock', ativo: true, is_error: false, is_final: false },
    { ordem: 6, titulo: 'Pedido coletado pela transportadora', descricao: 'Transportadora: XP LOG - Credencial 14729B', icone: 'CheckCircle', ativo: true, is_error: false, is_final: false },
    { ordem: 7, titulo: 'Em trânsito para centro de distribuição', descricao: 'A caminho do CD', icone: 'Truck', ativo: true, is_error: false, is_final: false },
    { ordem: 8, titulo: 'Chegou ao centro de distribuição', descricao: 'No centro de distribuição', icone: 'MapPin', ativo: true, is_error: false, is_final: false },
    { ordem: 9, titulo: 'O motoboy parceiro iniciou a rota de entrega', descricao: 'Rota de entrega iniciada', icone: 'TrendingUp', ativo: true, is_error: false, is_final: false },
    { ordem: 10, titulo: 'Saiu para entrega', descricao: 'Em rota de entrega', icone: 'Truck', ativo: true, is_error: false, is_final: false },
    { ordem: 11, titulo: 'O motoboy tem como destino sua localização', descricao: 'Indo para seu endereço', icone: 'MapPin', ativo: true, is_error: false, is_final: false },
    { ordem: 12, titulo: 'Pedido entregue', descricao: 'Pedido entregue com sucesso', icone: 'CheckCircle', ativo: true, is_error: false, is_final: true },
    { ordem: 13, titulo: '⚠️ Ocorrência com a entrega', descricao: 'O motoboy parceiro relatou um problema inesperado durante a entrega. Nosso suporte foi acionado.', icone: 'XCircle', ativo: false, is_error: true, is_final: false },
  ];

  useEffect(() => {
    carregarEtapas();
  }, []);

  const carregarEtapas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('fluxo_status_rastreamento')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setEtapas(data);
      } else {
        // Se não houver etapas, usar padrão
        setEtapas(etapasPadrao);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      showMessage('error', 'Erro ao carregar etapas');
      setEtapas(etapasPadrao);
    } finally {
      setLoading(false);
    }
  };

  const salvarEtapas = async () => {
    try {
      setSaving(true);

      // Deletar todas as etapas existentes
      const { error: deleteError } = await supabase
        .from('fluxo_status_rastreamento')
        .delete()
        .neq('id', 0); // Deleta todos

      if (deleteError) throw deleteError;

      // Inserir novas etapas
      const etapasParaSalvar = etapas.map((etapa, index) => ({
        ordem: index + 1,
        titulo: etapa.titulo,
        descricao: etapa.descricao,
        icone: etapa.icone,
        ativo: etapa.ativo,
        is_error: etapa.is_error || false,
        is_final: etapa.is_final || false
      }));

      const { error: insertError } = await supabase
        .from('fluxo_status_rastreamento')
        .insert(etapasParaSalvar);

      if (insertError) throw insertError;

      showMessage('success', 'Fluxo de status salvo com sucesso!');
      carregarEtapas();
    } catch (error) {
      console.error('Erro ao salvar etapas:', error);
      showMessage('error', 'Erro ao salvar fluxo de status');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const adicionarEtapa = () => {
    const novaEtapa = {
      ordem: etapas.length + 1,
      titulo: 'Nova Etapa',
      descricao: 'Descrição da etapa',
      icone: 'CheckCircle',
      ativo: true,
      is_error: false,
      is_final: false
    };
    setEtapas([...etapas, novaEtapa]);
  };

  const removerEtapa = (index) => {
    if (window.confirm('Deseja realmente remover esta etapa?')) {
      const novasEtapas = etapas.filter((_, i) => i !== index);
      setEtapas(novasEtapas);
    }
  };

  const atualizarEtapa = (index, campo, valor) => {
    const novasEtapas = [...etapas];
    novasEtapas[index][campo] = valor;
    setEtapas(novasEtapas);
  };

  const restaurarPadrao = () => {
    if (window.confirm('Deseja restaurar o fluxo padrão? Isso irá substituir todas as etapas atuais.')) {
      setEtapas(etapasPadrao);
      showMessage('success', 'Fluxo padrão restaurado! Clique em "Salvar" para confirmar.');
    }
  };

  // Drag and Drop
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const novasEtapas = [...etapas];
    const draggedItem = novasEtapas[draggedIndex];
    
    novasEtapas.splice(draggedIndex, 1);
    novasEtapas.splice(dropIndex, 0, draggedItem);

    setEtapas(novasEtapas);
    setDraggedIndex(null);
    showMessage('success', 'Ordem alterada! Clique em "Salvar" para confirmar.');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
          <h2 className="text-3xl font-bold text-gray-800">Fluxo de Status de Rastreamento</h2>
          <p className="text-gray-600 mt-1">
            Configure as etapas que aparecem para o cliente na página de rastreamento
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={restaurarPadrao}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Restaurar Padrão
          </button>
          <button
            onClick={salvarEtapas}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Fluxo'}
          </button>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? 
              <CheckCircle className="w-5 h-5" /> : 
              <AlertCircle className="w-5 h-5" />
            }
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Dica */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Dicas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Arraste as etapas para reordenar</li>
              <li>Desative etapas que não deseja mostrar (ex: ocorrências)</li>
              <li>A ordem aqui define a ordem que aparece para o cliente</li>
              <li>Etapas inativas não aparecem no rastreamento</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lista de Etapas */}
      <div className="space-y-3">
        {etapas.map((etapa, index) => {
          const IconeComponent = iconesDisponiveis.find(i => i.value === etapa.icone)?.component || CheckCircle;
          
          return (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border rounded-lg p-4 transition-all ${
                draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'
              } ${!etapa.ativo ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div className="flex items-center gap-2 pt-2">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                </div>

                {/* Ícone Preview */}
                <div className="pt-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconeComponent className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Campos */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Título */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        value={etapa.titulo}
                        onChange={(e) => atualizarEtapa(index, 'titulo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        placeholder="Título da etapa"
                      />
                    </div>

                    {/* Ícone */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Ícone
                      </label>
                      <select
                        value={etapa.icone}
                        onChange={(e) => atualizarEtapa(index, 'icone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      >
                        {iconesDisponiveis.map(icone => (
                          <option key={icone.value} value={icone.value}>
                            {icone.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={etapa.descricao}
                      onChange={(e) => atualizarEtapa(index, 'descricao', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Descrição da etapa"
                      rows="2"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={etapa.ativo}
                        onChange={(e) => atualizarEtapa(index, 'ativo', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label className="text-sm text-gray-700">
                        ✅ Etapa ativa
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={etapa.is_error || false}
                        onChange={(e) => atualizarEtapa(index, 'is_error', e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <label className="text-sm text-gray-700">
                        ⚠️ Etapa de erro
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={etapa.is_final || false}
                        onChange={(e) => atualizarEtapa(index, 'is_final', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label className="text-sm text-gray-700">
                        🏁 Etapa final
                      </label>
                    </div>
                  </div>
                  
                  {/* Dicas */}
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p><strong>Ativa:</strong> Aparece no fluxo normal</p>
                    <p><strong>Erro:</strong> Aparece quando necessário (mesmo inativa)</p>
                    <p><strong>Final:</strong> Última etapa (ex: Entregue) - removida se houver erro</p>
                  </div>
                </div>

                {/* Botão Remover */}
                <button
                  onClick={() => removerEtapa(index)}
                  className="text-red-600 hover:text-red-800 transition p-2"
                  title="Remover etapa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Adicionar */}
      <button
        onClick={adicionarEtapa}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Adicionar Nova Etapa
      </button>
    </div>
  );
}
