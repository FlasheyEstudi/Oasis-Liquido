'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

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

// --- Custom Leaflet Marker Icon ---
function createMarkerIcon(color: string): L.DivIcon {
  const html = `
    <div style="position: relative; width: 28px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
        <circle cx="14" cy="14" r="6" fill="white"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

// --- Pulsing Leaflet Icon for user location ---
function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:user-pulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 6px rgba(59,130,246,0.5);"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-user-location',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
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
function parseRouteGeometry(geometry: any): [number, number][] | null {
  if (typeof geometry === 'object' && geometry !== null) {
    if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
      return geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
  }
  // Try GeoJSON parsing if it's a string
  try {
    const parsed = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
    if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
      return parsed.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
  } catch {
    // Not JSON
  }

  if (typeof geometry === 'string') {
    // Try polyline decoding
    try {
      const decoded = decodePolyline(geometry);
      if (decoded.length >= 2) {
        return decoded;
      }
    } catch {
      // Failed
    }
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
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const markersMapRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic theme detection checking Tailwind class changes on html element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Default coordinate center (Leaflet expects [lat, lng])
  const mapCenter: [number, number] = center || [DEFAULT_LAT, DEFAULT_LNG];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainer.current) return;

    let map: L.Map;

    try {
      map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(mapCenter, zoom);

      // Positioning control on top-right to preserve visual cleanliness
      L.control.zoom({
        position: 'topright',
      }).addTo(map);

      // CartoDB Voyager (light) and Dark Matter (dark) tiles feel extremely premium
      const tileUrl = document.documentElement.classList.contains('dark')
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapRef.current = map;
      setMapLoaded(true);
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
      setTimeout(() => setMapError('No se pudo inicializar el mapa'), 0);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      Object.keys(markersMapRef.current).forEach((id) => {
        try {
          markersMapRef.current[id].remove();
        } catch (e) {}
      });
      markersMapRef.current = {};

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  // Classic Leaflet Bugfix: Invalidate size after layout/load to prevent black/grey collapsed map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mapLoaded]);

  // Update tile layer url dynamically when isDarkMode changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const newUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(newUrl);
  }, [isDarkMode]);

  // Update Markers when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (typeof map.getPanes !== 'function' || !map.getPanes()) return;

    try {
      const newMarkerIds = new Set(markers.map(m => m.id).filter(Boolean));

      // Remove cached markers that are no longer present in the markers array
      Object.keys(markersMapRef.current).forEach((id) => {
        if (!newMarkerIds.has(id)) {
          try {
            markersMapRef.current[id].remove();
          } catch (e) {}
          delete markersMapRef.current[id];
        }
      });

      // Update or add markers
      markers.forEach((marker) => {
        try {
          if (marker.lat == null || marker.lng == null || isNaN(marker.lat) || isNaN(marker.lng)) {
            console.warn('⚠️ MapViewInner: Skipped invalid marker coordinates:', marker);
            return;
          }

          const markerId = marker.id || `marker-${marker.lat}-${marker.lng}`;
          const existingMarker = markersMapRef.current[markerId];

          if (existingMarker) {
            // Smoothly move marker to the new position instead of destroying it!
            const startLatLng = existingMarker.getLatLng();
            const endLatLng = L.latLng(marker.lat, marker.lng);

            // Interpolate driver position smoothly (Uber style!)
            if (marker.type === 'driver' && typeof window !== 'undefined' && (startLatLng.lat !== endLatLng.lat || startLatLng.lng !== endLatLng.lng)) {
              const duration = 1500; // ms transition length
              const startTime = performance.now();

              const animateStep = (now: number) => {
                if (!markersMapRef.current[markerId]) return; // Stop if removed
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Linear interpolation (lerp) formula
                const currentLat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * progress;
                const currentLng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * progress;

                existingMarker.setLatLng([currentLat, currentLng]);

                if (progress < 1) {
                  requestAnimationFrame(animateStep);
                }
              };
              requestAnimationFrame(animateStep);
            } else {
              existingMarker.setLatLng(endLatLng);
            }

            // Update label popup if changed
            if (marker.label) {
              const popup = existingMarker.getPopup();
              if (popup) {
                existingMarker.setPopupContent(`
                  <div class="map-popup-text" style="padding: 4px 8px; font-size: 13px; font-weight: 700; font-family: sans-serif;">
                    ${marker.label}
                  </div>
                `);
              }
            }
          } else {
            // Create a new marker
            const color = marker.color || MARKER_COLORS[marker.type || ''] || DEFAULT_MARKER_COLOR;
            const icon = createMarkerIcon(color);

            const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
              .addTo(map);

            if (marker.label) {
              leafletMarker.bindPopup(`
                <div class="map-popup-text" style="padding: 4px 8px; font-size: 13px; font-weight: 700; font-family: sans-serif;">
                  ${marker.label}
                </div>
              `);
            }

            if (onMarkerClick) {
              leafletMarker.on('click', () => {
                onMarkerClick(marker);
              });
            }

            markersMapRef.current[markerId] = leafletMarker;
          }
        } catch (markerErr) {
          console.warn('⚠️ MapViewInner: Failed to add or update marker:', markerErr);
        }
      });
    } catch (err) {
      console.warn('⚠️ MapViewInner: Error updating markers:', err);
    }
  }, [markers, mapLoaded, onMarkerClick]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (typeof map.getPanes !== 'function' || !map.getPanes()) return;

    const drawRoute = async () => {
      try {
        // Remove existing polyline
        if (routeLineRef.current) {
          try {
            routeLineRef.current.remove();
          } catch (e) {}
          routeLineRef.current = null;
        }

        if (!route && markers.length < 2) return;

        let geometry = route?.geometry;

        if (!geometry && route?.origin && route?.destination) {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'}/routes/driving?origin=${route.origin}&destination=${route.destination}`
            );
            const result = await res.json();
            if (result.success) {
              geometry = result.data.geometry;
            }
          } catch (err) {
            console.error('Failed to fetch OSRM route:', err);
          }
        }

        // Try to parse the coordinates
        let coords = geometry ? parseRouteGeometry(geometry) : null;
        const isStraightLine = coords && coords.length <= 2;

        // CLIENT-SIDE BROWSER ROUTING FALLBACK:
        if ((!coords || isStraightLine) && markers.length >= 2) {
          const originMarker = markers.find(m => m.type === 'driver') || markers.find(m => m.type === 'pharmacy') || markers[0];
          const destMarker = markers.find(m => m.type === 'destination') || markers[markers.length - 1];

          if (originMarker && destMarker && 
              originMarker.lat != null && originMarker.lng != null && !isNaN(originMarker.lat) && !isNaN(originMarker.lng) &&
              destMarker.lat != null && destMarker.lng != null && !isNaN(destMarker.lat) && !isNaN(destMarker.lng)) {
            try {
              console.log("📡 Frontend: Fetching street route directly from browser network...");
              const publicUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${originMarker.lng},${originMarker.lat};${destMarker.lng},${destMarker.lat}?overview=full&geometries=polyline`;
              const res = await fetch(publicUrl);
              const data = await res.json();
              if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const publicCoords = parseRouteGeometry(data.routes[0].geometry);
                if (publicCoords && publicCoords.length > 2) {
                  console.log("✅ Frontend: Street-aware route loaded successfully in browser!");
                  coords = publicCoords;
                }
              }
            } catch (err) {
              console.warn("⚠️ Frontend failed to fetch route directly:", err);
            }
          }
        }

        if (coords) {
          coords = coords.filter(c => c && c[0] != null && c[1] != null && !isNaN(c[0]) && !isNaN(c[1]));
        }

        if (!coords || coords.length < 2) return;
        if (!map || typeof map.getPanes !== 'function' || !map.getPanes()) return;

        // Draw polyline road routing safely when Leaflet map is fully initialized
        map.whenReady(() => {
          if (!mapRef.current) return;
          try {
            const polyline = L.polyline(coords!, {
              color: '#0d9488', // Teal-600
              weight: 5,
              opacity: 0.85,
              lineJoin: 'round',
              lineCap: 'round',
            }).addTo(mapRef.current);

            routeLineRef.current = polyline;

            // Adjust bounding box to frame coordinates perfectly
            const bounds = L.latLngBounds(coords!);
            mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
          } catch (err) {
            console.warn('⚠️ MapViewInner: Drawing in whenReady callback failed:', err);
          }
        });
      } catch (err) {
        console.warn('⚠️ MapViewInner: Error drawing route:', err);
      }
    };

    drawRoute();
  }, [route, mapLoaded, markers]);

  // Handle Geolocation for user marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUserLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mapRef.current) return;
        const { latitude, longitude } = position.coords;

        const icon = createUserLocationIcon();
        const marker = L.marker([latitude, longitude], { icon }).addTo(mapRef.current);

        userMarkerRef.current = marker;

        try {
          mapRef.current.flyTo([latitude, longitude], zoom, {
            animate: true,
            duration: 1.5,
          });
        } catch (err) {
          console.warn('⚠️ MapViewInner: flyTo failed (map might be unmounted):', err);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
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

  // Handle Center coordinate updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !center) return;
    if (typeof map.getPanes !== 'function' || !map.getPanes()) return;

    try {
      map.panTo(center, { animate: true, duration: 1.0 });
    } catch (err) {
      console.warn('⚠️ MapViewInner: panTo failed:', err);
    }
  }, [center?.[0], center?.[1], mapLoaded]);

  // Error overlay
  if (mapError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-red-950/20 rounded-2xl border border-red-900/30',
          className
        )}
        style={{ height }}
      >
        <MapPin className="size-10 text-red-500/50 mb-2 animate-bounce" />
        <p className="text-sm font-medium text-red-400">{mapError}</p>
        <p className="text-xs text-red-500/70 mt-1">Verifica tu conexión y permisos de geolocalización</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300',
        isDarkMode ? 'map-theme-dark border-white/5 bg-zinc-950 shadow-black/50' : 'map-theme-light border-slate-200 bg-white shadow-slate-100',
        className
      )}
      style={{ height }}
    >
      <style jsx global>{`
        /* Custom pulses for geolocation */
        @keyframes user-pulse {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        /* Override default leaflet styling for clean UI */
        .map-theme-dark .leaflet-container {
          background: #09090b !important; /* zinc-950 background */
          font-family: inherit;
        }
        .map-theme-light .leaflet-container {
          background: #f8fafc !important; /* slate-50 background */
          font-family: inherit;
        }
        .map-theme-dark .leaflet-bar {
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2) !important;
          background: rgba(15, 23, 42, 0.7) !important;
          backdrop-filter: blur(12px) !important;
          overflow: hidden;
        }
        .map-theme-light .leaflet-bar {
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          overflow: hidden;
        }
        .map-theme-dark .leaflet-bar a {
          background: transparent !important;
          color: rgba(255, 255, 255, 0.7) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          font-weight: bold;
          transition: all 0.2s;
        }
        .map-theme-light .leaflet-bar a {
          background: transparent !important;
          color: rgba(15, 23, 42, 0.7) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
          font-weight: bold;
          transition: all 0.2s;
        }
        .map-theme-dark .leaflet-bar a:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .map-theme-light .leaflet-bar a:hover {
          color: #0f172a !important;
          background: rgba(0, 0, 0, 0.05) !important;
        }
        .map-theme-dark .leaflet-bar a:last-child {
          border-bottom: none !important;
        }
        .map-theme-light .leaflet-bar a:last-child {
          border-bottom: none !important;
        }
        .map-theme-dark .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.9) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
        }
        .map-theme-light .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
        }
        .map-theme-dark .leaflet-popup-content {
          color: #ffffff !important;
          font-family: sans-serif;
        }
        .map-theme-light .leaflet-popup-content {
          color: #0f172a !important;
          font-family: sans-serif;
        }
        .map-theme-dark .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .map-theme-light .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
        }
        /* Popup text classes */
        .map-theme-dark .map-popup-text {
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .map-theme-light .map-popup-text {
          color: #0f172a !important;
        }
      `}</style>

      {/* Premium Cinematic Loading overlay */}
      {!mapLoaded && (
        <div className={cn(
          "absolute inset-0 z-[1000] flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300",
          isDarkMode ? "bg-zinc-950/60" : "bg-white/60"
        )}>
          <div className="relative">
            <div className="size-16 rounded-full border-b-2 border-t-2 border-emerald-500 animate-spin" />
            <div className="absolute inset-0 size-16 rounded-full border-r-2 border-l-2 border-sky-500 animate-spin-slow" />
            <MapPin className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 animate-pulse", isDarkMode ? "text-white" : "text-zinc-800")} />
          </div>
          <p className={cn("mt-6 text-sm font-black uppercase tracking-[0.3em] animate-pulse", isDarkMode ? "text-white" : "text-zinc-800")}>
            Localizando Oasis...
          </p>
          <div className="mt-2 w-32 h-1 bg-neutral-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-shimmer" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* Leaflet Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 z-0"
        style={{ height: '100%' }}
      />
    </div>
  );
}
