import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    city: null,
    state: null,
    country: null,
    address: null,
    loading: true,
    error: null,
    permissionDenied: false
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocalização não suportada pelo navegador'
      }));
      return;
    }

    // Solicitar permissão de localização
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Não usar API externa - apenas retornar coordenadas
        setLocation({
          latitude,
          longitude,
          city: 'Sua localização',
          state: 'PR',
          country: 'Brasil',
          neighborhood: '',
          road: '',
          address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
          loading: false,
          error: null,
          permissionDenied: false
        });
      },
      (error) => {
        console.error('Erro de geolocalização:', error);
        let errorMessage = 'Erro ao obter localização';
        let permissionDenied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada';
            permissionDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao obter localização';
            break;
          default:
            errorMessage = 'Erro desconhecido';
        }

        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          permissionDenied
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return location;
}

// Função para calcular distância entre dois pontos (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Retorna em km
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Formatar distância para exibição
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km`;
  } else {
    return `${Math.round(km)}km`;
  }
}
