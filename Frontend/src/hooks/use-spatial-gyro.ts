'use client';

import { useEffect } from 'react';

/**
 * Hook para capturar la orientación del giroscopio del dispositivo móvil.
 * Escribe las coordenadas físicas calculadas en las propiedades personalizadas CSS
 * (--gyro-x, --gyro-y) en el root del documento.
 */
export function useSpatialGyro(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Gamma es el movimiento de izquierda a derecha (-90 a 90 grados)
      const x = event.gamma ? Math.min(Math.max(event.gamma / 3, -12), 12) : 0;
      // Beta es el movimiento de adelante hacia atrás (-180 a 180 grados)
      // Restamos 45 grados para asumir una posición ergonómica estándar de sujeción móvil
      const y = event.beta ? Math.min(Math.max((event.beta - 45) / 3, -12), 12) : 0;

      document.documentElement.style.setProperty('--gyro-x', `${x}px`);
      document.documentElement.style.setProperty('--gyro-y', `${y}px`);
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [enabled]);
}
