'use client';

import dynamic from 'next/dynamic';
import { MapPin, Loader2 } from 'lucide-react';

// --- Exported types ---
export interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  type?: 'clinic' | 'pharmacy' | 'driver' | 'patient' | 'destination';
  label?: string;
  color?: string; // backward compat - overrides type-based color
}

export interface MapViewProps {
  markers?: MapMarker[];
  center?: [number, number]; // [lat, lng] for convenience, converted internally
  zoom?: number;
  height?: string;
  showUserLocation?: boolean;
  route?: { geometry?: string; origin?: string; destination?: string } | null;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

// --- Dynamic import with SSR disabled (maplibre-gl needs browser) ---
const MapViewInner = dynamic(
  () => import('./map-view-inner').then((mod) => mod.MapViewInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border" style={{ height: '400px' }}>
        <Loader2 className="size-8 text-emerald-600 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Cargando mapa...</p>
      </div>
    ),
  }
);

export function MapView(props: MapViewProps) {
  return <MapViewInner {...props} />;
}
