import { useState, useEffect } from 'react';
import {
  Loader2, ShoppingCart, Clock, Send, Check, X, Settings, BarChart3,
  Phone, MessageSquare, Eye, Play, Pause, Trash2, Search, RefreshCw,
  AlertCircle, CheckCircle, XCircle, Timer, Users, DollarSign, TrendingUp
} from 'lucide-react';

export default function AbandonedCartsManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [carts, setCarts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [manualCartId, setManualCartId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [configForm, setConfigForm] = useState({});

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [statsRes, cartsRes, historyRes, configRes] = await Promise.all([
        fetch('/api/abandoned-carts/stats').then(r => r.json()),
        fetch('/api/abandoned-carts/stats').then(r => r.json()), // Reutilizar
        fetch('/api/abandoned-carts/history?limit=100').then(r => r.json()),
        fetch('/api/whatsapp/config').then(r => r.json())
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (historyRes.messages) setMessages(historyRes.messages);
      if (configRes.config) {
        setConfig(configRes.config);
        setConfigForm(configRes.config);
      }

      // Buscar carrinhos diretamente do Supabase
      const { supabase } = await import('../../lib/supabase');
      const { data: cartsData } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false });
      if (cartsData) setCarts(cartsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('Configuracao salva com sucesso!');
        loadAll();
      } else {
        alert('Erro ao salvar: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuracao');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone || !testMessage) {
      alert('Preencha telefone e mensagem');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage })
      });
      const data = await res.json();
      alert(data.success ? 'Mensagem enviada com sucesso!' : 'Erro: ' + data.error);
    } catch (error) {
      alert('Erro ao enviar mensagem de teste');
    } finally {
      setTesting(false);
    }
  };

  const handleSendManual = async () => {
    if (!manualPhone || !manualMessage) {
      alert('Preencha telefone e mensagem');
      return;
    }
    try {
      const res = await fetch('/api/whatsapp/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: manualCartId || null,
          phone: manualPhone,
          message: manualMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Mensagem enviada!');
        setManualPhone('');
        setManualMessage('');
        setManualCartId('');
        loadAll();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao enviar mensagem');
    }
  };

  const handleSendNow = async (cartId) => {
    try {
      const res = await fetch('/api/abandoned-carts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId })
      });
      const data = await res.json();
      alert(data.success ? 'Mensagem enviada!' : 'Erro: ' + data.error);
      loadAll();
    } catch (error) {
      alert('Erro ao enviar');
    }
  };

  const formatCurrency = (v) => `R$ ${(parseFloat(v) || 0).toFixed(2)}`;
  const formatTime = (date) => {
    if (!date) return '-';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}min`;
  };

  const filteredCarts = carts.filter(c =>
    c.phone?.includes(searchTerm.replace(/\D/g, '')) ||
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    converted: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500'
  };

  const statusLabels = {
    pending: 'Pendente',
    contacted: 'Contatado',
    converted: 'Convertido',
    expired: 'Expirado'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-green-500" />
            Carrinhos Abandonados
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Recupere vendas via WhatsApp
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['dashboard', 'queue', 'history', 'manual', 'config'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {{ dashboard: '📊 Dashboard', queue: '📨 Fila', history: '📋 Historico', manual: '✏️ Manual', config: '⚙️ Config' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contatados</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.contacted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Convertidos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recuperado</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRecovered)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Taxa de Conversao</p>
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                <p className="text-green-100 text-xs mt-1">
                  {stats.converted} de {stats.total} carrinhos recuperados
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-white/50" />
            </div>
          </div>
        </div>
      )}

      {/* Fila de Envio */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por telefone ou nome..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
              />
            </div>
            <button onClick={loadAll} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {filteredCarts.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum carrinho encontrado</p>
              </div>
            ) : (
              filteredCarts.slice(0, 50).map(cart => (
                <div key={cart.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">
                          {cart.customer_name || 'Cliente'} - {cart.phone}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cart.cart_items?.length || 0} itens • {formatCurrency(cart.cart_total)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[cart.status]}`}>
                            {statusLabels[cart.status]}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            Abandonou ha {formatTime(cart.first_attempt_at)}
                          </span>
                          {cart.attempts > 0 && (
                            <span className="text-[10px] text-gray-400">
                              • {cart.attempts} tentativa(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cart.status === 'pending' && (
                        <button
                          onClick={() => handleSendNow(cart.id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-green-600"
                        >
                          <Send className="w-3 h-3" />
                          Enviar Agora
                        </button>
                      )}
                      {cart.status === 'contacted' && (
                        <span className="text-xs text-blue-600 font-semibold">Aguardando resposta</span>
                      )}
                      {cart.status === 'converted' && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Convertido!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Historico */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Mensagens Enviadas ({messages.length})
            </h3>

            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma mensagem enviada ainda</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {messages.map(msg => (
                  <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${msg.status === 'sent' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{msg.phone}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          msg.sent_by === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {msg.sent_by === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.sent_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Envio Manual */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Enviar Mensagem Manual
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="5544999887766"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mensagem</label>
                <textarea
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <button
                onClick={handleSendManual}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Mensagem
              </button>
            </div>
          </div>

          {/* Templates rapidos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">Templates Rapidos</h3>
            <div className="space-y-2">
              {[
                { name: 'Lembrete', msg: 'Oi! Vi que voce deixou uns produtos no carrinho na GorilaPod. Ainda da tempo de garantir os seus! 😍' },
                { name: 'Urgencia', msg: 'Ei! Seus produtos estao acabando! Garanta os seus antes que esgote! 🚀' },
                { name: 'Desconto', msg: 'Psst! Ganhe 10% OFF na sua compra! Use o cupom VOLTE10 no checkout! 🎉' }
              ].map((template, i) => (
                <button
                  key={i}
                  onClick={() => setManualMessage(template.msg)}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{template.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{template.msg}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuracao */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500" />
              Configuracao WhatsApp (Evolution API)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">URL da API</label>
                <input
                  type="url"
                  value={configForm.api_url || ''}
                  onChange={(e) => setConfigForm({ ...configForm, api_url: e.target.value })}
                  placeholder="https://sua-app.onrender.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={configForm.api_key || ''}
                  onChange={(e) => setConfigForm({ ...configForm, api_key: e.target.value })}
                  placeholder="Sua API Key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome da Instancia</label>
                <input
                  type="text"
                  value={configForm.instance_name || ''}
                  onChange={(e) => setConfigForm({ ...configForm, instance_name: e.target.value })}
                  placeholder="gorilapod"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Telefone Conectado</label>
                <input
                  type="text"
                  value={configForm.phone_number || ''}
                  onChange={(e) => setConfigForm({ ...configForm, phone_number: e.target.value })}
                  placeholder="5544999887766"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Delay (minutos apos abandono)</label>
                <input
                  type="number"
                  value={configForm.reminder_delay_minutes || 30}
                  onChange={(e) => setConfigForm({ ...configForm, reminder_delay_minutes: parseInt(e.target.value) })}
                  min="5"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Maximo de Tentativas</label>
                <input
                  type="number"
                  value={configForm.max_reminders || 2}
                  onChange={(e) => setConfigForm({ ...configForm, max_reminders: parseInt(e.target.value) })}
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.is_active || false}
                    onChange={(e) => setConfigForm({ ...configForm, is_active: e.target.checked })}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-white">Ativar Sistema</span>
                    <p className="text-xs text-gray-600">Enviar mensagens automaticas de recuperacao</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem 1 (Primeiro contato)
                </label>
                <textarea
                  value={configForm.welcome_message || ''}
                  onChange={(e) => setConfigForm({ ...configForm, welcome_message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1">Variaveis: {'{nome}'} {'{itens}'} {'{total}'} {'{link}'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem 2 (Reforco)
                </label>
                <textarea
                  value={configForm.followup_message || ''}
                  onChange={(e) => setConfigForm({ ...configForm, followup_message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar Configuracao
              </button>
            </div>
          </div>

          {/* Teste de conexao */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Testar Conexao</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Seu telefone"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
              />
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Mensagem de teste"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
              />
              <button
                onClick={handleTestWhatsApp}
                disabled={testing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Testar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
