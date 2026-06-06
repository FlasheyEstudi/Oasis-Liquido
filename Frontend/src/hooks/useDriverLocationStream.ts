import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useUpdateDeliveryLocation } from '@/hooks/use-api';
import { snapToRoad } from '@/lib/map/snap-to-road';

export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

const FLUSH_INTERVAL_MS = 4000;
const SAMPLE_DISTANCE_M = 5;

// Custom distance calculation to determine if driver moved sufficiently
function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useDriverLocationStream(orderId: string, enabled: boolean, mapInstance: any = null) {
  const updateLocation = useUpdateDeliveryLocation();
  const bufferRef = useRef<GeoPoint[]>([]);
  const lastPositionRef = useRef<GeoPoint | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) {
      setCurrentLocation(null);
      return;
    }

    const socket = getSocket();
    let watchId: number | null = null;
    let timerId: NodeJS.Timeout | null = null;

    const handleCoordsUpdate = async (coords: GeolocationCoordinates) => {
      let lat = coords.latitude;
      let lng = coords.longitude;

      // Snap the raw coordinates to the road network if map is loaded
      if (mapInstance) {
        try {
          const snapped = await snapToRoad(mapInstance, { lat, lng });
          lat = snapped.lat;
          lng = snapped.lng;
        } catch (err) {
          console.warn('[useDriverLocationStream] snapToRoad failed, using raw coords:', err);
        }
      }

      const now = Date.now();
      const newPoint: GeoPoint = { lat, lng, timestamp: now };
      setCurrentLocation(newPoint);

      // Apply displacement threshold to avoid jitter when stationary
      if (lastPositionRef.current) {
        const dist = distanceInMeters(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng
        );
        if (dist < SAMPLE_DISTANCE_M) {
          return;
        }
      }

      bufferRef.current.push(newPoint);
      lastPositionRef.current = newPoint;
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          handleCoordsUpdate(position.coords);
        },
        (error) => {
          console.warn('[useDriverLocationStream] watchPosition failed:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // Timer to flush the buffered location telemetry in batches
    timerId = setInterval(() => {
      if (bufferRef.current.length === 0) return;

      const pointsToFlush = [...bufferRef.current];
      bufferRef.current = []; // Reset buffer

      const payload = {
        orderId,
        points: pointsToFlush
      };

      console.log(`📡 [useDriverLocationStream] Flushing ${pointsToFlush.length} points.`);

      // Emit over WebSocket for real-time tracking clients
      if (socket && socket.connected) {
        socket.emit('driver-location', payload);
      }

      // Fallback/Persist via HTTP mutation for persistence
      const lastPoint = pointsToFlush[pointsToFlush.length - 1];
      updateLocation.mutate({
        orderId,
        lat: lastPoint.lat,
        lng: lastPoint.lng
      });
    }, FLUSH_INTERVAL_MS);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timerId !== null) clearInterval(timerId);
    };
  }, [enabled, orderId, mapInstance, updateLocation]);

  return { currentLocation };
}
