import { MapPin, Navigation, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useGeolocation, calculateDistance, formatDistance } from '../hooks/useGeolocation';

export default function LocationBanner({ storeLocation }) {
  const userLocation = useGeolocation();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const distance = userLocation.latitude && userLocation.longitude && storeLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        storeLocation.latitude,
        storeLocation.longitude
      )
    : null;

  if (userLocation.loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Navigation className="w-5 h-5 animate-pulse" />
          <p className="text-sm font-medium">Detectando sua localização...</p>
        </div>
      </div>
    );
  }

  if (userLocation.error) {
    return (
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">
                {userLocation.permissionDenied 
                  ? 'Permita o acesso à localização para ver lojas próximas' 
                  : userLocation.error}
              </p>
              {userLocation.permissionDenied && (
                <p className="text-xs opacity-90 mt-1">
                  Clique no ícone de cadeado na barra de endereço e permita a localização
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-4 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm mb-1">📍 Você está em:</p>
                <p className="text-sm leading-relaxed">
                  {userLocation.neighborhood && (
                    <span className="font-semibold">{userLocation.neighborhood}, </span>
                  )}
                  <span className="font-semibold">{userLocation.city}</span>
                  {userLocation.state && <span> - {userLocation.state}</span>}
                </p>
              </div>
            </div>

            {distance !== null && (
              <div className="flex items-center gap-2 mt-3 bg-white bg-opacity-20 rounded-lg px-3 py-2 backdrop-blur-sm">
                <Navigation className="w-5 h-5" />
                <div>
                  <p className="text-sm">
                    <span className="font-bold text-lg">{formatDistance(distance)}</span>
                    <span className="ml-2">de distância da nossa loja</span>
                  </p>
                  {distance < 5 && (
                    <p className="text-xs opacity-90 mt-1">
                      🎉 Você está bem perto! Entrega rápida garantida!
                    </p>
                  )}
                  {distance >= 5 && distance < 15 && (
                    <p className="text-xs opacity-90 mt-1">
                      ✨ Entregamos na sua região!
                    </p>
                  )}
                  {distance >= 15 && (
                    <p className="text-xs opacity-90 mt-1">
                      📦 Verifique se entregamos na sua região
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition flex-shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
