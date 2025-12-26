import { MapPin, Loader2, CheckCircle, Bike } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGeolocation, calculateDistance, formatDistance } from '../hooks/useGeolocation';
import { physicalStoresService } from '../lib/supabase';
import { obterLocalizacaoPrecisa } from '../services/geolocation-service';

export default function LocationHeader({ storeLocation, deliveryRadius = 15 }) {
  const userLocation = useGeolocation();
  const [nearestStore, setNearestStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(false);
  const [localizacaoIP, setLocalizacaoIP] = useState(null);
  const [loadingIP, setLoadingIP] = useState(true);

  // Buscar localização por IP
  useEffect(() => {
    const fetchLocationIP = async () => {
      try {
        const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });
        setLocalizacaoIP(loc);
      } catch (error) {
        console.error('Erro ao buscar localização por IP:', error);
      } finally {
        setLoadingIP(false);
      }
    };
    fetchLocationIP();
  }, []);

  // Buscar loja física mais próxima quando tiver localização do usuário
  useEffect(() => {
    if (userLocation.latitude && userLocation.longitude) {
      findNearestStore();
    }
  }, [userLocation.latitude, userLocation.longitude]);

  const findNearestStore = async () => {
    try {
      setLoadingStore(true);
      const store = await physicalStoresService.findNearest(
        userLocation.latitude,
        userLocation.longitude
      );
      setNearestStore(store);
    } catch (error) {
      console.error('Erro ao buscar loja mais próxima:', error);
    } finally {
      setLoadingStore(false);
    }
  };

  // Calcular distância para a loja mais próxima
  const distance = nearestStore ? nearestStore.distance : null;

  // SEMPRE disponível para entrega via motoboy
  const isDeliveryAvailable = true;

  // Estado de carregamento
  if (userLocation.loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Obtendo sua localização...</span>
          </div>
        </div>
      </div>
    );
  }

  // Erro ou permissão negada - MAS SEMPRE ENTREGAMOS
  if (userLocation.error) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">✓ Entrega disponível via motoboy</span>
            </div>
            <span className="hidden sm:inline opacity-50">•</span>
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {loadingIP ? (
                  'Detectando...'
                ) : localizacaoIP?.cidade ? (
                  `Atendemos ${localizacaoIP.cidade}, ${localizacaoIP.estado}`
                ) : (
                  'Atendemos todo o Paraná'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sucesso - Header compacto - SEMPRE VERDE (sempre entregamos)
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Status - SEMPRE DISPONÍVEL */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              ✓ Entrega disponível via motoboy
            </span>
          </div>

          {/* Separador */}
          <span className="hidden md:inline text-white opacity-50">•</span>

          {/* Localização do usuário */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              {userLocation.neighborhood && (
                <span className="font-medium">{userLocation.neighborhood}, </span>
              )}
              <span className="font-medium">{userLocation.city}</span>
              {userLocation.state && <span> - {userLocation.state}</span>}
            </span>
          </div>

          {/* Separador */}
          <span className="hidden md:inline text-white opacity-50">•</span>

          {/* Loja mais próxima */}
          {nearestStore ? (
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                <span className="font-semibold">{nearestStore.name}</span>
                {distance && <span> - {formatDistance(distance)}</span>}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">
                {loadingIP ? (
                  'Detectando...'
                ) : localizacaoIP?.cidade ? (
                  `Atendemos ${localizacaoIP.cidade}, ${localizacaoIP.estado}`
                ) : (
                  'Atendemos todo o Paraná'
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
