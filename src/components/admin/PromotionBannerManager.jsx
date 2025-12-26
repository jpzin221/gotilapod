import { useState, useEffect } from 'react';
import { Tag, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { promotionBannerService } from '../../lib/supabase';

export default function PromotionBannerManager() {
  const [settings, setSettings] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    footer_text: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await promotionBannerService.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações do banner' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      await promotionBannerService.updateSettings({
        title: settings.title,
        subtitle: settings.subtitle,
        badge_text: settings.badge_text,
        footer_text: settings.footer_text,
        is_active: settings.is_active
      });

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Tag className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Banner de Promoções</h2>
      </div>

      {/* Mensagens de feedback */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Preview do Banner */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-xs text-gray-500 mb-3 font-semibold">PREVIEW:</p>
        <div className="bg-gradient-to-r from-red-600 via-green-600 to-red-700 rounded-2xl p-6 border-4 border-yellow-400">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {settings.title || 'Título do Banner'}
                </h2>
                <p className="text-white/90 text-sm">
                  {settings.subtitle || 'Subtítulo do banner'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Tag className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">X Produtos</span>
            </div>
          </div>
        </div>
        <div className="mt-3 bg-gradient-to-r from-red-50 via-green-50 to-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-700">
            {settings.footer_text || 'Texto do rodapé'}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Título Principal
          </label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: 🎄 Promoções de Fim de Ano 🎅"
          />
          <p className="text-xs text-gray-500 mt-1">
            Dica: Use emojis para deixar mais atrativo! 🎉 🔥 ⭐
          </p>
        </div>

        {/* Subtítulo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subtítulo
          </label>
          <input
            type="text"
            value={settings.subtitle}
            onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: Celebre as festas com os melhores preços!"
          />
        </div>

        {/* Badge do Produto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Texto do Badge (aparece em cada produto)
          </label>
          <input
            type="text"
            value={settings.badge_text}
            onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: 🎁 OFERTA NATAL"
          />
        </div>

        {/* Texto do Rodapé */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Texto do Rodapé
          </label>
          <input
            type="text"
            value={settings.footer_text}
            onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: 🎉 Aproveite as festas! Ofertas especiais de fim de ano"
          />
        </div>

        {/* Ativo/Inativo */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.is_active}
              onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
            />
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Banner Ativo
              </span>
              <p className="text-xs text-gray-500">
                Quando desativado, a seção de promoções não aparecerá no site
              </p>
            </div>
          </label>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
