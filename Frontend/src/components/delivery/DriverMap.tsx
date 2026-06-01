'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { updateLocation, getRoute } from '@/api/deliveries';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Navigation, Play, Square, MapPin, Compass } from 'lucide-react';
import { toast } from 'sonner';

interface DriverMapProps {
  order: any;
  height?: string;
}

export function DriverMap({ order, height = '320px' }: DriverMapProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [route, setRoute] = useState<any>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<any>(null);

  // Determine stage and destination
  const stage = order.status === 'assigned' ? 'to_pharmacy' : 'to_patient';
  
  const destLat = stage === 'to_pharmacy' 
    ? (order.pickup_lat ?? order.pickupLat) 
    : (order.delivery_lat ?? order.deliveryLat);
    
  const destLng = stage === 'to_pharmacy' 
    ? (order.pickup_lng ?? order.pickupLng) 
    : (order.delivery_lng ?? order.deliveryLng);

  // Fetch the street route dynamically when position or destination changes
  useEffect(() => {
    const fetchRoute = async () => {
      if (!order.id) return;
      try {
        const lat = currentLocation?.lat;
        const lng = currentLocation?.lng;
        
        // Use the authenticated API client getRoute method, which automatically resolves the API URL and includes token headers
        const routeData = await getRoute(order.id, {
          currentLat: lat,
          currentLng: lng,
          stage,
        });
        
        if (routeData) {
          setRoute(routeData);
        }
      } catch (err) {
        console.error('Error fetching navigation route:', err);
      }
    };

    fetchRoute();
  }, [order.id, currentLocation, stage]);

  // Start watching GPS position and transmitting updates to backend every 5 seconds
  const startNavigation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsNavigating(true);
    toast.success('Navegación iniciada. Transmitiendo ubicación...');

    // 1. Live position tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Simulate coordinates if GPS is unavailable in dev local environment
        if (!currentLocation) {
          setCurrentLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2. Periodic transmit every 5 seconds
    updateIntervalRef.current = setInterval(async () => {
      if (currentLocation) {
        try {
          await updateLocation(order.id, currentLocation.lat, currentLocation.lng);
          console.log('📡 [DriverMap] Location packet transmitted:', currentLocation);
        } catch (err) {
          console.error('Failed to update live driver location:', err);
        }
      }
    }, 5000);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    toast.info('Navegación pausada');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, []);

  // Build map markers
  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    
    // Origin/Pharmacy Marker
    const pickupLat = order.pickup_lat ?? order.pickupLat;
    const pickupLng = order.pickup_lng ?? order.pickupLng;
    if (pickupLat && pickupLng) {
      list.push({
        id: 'pharmacy',
        lat: pickupLat,
        lng: pickupLng,
        type: 'pharmacy',
        label: `${order.pharmacy?.name || 'Farmacia'} (Origen)`,
      });
    }

    // Destination/Patient Marker
    const deliveryLat = order.delivery_lat ?? order.deliveryLat;
    const deliveryLng = order.delivery_lng ?? order.deliveryLng;
    if (deliveryLat && deliveryLng) {
      list.push({
        id: 'destination',
        lat: deliveryLat,
        lng: deliveryLng,
        type: 'destination',
        label: 'Paciente (Destino)',
      });
    }

    // Driver Current Location Marker
    const activeLat = currentLocation?.lat ?? order.driver?.delivery_driver_profile?.current_lat ?? order.driver?.deliveryDriverProfile?.currentLat;
    const activeLng = currentLocation?.lng ?? order.driver?.delivery_driver_profile?.current_lng ?? order.driver?.deliveryDriverProfile?.currentLng;
    
    if (activeLat && activeLng) {
      list.push({
        id: 'driver',
        lat: activeLat,
        lng: activeLng,
        type: 'driver',
        label: 'Tu ubicación actual',
      });
    }

    return list;
  }, [order, currentLocation]);

  const centerCoordinates = useMemo((): [number, number] => {
    if (currentLocation) return [currentLocation.lat, currentLocation.lng];
    const pickupLat = order.pickup_lat ?? order.pickupLat;
    if (pickupLat) return [pickupLat, order.pickup_lng ?? order.pickupLng];
    return [DEFAULT_LAT, DEFAULT_LNG];
  }, [order, currentLocation]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      {/* 1. Leaflet map absolute container */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapView
          markers={markers}
          center={centerCoordinates}
          height="100%"
          route={route ? { geometry: route.geometry } : null}
          className="rounded-[2.5rem] md:rounded-[3rem] border-0"
        />
      </div>

      {/* Navigation Indicator Overlay */}
      {isNavigating && (
        <div className="absolute top-18 left-4 z-10 flex items-center gap-2 rounded-full bg-white/80 dark:bg-emerald-500/10 border border-slate-200 dark:border-emerald-500/20 px-3 py-1.5 text-emerald-600 dark:text-emerald-500 backdrop-blur-md transition-all duration-300">
          <Compass className="size-4 animate-spin-slow" />
          <span className="text-[8px] font-black uppercase tracking-widest">Navegando...</span>
        </div>
      )}

      {/* Floating HUD over map for premium Uber-like controls */}
      <div className="absolute top-18 right-4 z-10 flex flex-col gap-2.5 pointer-events-auto">
        {/* Route Metadata floating in the top-right overlay */}
        {route && (
          <div className="rounded-2xl bg-white/90 dark:bg-zinc-950/90 border border-slate-200/50 dark:border-white/10 px-3 py-2 shadow-xl backdrop-blur-md flex flex-col gap-0.5 text-right max-w-[160px]">
            <span className="text-[7.5px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest">Distancia / Tiempo</span>
            <span className="text-[11px] font-black text-slate-800 dark:text-white">{route.distanceKm?.toFixed(1) || '0.0'} km ({route.durationText || '15 min'})</span>
          </div>
        )}

        {/* GPS Trigger Toggle Button */}
        {!isNavigating ? (
          <Button
            onClick={startNavigation}
            className="h-10 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-black text-[9px] uppercase tracking-widest gap-2 text-white border-0 shadow-xl cursor-pointer self-end"
          >
            <Play className="size-3.5 fill-white animate-pulse" />
            Navegar GPS
          </Button>
        ) : (
          <Button
            onClick={stopNavigation}
            className="h-10 px-4 rounded-full bg-red-500 hover:bg-red-600 font-black text-[9px] uppercase tracking-widest gap-2 text-white border-0 shadow-xl cursor-pointer self-end"
          >
            <Square className="size-3.5 fill-white" />
            Parar GPS
          </Button>
        )}
      </div>
    </div>
  );
}
