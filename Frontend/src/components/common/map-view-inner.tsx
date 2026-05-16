'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

import type { MapMarker, MapViewProps } from './map-view';

// --- Marker color map by type ---
const MARKER_COLORS: Record<string, string> = {
  clinic: '#059669',    // emerald-600
  pharmacy: '#0d9488',  // teal-600
  driver: '#d97706',    // amber-600
  patient: '#2563eb',   // blue-600
  destination: '#dc2626', // red-600
};

const DEFAULT_MARKER_COLOR = '#6b7280'; // gray-500

// --- SVG marker icon ---
function createMarkerSVG(color: string): string {
  return `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
}

// --- Pulsing dot for user location ---
function createUserLocationElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'user-location-marker';
  el.innerHTML = `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:user-pulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 6px rgba(59,130,246,0.5);"></div>
    </div>
  `;
  return el;
}

// --- Polyline decoder (Google encoded polyline format) ---
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let byte: number;
    let shift = 0;
    let result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// --- Parse route geometry ---
function parseRouteGeometry(geometry: string): [number, number][] | null {
  // Try GeoJSON first
  try {
    const parsed = JSON.parse(geometry);
    if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
      return parsed.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]); // GeoJSON is [lng,lat]
    }
    if (parsed.type === 'Feature' && parsed.geometry?.type === 'LineString') {
      return parsed.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
    if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry?.type === 'LineString') {
      return parsed.features[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
  } catch {
    // Not JSON, try polyline decoding
  }

  // Try polyline decoding
  try {
    const decoded = decodePolyline(geometry);
    if (decoded.length >= 2) {
      return decoded;
    }
  } catch {
    // Failed to decode
  }

  return null;
}

export function MapViewInner({
  markers = [],
  center,
  zoom = DEFAULT_ZOOM,
  height = '400px',
  showUserLocation = false,
  route = null,
  onMarkerClick,
  className,
  theme = 'light',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Determine center: center prop is [lat, lng] for backward compat, MapLibre uses [lng, lat]
  const mapCenter: [number, number] = center
    ? [center[1], center[0]]  // [lat, lng] -> [lng, lat]
    : [DEFAULT_LNG, DEFAULT_LAT];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    let map: maplibregl.Map;

    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE_URL,
        center: mapCenter,
        zoom: zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      map.on('load', () => {
        setMapLoaded(true);
      });

      map.on('error', (e) => {
        console.error('MapLibre error:', e);
        setMapError('Error al cargar el mapa');
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Failed to initialize map:', err);
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => setMapError('No se pudo inicializar el mapa'), 0);
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      map?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
    // Only re-initialize when container changes
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Add new markers
    markers.forEach((marker, index) => {
      const color = marker.color || MARKER_COLORS[marker.type || ''] || DEFAULT_MARKER_COLOR;
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.cursor = 'pointer';
      el.innerHTML = createMarkerSVG(color);

      const maplibreMarker = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current!);

      // Click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        // Create new popup
        if (marker.label) {
          const popup = new maplibregl.Popup({ offset: 25, closeButton: true, closeOnClick: true })
            .setLngLat([marker.lng, marker.lat])
            .setHTML(`<div style="padding:4px 8px;font-size:13px;font-weight:500;">${marker.label}</div>`)
            .addTo(mapRef.current!);
          popupRef.current = popup;
        }

        onMarkerClick?.(marker);
      });

      markersRef.current.push(maplibreMarker);
    });
  }, [markers, mapLoaded, onMarkerClick]);

  // Update route
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const fetchRoute = async () => {
      const map = mapRef.current!;
      
      // Remove existing route layer and source
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route-source')) map.removeSource('route-source');

      if (!route) return;

      let geometry = route.geometry;

      // If no geometry but we have points, fetch from OSRM proxy
      if (!geometry && route.origin && route.destination) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'}/routes/driving?origin=${route.origin}&destination=${route.destination}`);
          const result = await res.json();
          if (result.success) {
            geometry = result.data.geometry;
          }
        } catch (err) {
          console.error('Failed to fetch OSRM route:', err);
        }
      }

      if (!geometry) return;

      const coords = parseRouteGeometry(geometry);
      if (!coords || coords.length < 2) return;

      // Convert [lat, lng] to [lng, lat] for GeoJSON
      const geoJsonCoords = coords.map(([lat, lng]) => [lng, lat]);

      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: geoJsonCoords,
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#059669',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      // Fit map to route bounds
      const bounds = new maplibregl.LngLatBounds();
      geoJsonCoords.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 40, duration: 1000 });
    };

    fetchRoute();
  }, [route, mapLoaded]);

  // Handle user location
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUserLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Request geolocation
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mapRef.current) return;
        const { latitude, longitude } = position.coords;

        const el = createUserLocationElement();
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);

        userMarkerRef.current = marker;

        // Pan to user location
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: zoom,
          duration: 1500,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fall back to default center - already set
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [showUserLocation, mapLoaded, zoom]);

  // Update center when prop changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.flyTo({
      center: mapCenter,
      duration: 1000,
    });
  }, [mapCenter[0], mapCenter[1], mapLoaded]);

  // Error state
  if (mapError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-red-50 rounded-lg border border-red-200',
          className
        )}
        style={{ height }}
      >
        <MapPin className="size-10 text-red-300 mb-2" />
        <p className="text-sm font-medium text-red-600">{mapError}</p>
        <p className="text-xs text-red-400 mt-1">Verifica tu conexión a internet</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative rounded-lg overflow-hidden border', 
        theme === 'dark' && 'map-dark-filter',
        className
      )} 
      style={{ height }}
    >
      <style jsx global>{`
        .map-dark-filter .maplibregl-map {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
          background: #111 !important;
        }
        .map-dark-filter .maplibregl-marker,
        .map-dark-filter .maplibregl-ctrl,
        .map-dark-filter .maplibregl-popup {
          filter: invert(100%) hue-rotate(180deg);
        }
      `}</style>

      {/* Premium Cinematic Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-md">
          <div className="relative">
            <div className="size-16 rounded-full border-b-2 border-t-2 border-emerald-500 animate-spin" />
            <div className="absolute inset-0 size-16 rounded-full border-r-2 border-l-2 border-sky-500 animate-spin-slow" />
            <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-white animate-pulse" />
          </div>
          <p className="mt-6 text-sm font-black text-white uppercase tracking-[0.3em] animate-pulse">
            Localizando Oasis...
          </p>
          <div className="mt-2 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 animate-shimmer" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0" 
        style={{ height: '100%' }} 
      />
    </div>
  );
}
