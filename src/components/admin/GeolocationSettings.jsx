import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { storeService } from '../../lib/supabase';
import { SEDE_BASE } from '../../services/geolocation-service';

export default function GeolocationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [settings, setSettings] = useState({
    delivery_radius_km: 50,
    nearby_cities_radius_km: 100,
    show_distance_banner: true,
    sede_latitude: SEDE_BASE.lat,
    sede_longitude: SEDE_BASE.lon,
    sede_cidade: SEDE_BASE.cidade,
    sede_estado: SEDE_BASE.estado
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await storeService.getSettings();
      
      if (data) {
        setSettings(prev => ({
          ...prev,
          delivery_radius_km: data.delivery_radius_km || prev.delivery_radius_km,
          nearby_cities_radius_km: data.nearby_cities_radius_km || prev.nearby_cities_radius_km,
          show_distance_banner: data.show_distance_banner ?? prev.show_distance_banner,
          sede_latitude: data.sede_latitude || prev.sede_latitude,
          sede_longitude: data.sede_longitude || prev.sede_longitude,
          sede_cidade: data.sede_cidade || prev.sede_cidade,
          sede_estado: data.sede_estado || prev.sede_estado
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      await storeService.updateSettings(settings);
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      
      // Atualizar o arquivo de serviço
      console.log('💾 Configurações salvas:', settings);
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Configurações de Geolocalização
              </h2>
              <p className="text-gray-600 text-sm">
                Configure raios de entrega e detecção de cidades próximas
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className={`mx-6 mt-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Sede Base */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Localização da Sede
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={settings.sede_latitude}
                  onChange={(e) => handleChange('sede_latitude', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="-25.4284"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={settings.sede_longitude}
                  onChange={(e) => handleChange('sede_longitude', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="-49.2733"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={settings.sede_cidade}
                  onChange={(e) => handleChange('sede_cidade', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Curitiba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={settings.sede_estado}
                  onChange={(e) => handleChange('sede_estado', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="PR"
                  maxLength={2}
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-3">
              💡 <strong>Dica:</strong> Use o Google Maps para obter as coordenadas exatas. 
              Clique com botão direito no mapa → "O que há aqui?"
            </p>
          </div>

          {/* Raio de Entrega */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              🚚 Raio de Entrega (km)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={settings.delivery_radius_km}
                onChange={(e) => handleChange('delivery_radius_km', parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-lg min-w-[80px] text-center">
                {settings.delivery_radius_km} km
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Define até quantos km da sede você realiza entregas. Clientes além desse raio verão aviso de verificação de disponibilidade.
            </p>
          </div>

          {/* Raio de Cidades Próximas */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              🏙️ Raio de Detecção de Cidades Próximas (km)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={settings.nearby_cities_radius_km}
                onChange={(e) => handleChange('nearby_cities_radius_km', parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-lg min-w-[80px] text-center">
                {settings.nearby_cities_radius_km} km
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Define o raio máximo para considerar uma cidade como "próxima". Usado para personalizar mensagens e filtros.
            </p>
            
            {/* Exemplos visuais */}
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${settings.nearby_cities_radius_km <= 8 ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-600">
                  0-8km: <strong className="text-orange-600">Banner laranja</strong> - "Mesma cidade! Entrega ultra rápida"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${settings.nearby_cities_radius_km > 8 && settings.nearby_cities_radius_km <= 50 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-600">
                  9-{Math.min(50, settings.nearby_cities_radius_km)}km: <strong className="text-green-600">Banner verde</strong> - "Atendemos sua região"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${settings.nearby_cities_radius_km > 50 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-600">
                  {Math.min(51, settings.nearby_cities_radius_km)}+km: <strong className="text-blue-600">Banner padrão</strong> - "Verificar disponibilidade"
                </span>
              </div>
            </div>
          </div>

          {/* Mostrar Banner de Distância */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_distance_banner}
                onChange={(e) => handleChange('show_distance_banner', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">
                  Exibir Banner de Distância
                </span>
                <p className="text-xs text-gray-600">
                  Mostra um banner no topo do site com a localização detectada do cliente e a distância até sua sede
                </p>
              </div>
            </label>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">ℹ️ Informações Importantes</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>As coordenadas da sede são usadas para calcular a distância até os clientes</li>
              <li>O raio de entrega define a área onde você oferece entregas diretas</li>
              <li>Clientes fora do raio verão mensagem de verificação de disponibilidade</li>
              <li>As configurações afetam os banners e filtros do site em tempo real</li>
              <li>Cache de localização: 24 horas (usuário pode limpar manualmente)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
