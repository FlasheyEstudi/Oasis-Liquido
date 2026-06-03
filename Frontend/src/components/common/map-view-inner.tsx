'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';
import type { MapMarker, MapViewProps } from './map-view';

// Dynamic loader for MapLibre GL JS from CDN to prevent bundle bloating and allow execution in sandbox
const loadMapLibre = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load MapLibre on server side'));
      return;
    }
    if ((window as any).maplibregl) {
      resolve((window as any).maplibregl);
      return;
    }

    // Load CSS
    const cssId = 'maplibre-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    // Load JS
    const jsId = 'maplibre-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).maplibregl) {
          resolve((window as any).maplibregl);
        } else {
          reject(new Error('MapLibre GL failed to load into window object'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load MapLibre GL script'));
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).maplibregl) {
          clearInterval(interval);
          resolve((window as any).maplibregl);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timeout loading MapLibre GL'));
      }, 10000);
    }
  });
};

// Polyline decoder (returns [lng, lat] for MapLibre compatibility)
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

    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

// Parse route geometry
function parseRouteGeometry(geometry: any): [number, number][] | null {
  if (typeof geometry === 'object' && geometry !== null) {
    if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
      return geometry.coordinates as [number, number][];
    }
  }
  try {
    const parsed = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
    if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
      return parsed.coordinates as [number, number][];
    }
  } catch {}

  if (typeof geometry === 'string') {
    try {
      const decoded = decodePolyline(geometry);
      if (decoded.length >= 2) {
        return decoded;
      }
    } catch {}
  }
  return null;
}

// Calculate Bearing (heading direction) between two coordinate points
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

