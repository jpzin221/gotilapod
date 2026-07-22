import { useState, useEffect } from 'react';
import { Tag, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { promotionBannerService } from '../../lib/supabase';

export default function PromotionBannerManager() {
  const [settings, setSettings] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    footer_text: '',
    is_active: true,
    gradient_start: '#dc2626',
    gradient_end: '#16a34a',
    border_color: '#facc15',
    text_color: '#ffffff',
    footer_bg: '#fef2f2',
    footer_border: '#fca5a5',
    footer_text_color: '#1f2937'
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
        is_active: settings.is_active,
        gradient_start: settings.gradient_start,
        gradient_end: settings.gradient_end,
        border_color: settings.border_color,
        text_color: settings.text_color,
        footer_bg: settings.footer_bg,
        footer_border: settings.footer_border,
        footer_text_color: settings.footer_text_color
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
        <div style={{
          background: `linear-gradient(to right, ${settings.gradient_start}, ${settings.gradient_end})`,
          borderColor: settings.border_color
        }} className="rounded-2xl p-6 border-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: settings.text_color }}>
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
        <div style={{
          background: settings.footer_bg,
          borderColor: settings.footer_border
        }} className="mt-3 border-2 rounded-lg p-3 text-center">
          <p style={{ color: settings.footer_text_color }} className="text-sm">
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

        {/* Cores do Banner */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🎨 Cores do Banner</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gradiente Início</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.gradient_start} onChange={(e) => setSettings({...settings, gradient_start: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.gradient_start}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gradiente Fim</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.gradient_end} onChange={(e) => setSettings({...settings, gradient_end: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.gradient_end}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cor da Borda</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.border_color} onChange={(e) => setSettings({...settings, border_color: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.border_color}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cor do Texto</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.text_color} onChange={(e) => setSettings({...settings, text_color: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.text_color}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fundo Rodapé</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.footer_bg} onChange={(e) => setSettings({...settings, footer_bg: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.footer_bg}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Borda Rodapé</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.footer_border} onChange={(e) => setSettings({...settings, footer_border: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.footer_border}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Texto Rodapé</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.footer_text_color} onChange={(e) => setSettings({...settings, footer_text_color: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400">{settings.footer_text_color}</span>
              </div>
            </div>
          </div>
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
