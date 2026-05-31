'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSocket, joinOrderRoom } from '@/lib/socket';
import { useDeliveryOrderTracking, useDeliveryRoute } from '@/hooks/use-api';
import type { DeliveryOrder, DeliveryRoute } from '@/types';

export interface DriverLocation {
  lat: number;
  lng: number;
  timestamp?: Date;
}

export function useRealTimeTracking(orderId: string) {
  // 1. Fetch current order details (polls periodically for state changes)
  const orderQuery = useDeliveryOrderTracking(orderId);
  const order = orderQuery.data;

  // Real-time states
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  // 2. Determine routing stage: 'to_pharmacy' (if status is 'assigned') or 'to_patient' (if status is 'picked_up' or 'in_transit')
  const stage = useMemo(() => {
    if (!order) return 'to_patient';
    return order.status === 'assigned' ? 'to_pharmacy' : 'to_patient';
  }, [order?.status]);

  // 3. Fetch street-aware route from backend
  const routeQuery = useDeliveryRoute(orderId, !!orderId);
  const route = routeQuery.data;

  // 4. WebSocket integration
  useEffect(() => {
    if (!orderId) return;

    // Join Socket room
    joinOrderRoom(orderId);
    const socket = getSocket();

    // Listen for live location updates from the driver
    const handleLocationUpdate = (data: { orderId: string; lat: number; lng: number; latitude?: number; longitude?: number }) => {
      const lat = data.lat ?? data.latitude;
      const lng = data.lng ?? data.longitude;
      
      if (lat && lng) {
        console.log('📡 [useRealTimeTracking] Socket location update received:', lat, lng);
        setDriverLocation({
          lat,
          lng,
          timestamp: new Date()
        });
      }
    };

    // Support both project standard and custom prompt events for maximum robustness
    socket.on('delivery:locationUpdate', handleLocationUpdate);
    socket.on('driver-location', handleLocationUpdate);

    return () => {
      socket.off('delivery:locationUpdate', handleLocationUpdate);
      socket.off('driver-location', handleLocationUpdate);
    };
  }, [orderId]);

  // Fallback to driver profile's last coordinates if no active socket transmission has occurred yet
  const activeDriverLocation = useMemo((): DriverLocation | null => {
    if (driverLocation) return driverLocation;
    
    const driverProfile = order?.driver?.delivery_driver_profile || (order?.driver as any)?.deliveryDriverProfile;
    const lat = driverProfile?.current_lat ?? driverProfile?.currentLat;
    const lng = driverProfile?.current_lng ?? driverProfile?.currentLng;

    if (lat && lng) {
      return { lat, lng };
    }
    return null;
  }, [order, driverLocation]);

  // Calculate ETA dynamically based on distance (or fall back to standard)
  const eta = useMemo(() => {
    if (!order) return '15-30 min';
    if (order.status === 'delivered') return 'Entregado';
    if (order.status === 'cancelled') return 'Cancelado';

    const driverProfile = order.driver?.delivery_driver_profile || (order.driver as any)?.deliveryDriverProfile;
    const lat1 = driverLocation?.lat || driverProfile?.current_lat || driverProfile?.currentLat;
    const lng1 = driverLocation?.lng || driverProfile?.current_lng || driverProfile?.currentLng;

    const lat2 = order.delivery_lat;
    const lng2 = order.delivery_lng;

    if (lat1 && lng1 && lat2 && lng2 && (order.status === 'in_transit' || order.status === 'picked_up')) {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;

      // Dynamic city transit multiplier (1.25) and average speed of 28km/h
      const estimatedMinutes = Math.ceil((distanceKm * 1.25) / (28 / 60));

      if (distanceKm < 0.25) {
        return 'Llegando ahora';
      }
      if (estimatedMinutes <= 2) {
        return 'Menos de 2 min';
      }
      return `${estimatedMinutes} min`;
    }
    
    // Estimate based on OSRM route data if available
    const durationMin = (route as any)?.durationMinutes ?? Math.round(((route as any)?.duration_seconds || 0) / 60);
    if (durationMin > 0) {
      return `${durationMin} min`;
    }
    return '15-30 min';
  }, [order, route, driverLocation]);

  return {
    order,
    driverLocation: activeDriverLocation,
    route,
    eta,
    status: order?.status || 'pending',
    isLoading: orderQuery.isLoading,
    isError: orderQuery.isError,
    refetch: () => {
      orderQuery.refetch();
      routeQuery.refetch();
    }
  };
}
