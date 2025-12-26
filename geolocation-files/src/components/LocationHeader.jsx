import { MapPin, Loader2, CheckCircle, Bike } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGeolocation, calculateDistance, formatDistance } from '../hooks/useGeolocation';

export default function LocationHeader({ storeLocation, deliveryRadius = 15 }) {
  const userLocation = useGeolocation();

  const distance = userLocation.latitude && userLocation.longitude && storeLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        storeLocation.latitude,
        storeLocation.longitude
      )
    : null;

  const isDeliveryAvailable = distance ? distance <= deliveryRadius : true;

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

  if (userLocation.error) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">✓ Entrega disponível</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r ${isDeliveryAvailable ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-orange-500'} text-white shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              {isDeliveryAvailable ? '✓ Entrega disponível' : '⚠ Verifique disponibilidade'}
            </span>
          </div>
          <span className="hidden md:inline text-white opacity-50">•</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              <span className="font-medium">{userLocation.city}</span>
              {userLocation.state && <span> - {userLocation.state}</span>}
            </span>
          </div>
          {distance && (
            <>
              <span className="hidden md:inline text-white opacity-50">•</span>
              <div className="flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  {formatDistance(distance)} de distância
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