// Calculate distance between points in meters
function distanceBetweenPoints(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if driver location is off path (deviated)
function isPointOffRoute(lat: number, lng: number, routeCoords: [number, number][], thresholdMeters = 60): boolean {
  if (!routeCoords || routeCoords.length < 2) return false;
  let minDistance = Infinity;
  for (const coord of routeCoords) {
    const dist = distanceBetweenPoints(lat, lng, coord[1], coord[0]); // coord is [lng, lat]
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance > thresholdMeters;
}

// Detailed Nicaragua Features GeoJSON (OSM enrichment)
const NICARAGUA_DETAIL_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // --- CIUDADES PRINCIPALES ---
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Managua' },
      geometry: { type: 'Point', coordinates: [-86.2514, 12.1364] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'León' },
      geometry: { type: 'Point', coordinates: [-86.8780, 12.4379] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Masaya' },
      geometry: { type: 'Point', coordinates: [-86.0960, 11.9740] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Granada' },
      geometry: { type: 'Point', coordinates: [-85.9560, 11.9300] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Estelí' },
      geometry: { type: 'Point', coordinates: [-86.3530, 13.0910] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Matagalpa' },
      geometry: { type: 'Point', coordinates: [-85.9180, 12.9250] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Chinandega' },
      geometry: { type: 'Point', coordinates: [-87.1290, 12.6290] }
    },
    {
      type: 'Feature',
      properties: { type: 'city', name: 'Jinotega' },
      geometry: { type: 'Point', coordinates: [-86.0020, 13.1010] }
    },

    // --- BARRIOS Y COLONIAS (MANAGUA) ---
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Altamira d\'Este' },
      geometry: { type: 'Point', coordinates: [-86.2550, 12.1220] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Los Robles' },
      geometry: { type: 'Point', coordinates: [-86.2640, 12.1240] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Bello Horizonte' },
      geometry: { type: 'Point', coordinates: [-86.2350, 12.1440] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Colonia Centroamérica' },
      geometry: { type: 'Point', coordinates: [-86.2420, 12.1060] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Linda Vista' },
      geometry: { type: 'Point', coordinates: [-86.2950, 12.1520] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Bolonia' },
      geometry: { type: 'Point', coordinates: [-86.2820, 12.1330] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Villa Fontana' },
      geometry: { type: 'Point', coordinates: [-86.2710, 12.0990] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Las Colinas' },
      geometry: { type: 'Point', coordinates: [-86.2430, 12.0880] }
    },
    {
      type: 'Feature',
      properties: { type: 'neighborhood', name: 'Reparto Schick' },
      geometry: { type: 'Point', coordinates: [-86.2280, 12.1090] }
    },

    // --- PUNTOS DE REFERENCIA Y LUGARES DE INTERÉS ---
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Rotonda Rubén Darío' },
      geometry: { type: 'Point', coordinates: [-86.2655, 12.1267] }
    },
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Metrocentro Managua' },
      geometry: { type: 'Point', coordinates: [-86.2658, 12.1255] }
    },
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Plaza España' },
      geometry: { type: 'Point', coordinates: [-86.2790, 12.1340] }
    },
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Rotonda El Periodista' },
      geometry: { type: 'Point', coordinates: [-86.2890, 12.1245] }
    },
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Catedral Metropolitana' },
      geometry: { type: 'Point', coordinates: [-86.2590, 12.1290] }
    },

    // --- CLÍNICAS Y FARMACIAS (MATCHING DB SEED) ---
    {
      type: 'Feature',
      properties: { type: 'clinic', name: 'Clínica Metropolitana de Nicaragua' },
      geometry: { type: 'Point', coordinates: [-86.2654, 12.1264] }
    },
    {
      type: 'Feature',
      properties: { type: 'clinic', name: 'Clínica San Lucas León' },
      geometry: { type: 'Point', coordinates: [-86.8780, 12.4379] }
    },
    {
      type: 'Feature',
      properties: { type: 'pharmacy', name: 'Farmacia Oasis Principal' },
      geometry: { type: 'Point', coordinates: [-86.2798, 12.1345] }
    },
    {
      type: 'Feature',
      properties: { type: 'pharmacy', name: 'Farmacia Oasis León' },
      geometry: { type: 'Point', coordinates: [-86.8750, 12.4350] }
    },
    {
      type: 'Feature',
      properties: { type: 'pharmacy', name: 'FarmaValue Altamira' },
      geometry: { type: 'Point', coordinates: [-86.2514, 12.1285] }
    },
    {
      type: 'Feature',
      properties: { type: 'pharmacy', name: 'Farmacia Kielsa Los Robles' },
      geometry: { type: 'Point', coordinates: [-86.2580, 12.1310] }
    },

    // --- MERCADOS ---
    {
      type: 'Feature',
      properties: { type: 'market', name: 'Mercado Central Roberto Huembes' },
      geometry: { type: 'Point', coordinates: [-86.2440, 12.1150] }
    },
    {
      type: 'Feature',
      properties: { type: 'market', name: 'Mercado Oriental' },
      geometry: { type: 'Point', coordinates: [-86.2650, 12.1420] }
    },

    // --- VÍAS Y ACCESOS PEATONALES ---
    {
      type: 'Feature',
      properties: { type: 'path', name: 'Andén Peatonal Oasis - Zona 1' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-86.251, 12.138],
          [-86.250, 12.139],
          [-86.248, 12.140]
        ]
      }
    },
    {
      type: 'Feature',
      properties: { type: 'path', name: 'Andén Peatonal Oasis - Zona Centro' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-86.273, 12.122],
          [-86.271, 12.124],
          [-86.269, 12.125]
        ]
      }
    }
  ]
};

