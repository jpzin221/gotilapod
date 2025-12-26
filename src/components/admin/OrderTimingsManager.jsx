import { useState, useEffect } from 'react';
import { Clock, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function OrderTimingsManager() {
  const [timings, setTimings] = useState([
    { step: 0, name: 'Pedido Recebido → Pagamento Aprovado', seconds: 8 },
    { step: 1, name: 'Pagamento Aprovado → Preparando Pedido', seconds: 10 },
    { step: 2, name: 'Preparando Pedido → Aguardando Coleta', seconds: 300 }, // 5 min
    { step: 3, name: 'Aguardando Coleta → Aguardando Transportadora', seconds: 600 }, // 10 min
    { step: 4, name: 'Aguardando Transportadora → Pedido Coletado', seconds: 900 }, // 15 min
    { step: 5, name: 'Pedido Coletado → Entregador Iniciou Rota', seconds: 300 }, // 5 min
    { step: 6, name: 'Entregador Iniciou Rota → Entregador Saiu', seconds: 180 }, // 3 min
    { step: 7, name: 'Entregador Saiu → Indo em Sua Direção', seconds: 600 }, // 10 min
    { step: 8, name: 'Indo em Sua Direção → Entregue', seconds: 900 }, // 15 min
  ]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTimings();
  }, []);

  const loadTimings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order_timings')
        .select('*')
        .order('step', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setTimings(data.map(t => ({
          step: t.step,
          name: t.name,
          seconds: t.seconds
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar tempos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Deletar todos os registros existentes
      await supabase.from('order_timings').delete().neq('step', -1);

      // Inserir novos registros
      const { error } = await supabase
        .from('order_timings')
        .insert(timings);

      if (error) throw error;

      alert('✅ Tempos salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tempos:', error);
      alert('❌ Erro ao salvar tempos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (step, value) => {
    setTimings(prev => prev.map(t => 
      t.step === step ? { ...t, seconds: parseInt(value) || 0 } : t
    ));
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      if (minutes > 0 && secs > 0) return `${hours}h ${minutes}m ${secs}s`;
      if (minutes > 0) return `${hours}h ${minutes}m`;
      if (secs > 0) return `${hours}h ${secs}s`;
      return `${hours}h`;
    }
    
    if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    
    return `${secs}s`;
  };
  
  // Converter segundos para formato de input (horas, minutos, segundos)
  const secondsToInputFormat = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { hours, minutes, seconds: secs };
  };
  
  // Converter input para segundos
  const inputFormatToSeconds = (hours, minutes, seconds) => {
    return (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  };

  const resetDefaults = () => {
    if (confirm('Deseja restaurar os tempos padrão?')) {
      setTimings([
        { step: 0, name: 'Pedido Recebido → Pagamento Aprovado', seconds: 8 },
        { step: 1, name: 'Pagamento Aprovado → Preparando Pedido', seconds: 10 },
        { step: 2, name: 'Preparando Pedido → Aguardando Coleta', seconds: 300 },
        { step: 3, name: 'Aguardando Coleta → Aguardando Transportadora', seconds: 600 },
        { step: 4, name: 'Aguardando Transportadora → Pedido Coletado', seconds: 900 },
        { step: 5, name: 'Pedido Coletado → Entregador Iniciou Rota', seconds: 300 },
        { step: 6, name: 'Entregador Iniciou Rota → Entregador Saiu', seconds: 180 },
        { step: 7, name: 'Entregador Saiu → Indo em Sua Direção', seconds: 600 },
        { step: 8, name: 'Indo em Sua Direção → Entregue', seconds: 900 },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" />
            Tempos de Transição das Etapas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure quanto tempo cada etapa leva para avançar automaticamente
          </p>
        </div>
        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          Restaurar Padrão
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Os tempos são aplicados automaticamente para todos os pedidos. 
          Configure tempos realistas para melhorar a experiência do cliente.
        </p>
      </div>

      <div className="space-y-3">
        {timings.map((timing) => (
          <div
            key={timing.step}
            className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-primary transition"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {timing.name}
                </label>
                <p className="text-xs text-gray-500">
                  Tempo atual: <span className="font-semibold text-primary">{formatTime(timing.seconds)}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Inputs de Tempo */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Horas</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={secondsToInputFormat(timing.seconds).hours}
                      onChange={(e) => {
                        const { minutes, seconds } = secondsToInputFormat(timing.seconds);
                        const newTotal = inputFormatToSeconds(e.target.value, minutes, seconds);
                        handleChange(timing.step, newTotal);
                      }}
                      className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-center font-bold"
                    />
                  </div>
                  
                  <span className="text-2xl text-gray-400 mt-5">:</span>
                  
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Minutos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={secondsToInputFormat(timing.seconds).minutes}
                      onChange={(e) => {
                        const { hours, seconds } = secondsToInputFormat(timing.seconds);
                        const newTotal = inputFormatToSeconds(hours, e.target.value, seconds);
                        handleChange(timing.step, newTotal);
                      }}
                      className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-center font-bold"
                    />
                  </div>
                  
                  <span className="text-2xl text-gray-400 mt-5">:</span>
                  
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Segundos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={secondsToInputFormat(timing.seconds).seconds}
                      onChange={(e) => {
                        const { hours, minutes } = secondsToInputFormat(timing.seconds);
                        const newTotal = inputFormatToSeconds(hours, minutes, e.target.value);
                        handleChange(timing.step, newTotal);
                      }}
                      className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-center font-bold"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center bg-primary/10 px-4 py-2 rounded-lg min-w-[100px]">
                  <span className="text-xs text-gray-600">Tempo Total</span>
                  <span className="text-sm font-bold text-primary">{formatTime(timing.seconds)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Atenção:</strong> As mudanças afetarão apenas os novos pedidos. 
          Pedidos em andamento manterão os tempos configurados no momento da criação.
        </p>
      </div>
    </div>
  );
}
