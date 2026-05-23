'use client';

import { useMemo } from 'react';
import { useRealTimeTracking } from '@/hooks/useRealTimeTracking';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { Truck, MapPin, Clock, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RealTimeTrackingMapProps {
  orderId: string;
  height?: string;
  className?: string;
}

export function RealTimeTrackingMap({ orderId, height = '360px', className }: RealTimeTrackingMapProps) {
  const { order, driverLocation, route, eta, status, isLoading } = useRealTimeTracking(orderId);

  // Prepare map markers dynamically based on the current delivery stage
  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    const o = order as any;
    if (!o) return list;

    // 1. Add Pharmacy marker (pickup point)
    const pickupLat = o.pickup_lat ?? o.pickupLat;
    const pickupLng = o.pickup_lng ?? o.pickupLng;
    if (pickupLat && pickupLng) {
      list.push({
        id: 'pharmacy',
        lat: pickupLat,
        lng: pickupLng,
        type: 'pharmacy',
        label: `${o.pharmacy?.name || 'Farmacia'} (Origen)`,
      });
    }

    // 2. Add Patient marker (destination point)
    const deliveryLat = o.delivery_lat ?? o.deliveryLat;
    const deliveryLng = o.delivery_lng ?? o.deliveryLng;
    if (deliveryLat && deliveryLng) {
      list.push({
        id: 'destination',
        lat: deliveryLat,
        lng: deliveryLng,
        type: 'destination',
        label: 'Tu domicilio (Destino)',
      });
    }

    // 3. Add Live Driver marker
    if (driverLocation) {
      list.push({
        id: 'driver',
        lat: driverLocation.lat,
        lng: driverLocation.lng,
        type: 'driver',
        label: o.driver?.name || 'Repartidor (En Movimiento)',
      });
    }

    return list;
  }, [order, driverLocation]);

  // Set map center dynamically focusing on the driver if active, else destination
  const mapCenter = useMemo((): [number, number] => {
    const o = order as any;
    if (driverLocation) return [driverLocation.lat, driverLocation.lng];
    if (o?.delivery_lat) return [o.delivery_lat, o.delivery_lng];
    if (o?.deliveryLat) return [o.deliveryLat, o.deliveryLng];
    return [DEFAULT_LAT, DEFAULT_LNG];
  }, [order, driverLocation]);

  if (isLoading) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-950/20 rounded-3xl border border-slate-200 dark:border-zinc-800 animate-pulse transition-all duration-300"
        style={{ height }}
      >
        <Clock className="size-6 text-slate-400 dark:text-zinc-650 animate-spin mb-2" />
        <p className="text-xs text-slate-500 dark:text-zinc-500">Sincronizando coordenadas...</p>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full overflow-hidden rounded-[2rem] border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-2xl transition-colors duration-300', className)}>
      {/* 1. Leaflet map */}
      <MapView
        markers={markers}
        center={mapCenter}
        height={height}
        route={route ? { geometry: route.geometry } : null}
      />

      {/* 2. Floating live indicators */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 backdrop-blur-md transition-all duration-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Rastreo Activo</span>
        </div>
      </div>

      {/* 3. Floating ETA badge */}
      {status !== 'delivered' && status !== 'cancelled' && (
        <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur-md flex items-center gap-3 transition-colors duration-300">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 animate-pulse">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">ETA Estimado</p>
            <p className="text-sm font-black text-slate-800 dark:text-white">{eta}</p>
          </div>
        </div>
      )}
    </div>
  );
}