export function MapViewInner({
  markers = [],
  center,
  zoom = DEFAULT_ZOOM,
  height = '400px',
  showUserLocation = false,
  isNavigating = false,
  route = null,
  onMarkerClick,
  className,
  theme = 'light',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // MapLibre GL map instance
  const activeMarkersRef = useRef<Record<string, any>>({}); // MapLibre GL marker references
  const routeCoordsRef = useRef<[number, number][]>([]);
  const lastDriverPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [driverBearing, setDriverBearing] = useState<number>(0);
  const [etaText, setEtaText] = useState<string | null>(null);

  // Dynamic theme detection checking Tailwind dark class
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

  // Center coordinate handling
  const defaultCenter: [number, number] = center 
    ? [center[1], center[0]] // maplibre expects [lng, lat]
    : [DEFAULT_LNG, DEFAULT_LAT];

  // OSRM Direct Street Routing engine with moto efficiency factors
  const fetchOSRMRoute = async (start: [number, number], end: [number, number]) => {
    try {
      console.log(`📡 [OSRM Client] Querying OSRM street route from ${start} to ${end}`);
      const publicUrl = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      const res = await fetch(publicUrl);
      const data = await res.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const osrmRoute = data.routes[0];
        const coordinates = osrmRoute.geometry.coordinates as [number, number][];
        
        // Dynamic vehicle speed/time calibration (car vs motorcycle)
        // Motorcycles navigate urban Nicaragua traffic roughly 25% faster
        const baseDurationSeconds = osrmRoute.duration;
        const vehicleType = 'motorcycle'; // Default vehicle type
        const speedMultiplier = vehicleType === 'motorcycle' ? 0.75 : 1.0;
        const finalDurationMinutes = Math.max(1, Math.round((baseDurationSeconds * speedMultiplier) / 60));
        
        setEtaText(`${finalDurationMinutes} min`);
        return coordinates;
      }
    } catch (err) {
      console.error('⚠️ Failed to fetch direct OSRM street route:', err);
    }
    return null;
  };

  // Initialize MapLibre GL JS Map
  useEffect(() => {
    if (!mapContainer.current) return;

    let mapInstance: any = null;

    loadMapLibre()
      .then((maplibregl) => {
        if (!mapContainer.current) return;

        // CARTO Vector Styles with CORS support
        const styleUrl = document.documentElement.classList.contains('dark')
          ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
          : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

        mapInstance = new maplibregl.Map({
          container: mapContainer.current,
          style: styleUrl,
          center: defaultCenter,
          zoom: zoom,
          pitch: isNavigating ? 58 : 0,
          bearing: 0,
          antialias: true,
        });

        // Add standard navigation control (top-right)
        mapInstance.addControl(new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }), 'top-right');

        mapInstance.on('load', () => {
          setMapLoaded(true);
          mapRef.current = mapInstance;

          // 1. Add 3D Extruded Buildings Layer dynamically
          const layers = mapInstance.getStyle().layers;
          let labelLayerId;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
              labelLayerId = layers[i].id;
              break;
            }
          }

          if (mapInstance.getSource('openmaptiles')) {
            mapInstance.addLayer({
              'id': '3d-buildings',
              'source': 'openmaptiles',
              'source-layer': 'building',
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': document.documentElement.classList.contains('dark') ? '#252529' : '#e2e8f0',
                'fill-extrusion-height': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0,
                  15.05, ['*', ['coalesce', ['get', 'render_height'], 12], 3.5]
                ],
                'fill-extrusion-base': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0,
                  15.05, ['*', ['coalesce', ['get', 'render_min_height'], 0], 3.5]
                ],
                'fill-extrusion-opacity': 0.65
              }
            }, labelLayerId);
          }

          // 2. Add Nicaragua Detailed Pedestrian and POI layers (OSM Enrichment)
          mapInstance.addSource('nicaragua-detail', {
            type: 'geojson',
            data: NICARAGUA_DETAIL_GEOJSON
          });

          // Pedestrian Paths (Andenes)
          mapInstance.addLayer({
            id: 'nicaragua-paths-layer',
            type: 'line',
            source: 'nicaragua-detail',
            filter: ['==', ['get', 'type'], 'path'],
            paint: {
              'line-color': '#10b981', // green emerald
              'line-width': 3,
              'line-dasharray': [2, 2],
              'line-opacity': 0.8
            }
          });

          // Detailed clinics/pharmacies/markets circles
          mapInstance.addLayer({
            id: 'nicaragua-pois-layer',
            type: 'circle',
            source: 'nicaragua-detail',
            filter: ['!=', ['get', 'type'], 'path'],
            paint: {
              'circle-radius': [
                'match',
                ['get', 'type'],
                'city', 8,
                'neighborhood', 5,
                6
              ],
              'circle-color': [
                'match',
                ['get', 'type'],
                'clinic', '#10b981',
                'pharmacy', '#0d9488',
                'market', '#f59e0b',
                'city', '#3b82f6',
                'neighborhood', '#8b5cf6',
                'landmark', '#ec4899',
                '#6b7280'
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });

          // Text labels for POIs
          mapInstance.addLayer({
            id: 'nicaragua-labels-layer',
            type: 'symbol',
            source: 'nicaragua-detail',
            filter: ['!=', ['get', 'type'], 'path'],
            layout: {
              'text-field': ['get', 'name'],
              'text-size': [
                'match',
                ['get', 'type'],
                'city', 12,
                'neighborhood', 10,
                9
              ],
              'text-offset': [0, 1.3],
              'text-anchor': 'top',
              'text-font': ['Noto Sans Regular']
            },
            paint: {
              'text-color': document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937',
              'text-halo-color': document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
              'text-halo-width': 1.5
            }
          });
        });
      })
      .catch((err) => {
        console.error('Failed to load MapLibre GL:', err);
        setMapError('Error al inicializar motor de mapas vectorial.');
      });

    return () => {
      // Clear markers
      Object.keys(activeMarkersRef.current).forEach((key) => {
        try {
          activeMarkersRef.current[key].remove();
        } catch (e) {}
      });
      activeMarkersRef.current = {};

      // Destroy MapLibre instance
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {}
      }
      setMapLoaded(false);
    };
  }, []);

  // Update theme style dynamically
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const styleUrl = isDarkMode
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
    try {
      mapRef.current.setStyle(styleUrl);
    } catch (e) {
      console.warn('Failed to switch style dynamically:', e);
    }
  }, [isDarkMode, mapLoaded]);

  // Handle Markers addition and smooth interpolation
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    loadMapLibre().then((maplibregl) => {
      const map = mapRef.current;
      const newMarkerIds = new Set(markers.map(m => m.id).filter(Boolean));

      // Remove obsolete markers
      Object.keys(activeMarkersRef.current).forEach((id) => {
        if (!newMarkerIds.has(id)) {
          try {
            activeMarkersRef.current[id].remove();
          } catch (e) {}
          delete activeMarkersRef.current[id];
        }
      });

      markers.forEach((marker) => {
        if (marker.lat == null || marker.lng == null || isNaN(marker.lat) || isNaN(marker.lng)) return;

        const markerId = marker.id || `marker-${marker.lat}-${marker.lng}`;
        const existingMarker = activeMarkersRef.current[markerId];

        // Custom marker DOM creator
        const createDOMElement = (type: string, bearing: number = 0) => {
          const el = document.createElement('div');
          el.className = `custom-maplibre-marker-${type}`;

          if (type === 'driver') {
            el.innerHTML = `
              <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(245, 158, 11, 0.25); border-radius: 50%; border: 2px solid #f59e0b; box-shadow: 0 0 14px rgba(245, 158, 11, 0.5);">
                <div id="driver-compass" style="width: 20px; height: 20px; transform: rotate(${bearing}deg); transition: transform 0.25s ease-out; display: flex; align-items: center; justify-content: center;">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22l10-6 10 6L12 2z"/>
                  </svg>
                </div>
              </div>
            `;
          } else if (type === 'pharmacy') {
            el.innerHTML = `
              <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(13, 148, 136, 0.25); border-radius: 50%; border: 2px solid #0d9488; box-shadow: 0 0 12px rgba(13, 148, 136, 0.4);">
                <div style="width: 14px; height: 14px; background: #0d9488; border-radius: 50%; border: 2.5px solid white;"></div>
              </div>
            `;
          } else if (type === 'clinic') {
            el.innerHTML = `
              <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(5, 150, 105, 0.25); border-radius: 50%; border: 2px solid #059669; box-shadow: 0 0 12px rgba(5, 150, 105, 0.4);">
                <div style="width: 14px; height: 14px; background: #059669; border-radius: 50%; border: 2.5px solid white;"></div>
              </div>
            `;
          } else if (type === 'destination' || type === 'patient') {
            el.innerHTML = `
              <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.25); animation: dest-pulse 2s infinite;"></div>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="#ef4444" style="filter: drop-shadow(0 2.5px 5px rgba(0,0,0,0.35));">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            `;
          } else {
            el.innerHTML = `
              <div style="width: 14px; height: 14px; background: #6b7280; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div>
            `;
          }
          return el;
        };

        if (existingMarker) {
          // Smooth location interpolation & dynamic camera tracking
          const startCoords = existingMarker.getLngLat();
          const targetLng = marker.lng;
          const targetLat = marker.lat;

          if (startCoords.lng !== targetLng || startCoords.lat !== targetLat) {
            // Update driver bearing dynamically on movement
            if (marker.type === 'driver') {
              const computedBearing = calculateBearing(startCoords.lat, startCoords.lng, targetLat, targetLng);
              setDriverBearing(computedBearing);
              lastDriverPosRef.current = { lat: targetLat, lng: targetLng };

              // Rotate compass DOM arrow dynamically
              const compass = existingMarker.getElement().querySelector('#driver-compass');
              if (compass) {
                (compass as HTMLElement).style.transform = `rotate(${computedBearing}deg)`;
              }

              // CAMERA TRACKING IN FIRST PERSON: ease camera in Waze 3D style
              // Using bearing, center, and pitch of 58 degrees
              if (isNavigating) {
                map.easeTo({
                  center: [targetLng, targetLat],
                  pitch: 68,
                  bearing: computedBearing,
                  zoom: 19.0,
                  duration: 1200,
                  essential: true
                });
              }

              // Dynamic Rerouting trigger: check if driver went off path by > 60 meters
              if (routeCoordsRef.current.length > 2 && isPointOffRoute(targetLat, targetLng, routeCoordsRef.current, 60)) {
                console.log('🔄 [Rerouting] Driver deviated from route. Re-calculating path from current location.');
                const lastPoint = routeCoordsRef.current[routeCoordsRef.current.length - 1];
                fetchOSRMRoute([targetLng, targetLat], lastPoint).then((newCoords) => {
                  if (newCoords && map.getSource('route')) {
                    routeCoordsRef.current = newCoords;
                    (map.getSource('route') as any).setData({
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: newCoords
                      }
                    });
                  }
                });
              }
            }

            existingMarker.setLngLat([targetLng, targetLat]);
          }
        } else {
          // Add brand new marker
          const type = marker.type || 'default';
          const el = createDOMElement(type, type === 'driver' ? driverBearing : 0);
          
          const glMarker = new maplibregl.Marker({ element: el })
            .setLngLat([marker.lng, marker.lat])
            .addTo(map);

          if (marker.label) {
            glMarker.setPopup(
              new maplibregl.Popup({ offset: 28 }).setHTML(`
                <div style="font-size: 11px; font-weight: 800; font-family: sans-serif; color: #1e293b; padding: 2px 4px;">
                  ${marker.label}
                </div>
              `)
            );
          }

          if (onMarkerClick) {
            el.addEventListener('click', () => onMarkerClick(marker));
          }

          activeMarkersRef.current[markerId] = glMarker;
        }
      });
    });
  }, [markers, mapLoaded, onMarkerClick, isNavigating]);

  // Handle Route drawing & dynamic OSRM recalculation
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const drawRouteLayer = async () => {
      let coords = route?.geometry ? parseRouteGeometry(route.geometry) : null;

      // OSRM street route calculator
      if (!coords || coords.length <= 2) {
        let originLng: number | undefined;
        let originLat: number | undefined;
        let destLng: number | undefined;
        let destLat: number | undefined;

        if (route?.origin && route?.destination) {
          const [origLng, origLat] = route.origin.split(',').map(Number);
          const [dLng, dLat] = route.destination.split(',').map(Number);
          originLng = origLng;
          originLat = origLat;
          destLng = dLng;
          destLat = dLat;
        } else if (markers.length >= 2) {
          const hasExplicitOrigin = markers.some(m => m.type === 'driver' || m.type === 'patient');
          const hasExplicitDest = markers.some(m => m.type === 'destination');

          if (hasExplicitOrigin || hasExplicitDest) {
            const originMarker = markers.find(m => m.type === 'patient') || markers.find(m => m.type === 'driver') || markers.find(m => m.type === 'pharmacy') || markers[0];
            const destMarker = markers.find(m => m.type === 'destination') || markers[markers.length - 1];
            if (originMarker && destMarker) {
              originLng = originMarker.lng;
              originLat = originMarker.lat;
              destLng = destMarker.lng;
              destLat = destMarker.lat;
            }
          }
        }

        if (originLng !== undefined && originLat !== undefined && destLng !== undefined && destLat !== undefined) {
          const directCoords = await fetchOSRMRoute(
            [originLng, originLat],
            [destLng, destLat]
          );
          if (directCoords) {
            coords = directCoords;
          }
        }
      }

      if (!coords || coords.length < 2) {
        // Clear existing route if any
        if (map.getSource('route')) {
          (map.getSource('route') as any).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        }
        return;
      }
      routeCoordsRef.current = coords;

      // Safe update or addition of route GeoJSON source and layer
      if (map.getSource('route')) {
        (map.getSource('route') as any).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coords
          }
        });
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
          }
        });

        // Add thick premium blue route line (grosor 5)
        map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2563eb', // Indigo Blue
            'line-width': 5,
            'line-opacity': 0.85
          }
        });
      }

      // Frame map view to fit route boundary bounds perfectly if not navigating
      // Frame map view to fit route boundary bounds perfectly if not navigating
      if (!isNavigating) {
        loadMapLibre().then((maplibregl) => {
          const bounds = new maplibregl.LngLatBounds();
          
          if (coords && coords.length > 0) {
            coords.forEach(c => bounds.extend(c));
          }

          markers.forEach((m) => {
            if (m.lat != null && m.lng != null) {
              bounds.extend([m.lng, m.lat]);
            }
          });

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: { top: 60, bottom: 60, left: 60, right: 60 },
              linear: false,
              duration: 1000
            });
            map.easeTo({
              pitch: 0,
              bearing: 0,
              duration: 1000
            });
          }
        });
      }
    };

    drawRouteLayer();
  }, [route, mapLoaded, markers, isNavigating]);

  // Handle Geolocation user tracking
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUserLocation) return;
    const map = mapRef.current;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 16.5,
          pitch: 58,
          duration: 1500
        });
      },
      (err) => console.warn('User Location failed:', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showUserLocation, mapLoaded]);

  // Center panning
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !center) return;
    mapRef.current.panTo([center[1], center[0]], { duration: 800 });
  }, [center?.[0], center?.[1], mapLoaded]);

  // Handle transition between overview and first-person navigation mode
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (isNavigating) {
      // Find driver marker or center
      const driverMarker = markers.find(m => m.type === 'driver');
      const targetLat = driverMarker?.lat ?? center?.[0] ?? DEFAULT_LAT;
      const targetLng = driverMarker?.lng ?? center?.[1] ?? DEFAULT_LNG;

      // Calculate initial bearing along the route if available
      let initialBearing = driverBearing || 0;
      if (!driverBearing && routeCoordsRef.current.length >= 2) {
        const firstPoint = routeCoordsRef.current[0];
        const secondPoint = routeCoordsRef.current[1];
        initialBearing = calculateBearing(firstPoint[1], firstPoint[0], secondPoint[1], secondPoint[0]);
      }

      // Animate camera into 3D navigation perspective
      map.flyTo({
        center: [targetLng, targetLat],
        zoom: 19.0,
        pitch: 68,
        bearing: initialBearing,
        duration: 1500,
        essential: true
      });
    } else {
      // Overview mode: Fit bounds to all markers and route coordinates
      loadMapLibre().then((maplibregl) => {
        const bounds = new maplibregl.LngLatBounds();
        
        if (routeCoordsRef.current.length > 0) {
          routeCoordsRef.current.forEach(c => bounds.extend(c));
        }

        markers.forEach((m) => {
          if (m.lat != null && m.lng != null) {
            bounds.extend([m.lng, m.lat]);
          }
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: { top: 60, bottom: 60, left: 60, right: 60 },
            linear: false,
            duration: 1500
          });
          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1500
          });
        }
      });
    }
  }, [isNavigating, mapLoaded, markers]);

  // Listen to physical device orientation (mobile compass) to rotate map dynamically
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !isNavigating) return;
    const map = mapRef.current;

    let lastHeading = 0;
    const threshold = 1.5; // Avoid jitter below 1.5 degrees change

    const handleOrientation = (event: any) => {
      let heading: number | null = null;

      // iOS compass heading
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        heading = event.webkitCompassHeading;
      }
      // Absolute alpha heading (standard deviceorientationabsolute or if event.absolute is true)
      else if (event.alpha !== null) {
        // alpha increases counter-clockwise, so compass bearing is 360 - alpha
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== null) {
        if (Math.abs(heading - lastHeading) > threshold) {
          lastHeading = heading;
          setDriverBearing(heading);

          // Find driver coordinates to ease to them with the new heading
          const driverMarker = markers.find(m => m.type === 'driver');
          const lat = driverMarker?.lat ?? center?.[0] ?? DEFAULT_LAT;
          const lng = driverMarker?.lng ?? center?.[1] ?? DEFAULT_LNG;

          map.easeTo({
            bearing: heading,
            center: [lng, lat],
            pitch: 68,
            zoom: 19.0,
            duration: 350,
            essential: true
          });
        }
      }
    };

    const registerOrientation = () => {
      if (typeof window !== 'undefined') {
        if ('ondeviceorientationabsolute' in window) {
          (window as any).addEventListener('deviceorientationabsolute', handleOrientation, true);
        } else {
          (window as any).addEventListener('deviceorientation', handleOrientation, true);
        }
      }
    };

    const unregisterOrientation = () => {
      if (typeof window !== 'undefined') {
        (window as any).removeEventListener('deviceorientationabsolute', handleOrientation, true);
        (window as any).removeEventListener('deviceorientation', handleOrientation, true);
      }
    };

    // Safe permission request check for iOS Safari
    if (
      typeof window !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent.requestPermission === 'function'
    ) {
      (window as any).DeviceOrientationEvent.requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            registerOrientation();
          }
        })
        .catch((err) => console.warn('Compass permission rejected:', err));
    } else if (typeof window !== 'undefined') {
      registerOrientation();
    }

    return () => {
      unregisterOrientation();
    };
  }, [isNavigating, mapLoaded, markers, center]);

  if (mapError) {
    return (
      <div className={cn('flex flex-col items-center justify-center bg-red-950/20 rounded-3xl border border-red-900/30 p-6', className)} style={{ height }}>
        <MapPin className="size-10 text-red-500/50 mb-2 animate-bounce" />
        <p className="text-sm font-medium text-red-400">{mapError}</p>
        <p className="text-xs text-red-500/70 mt-1">Verifica tu conexión y permisos de ubicación</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300',
        isDarkMode ? 'border-white/5 bg-zinc-950 shadow-black/50' : 'border-slate-200 bg-white shadow-slate-100',
        className
      )}
      style={{ height }}
    >
      {/* 3. Floating HUD for live OSRM Route statistics and ETA metadata */}
      {etaText && (
        <div className="absolute top-4 left-4 z-10 rounded-full border border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 px-3 py-1.5 shadow-xl backdrop-blur-md flex items-center gap-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-blue-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 dark:text-white">ETA: {etaText}</span>
        </div>
      )}

      {/* Embedded pulses */}
      <style jsx global>{`
        @keyframes dest-pulse {
          0% {
            transform: scale(0.65);
            opacity: 0.85;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .maplibregl-popup-content {
          border-radius: 14px !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>

      {/* Cinematic vector spinner loading screen */}
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
            Cargando Red Oasis...
          </p>
        </div>
      )}

      {/* MapLibre GL Canvas Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 z-0"
        style={{ height: '100%' }}
      />
    </div>
  );
}
