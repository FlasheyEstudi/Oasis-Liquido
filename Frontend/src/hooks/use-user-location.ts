import { useState, useEffect, useCallback } from 'react';
import { reverseGeocode } from '@/lib/map/search-places';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';

interface LocationState {
  lat: number;
  lng: number;
  address: string;
  loading: boolean;
  error: string | null;
}

export function useUserLocation() {
  const [location, setLocation] = useState<LocationState>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    address: 'Cargando ubicación...',
    loading: true,
    error: null,
  });

  const getLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        address: 'Managua, Nicaragua',
        error: 'La geolocalización no está soportada por este navegador.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const friendlyAddress = await reverseGeocode(latitude, longitude);
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address: friendlyAddress.split(',')[0] || friendlyAddress || 'Ubicación actual',
            loading: false,
            error: null,
          });
        } catch (err) {
          setLocation({
            lat: latitude,
            lng: longitude,
            address: 'Ubicación actual',
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        let errorMsg = 'Error al obtener geolocalización';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado por el usuario.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado al obtener ubicación.';
            break;
        }

        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
          // Fallback to Managua center
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
          address: 'Managua, Nicaragua',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const refresh = () => {
    setLocation((prev) => ({ ...prev, loading: true }));
    getLocation();
  };

  return {
    ...location,
    refresh,
  };
}
