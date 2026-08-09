import { useState, useEffect } from 'react';
import {
  Loader2, Plus, Trash2, Edit2, Check, X, Eye, EyeOff,
  Ticket, BarChart3, Users, DollarSign, TrendingUp, Calendar,
  Search, ChevronDown, ChevronUp, Copy
} from 'lucide-react';
import { couponService } from '../../lib/supabase';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeView, setActiveView] = useState('coupons'); // 'coupons' | 'report'
  const [expandedCoupon, setExpandedCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_percent: '',
    discount_amount: '',
    min_order_value: '0',
    max_uses: '',
    is_active: true,
    expires_at: '',
    applies_to: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponsData, statsData] = await Promise.all([
        couponService.getAll(),
        couponService.getStats()
      ]);
      setCoupons(couponsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_percent: coupon.discount_percent || '',
      discount_amount: coupon.discount_amount || '',
      min_order_value: coupon.min_order_value || '0',
      max_uses: coupon.max_uses || '',
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
      applies_to: coupon.applies_to || 'all'
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      code: '',
      description: '',
      discount_percent: '10',
      discount_amount: '',
      min_order_value: '0',
      max_uses: '',
      is_active: true,
      expires_at: '',
      applies_to: 'all'
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(editingId || 'new');
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        min_order_value: parseFloat(formData.min_order_value) || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null
      };

      if (editingId) {
        await couponService.update(editingId, data);
      } else {
        await couponService.create(data);
      }

      await loadData();
      setShowForm(false);
      setEditingId(null);
      setFormData({});
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) return;
    try {
      await couponService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await couponService.update(coupon.id, { is_active: !coupon.is_active });
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const formatCurrency = (v) => `R$ ${(parseFloat(v) || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-purple-500" />
            Cupons de Desconto
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Gerencie cupons e acompanhe o desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('coupons')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeView === 'coupons'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Ticket className="w-4 h-4 inline mr-1" />
            Cupons
          </button>
          <button
            onClick={() => setActiveView('report')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeView === 'report'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Relatorio
          </button>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Cupom
          </button>
        </div>
      </div>

      {/* Formulario de Criar/Editar */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            {editingId ? 'Editar Cupom' : 'Novo Cupom'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Codigo *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="EX: PRIMEIRA10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Descricao
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: 10% OFF primeira compra"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Desconto (%) OU Valor Fixo (R$)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value, discount_amount: '' })}
                  placeholder="%"
                  min="0"
                  max="100"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
                <span className="flex items-center text-gray-500">ou</span>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value, discount_percent: '' })}
                  placeholder="R$"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Valor Minimo (R$)
              </label>
              <input
                type="number"
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Limite de Usos
              </label>
              <input
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Ilimitado"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Data de Expiracao
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Aplica-se a
              </label>
              <select
                value={formData.applies_to}
                onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos os produtos</option>
                <option value="first_order">Apenas primeira compra</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-purple-500 rounded"
                />
                <div>
                  <span className="font-semibold text-gray-800 dark:text-white">Ativo</span>
                  <p className="text-xs text-gray-500">Cupom disponivel para uso</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.code}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {editingId ? 'Salvar Alteracoes' : 'Criar Cupom'}
            </button>
          </div>
        </div>
      )}

      {/* Vista: Cupons */}
      {activeView === 'coupons' && (
        <div className="grid gap-4">
          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cupom criado ainda</p>
            </div>
          ) : (
            coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden transition-all ${
                  coupon.is_active
                    ? 'border-purple-300 dark:border-purple-600'
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      coupon.is_active ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-400'
                    }`}>
                      <Ticket className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">{coupon.code}</h3>
                        {coupon.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-semibold">Ativo</span>
                        )}
                        {!coupon.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">Inativo</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{coupon.description || 'Sem descricao'}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>{coupon.discount_percent ? `${coupon.discount_percent}% OFF` : `R$ ${coupon.discount_amount} OFF`}</span>
                        <span>Usos: {coupon.used_count || 0}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                        {coupon.expires_at && (
                          <span>Expira: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedCoupon(expandedCoupon === coupon.id ? null : coupon.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                    >
                      {expandedCoupon === coupon.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                        coupon.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {coupon.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expandedCoupon === coupon.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Desconto</p>
                        <p className="font-bold text-purple-600">{coupon.discount_percent ? `${coupon.discount_percent}%` : `R$ ${coupon.discount_amount}`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valor Minimo</p>
                        <p className="font-bold text-gray-700">{formatCurrency(coupon.min_order_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total de Usos</p>
                        <p className="font-bold text-blue-600">{coupon.used_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Receita Gerada</p>
                        <p className="font-bold text-green-600">{formatCurrency(stats?.usesByCoupon?.find(u => u.id === coupon.id)?.totalRevenue || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Vista: Relatorio */}
      {activeView === 'report' && stats && (
        <div className="space-y-6">
          {/* Cards de metricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Cupons</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalCoupons}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total de Usos</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalUses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Descontos Dados</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDiscountGiven)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenueFromCoupons)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">ROI dos Cupons</p>
                <p className="text-3xl font-bold">
                  {stats.totalDiscountGiven > 0
                    ? `${(((stats.totalRevenueFromCoupons - stats.totalDiscountGiven) / stats.totalDiscountGiven) * 100).toFixed(0)}%`
                    : 'N/A'}
                </p>
                <p className="text-green-100 text-xs mt-1">
                  (Receita - Descontos) / Descontos
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-white/50" />
            </div>
          </div>

          {/* Usos por cupom */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Desempenho por Cupom
            </h3>
            <div className="space-y-3">
              {stats.usesByCoupon.filter(c => c.uses > 0).length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum cupom utilizado ainda</p>
              ) : (
                stats.usesByCoupon.filter(c => c.uses > 0).map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white">{coupon.code}</p>
                        <p className="text-xs text-gray-500">{coupon.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 dark:text-white">{coupon.uses} usos</p>
                      <p className="text-xs text-green-600">{formatCurrency(coupon.totalRevenue)} receita</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historico de usos recentes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Uso Recente
            </h3>
            {stats.recentUses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum uso registrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500 font-semibold">Data</th>
                      <th className="text-left py-2 text-gray-500 font-semibold">Cupom</th>
                      <th className="text-left py-2 text-gray-500 font-semibold">Telefone</th>
                      <th className="text-left py-2 text-gray-500 font-semibold">Desconto</th>
                      <th className="text-left py-2 text-gray-500 font-semibold">Total</th>
                      <th className="text-left py-2 text-gray-500 font-semibold">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUses.slice(0, 20).map((use) => (
                      <tr key={use.id} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2 text-gray-600 dark:text-gray-400">
                          {new Date(use.created_at).toLocaleDateString('pt-BR')} {new Date(use.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-semibold">
                            {use.coupons?.code || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{use.user_phone || '-'}</td>
                        <td className="py-2 text-red-600 font-semibold">-{formatCurrency(use.discount_applied)}</td>
                        <td className="py-2 text-green-600 font-semibold">{formatCurrency(use.order_total)}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            use.source === 'exit_intent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {use.source === 'exit_intent' ? 'Exit Intent' : use.source || 'Manual'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
