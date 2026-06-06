'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';
import type { MapMarker, MapViewProps } from './map-view';
import { getMapStyle } from '@/lib/map/tile-providers';

import 'maplibre-gl/dist/maplibre-gl.css';

const loadMapLibre = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot load MapLibre on server side');
  }
  const mod = await import('maplibre-gl');
  return mod.default || mod;
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

// Project a point onto a line segment [lng, lat]
function projectPointOnSegment(p: [number, number], a: [number, number], b: [number, number]): [number, number] {
  const x = p[0], y = p[1];
  const x1 = a[0], y1 = a[1];
  const x2 = b[0], y2 = b[1];
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) return a;
  
  let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t)); // Clamp to segment
  
  return [x1 + t * dx, y1 + t * dy];
}

// Find the closest point on the route for snapping
function snapToRoute(lat: number, lng: number, routeCoords: [number, number][], maxDistanceMeters = 50): { lat: number; lng: number } {
  if (!routeCoords || routeCoords.length < 2) return { lat, lng };
  
  let closestPoint: [number, number] = [lng, lat];
  let minDistance = Infinity;
  
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const a = routeCoords[i]; // [lng, lat]
    const b = routeCoords[i+1];
    const projected = projectPointOnSegment([lng, lat], a, b);
    
    const dist = distanceBetweenPoints(lat, lng, projected[1], projected[0]);
    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = projected;
    }
  }
  
  if (minDistance <= maxDistanceMeters) {
    return { lat: closestPoint[1], lng: closestPoint[0] };
  }
  
  return { lat, lng };
}

// Smooth location interpolation animation
function animateMarker(marker: any, fromLngLat: { lng: number; lat: number }, toLngLat: { lng: number; lat: number }, durationMs: number = 1400) {
  const start = performance.now();
  
  function step(now: number) {
    const progress = Math.min(1, (now - start) / durationMs);
    // Quadratic easing out for ultra-smooth fluid movement
    const ease = progress * (2 - progress);
    
    const lng = fromLngLat.lng + (toLngLat.lng - fromLngLat.lng) * ease;
    const lat = fromLngLat.lat + (toLngLat.lat - fromLngLat.lat) * ease;
    
    marker.setLngLat([lng, lat]);
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  
  requestAnimationFrame(step);
}

// Safe check for source to avoid "this.style is undefined" MapLibre crash
function safeGetSource(map: any, id: string) {
  if (!map || !map.style) return null;
  try {
    return map.getSource(id);
  } catch (e) {
    return null;
  }
}

// Safe check for layer to avoid crashes
function safeGetLayer(map: any, id: string) {
  if (!map || !map.style) return null;
  try {
    return map.getLayer(id);
  } catch (e) {
    return null;
  }
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

    // --- PARQUES Y ZONAS VERDES (MANAGUA) ---
    {
      type: 'Feature',
      properties: { type: 'park', name: 'Parque Luis Alfonso Velásquez Flores' },
      geometry: { type: 'Point', coordinates: [-86.2725, 12.1550] }
    },
    {
      type: 'Feature',
      properties: { type: 'park', name: 'Loma de Tiscapa (Reserva Histórica)' },
      geometry: { type: 'Point', coordinates: [-86.2715, 12.1385] }
    },
    {
      type: 'Feature',
      properties: { type: 'park', name: 'Parque de la Paz Managua' },
      geometry: { type: 'Point', coordinates: [-86.2690, 12.1510] }
    },
    {
      type: 'Feature',
      properties: { type: 'park', name: 'Parque Japonés' },
      geometry: { type: 'Point', coordinates: [-86.2600, 12.1220] }
    },

    // --- ESTABLECIMIENTOS COMERCIALES Y ENTIDADES ---
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Plaza Inter Managua' },
      geometry: { type: 'Point', coordinates: [-86.2750, 12.1435] }
    },
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Palacio Nacional de la Cultura' },
      geometry: { type: 'Point', coordinates: [-86.2710, 12.1565] }
    },
    {
      type: 'Feature',
      properties: { type: 'landmark', name: 'Puerto Salvador Allende' },
      geometry: { type: 'Point', coordinates: [-86.2790, 12.1640] }
    },
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
  onMapLoad,
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
      .then(async (maplibregl) => {
        if (!mapContainer.current) return;

        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const styleUrl = await getMapStyle(currentTheme);

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
          if (onMapLoad) {
            onMapLoad(mapInstance);
          }

          // 1. Add 3D Extruded Buildings Layer dynamically
          const layers = mapInstance.getStyle().layers;
          let labelLayerId;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
              labelLayerId = layers[i].id;
              break;
            }
          }

          if (safeGetSource(mapInstance, 'openmaptiles')) {
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
          if (!safeGetSource(mapInstance, 'nicaragua-detail')) {
            mapInstance.addSource('nicaragua-detail', {
              type: 'geojson',
              data: NICARAGUA_DETAIL_GEOJSON
            });
          }

          if (!safeGetLayer(mapInstance, 'nicaragua-paths-layer') && safeGetSource(mapInstance, 'nicaragua-detail')) {
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
          }

          if (!safeGetLayer(mapInstance, 'nicaragua-pois-layer') && safeGetSource(mapInstance, 'nicaragua-detail')) {
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
          }

          if (!safeGetLayer(mapInstance, 'nicaragua-labels-layer') && safeGetSource(mapInstance, 'nicaragua-detail')) {
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
          }
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
    
    const updateStyle = async () => {
      const styleUrl = await getMapStyle(isDarkMode ? 'dark' : 'light');
      try {
        if (mapRef.current) {
          mapRef.current.setStyle(styleUrl);
        }
      } catch (e) {
        console.warn('Failed to switch style dynamically:', e);
      }
    };
    
    updateStyle();
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
              <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                <!-- Glowing radar halo representing telemetry pulse -->
                <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(20, 184, 166, 0.15); border: 1.5px solid rgba(20, 184, 166, 0.3); animation: dest-pulse 2s infinite;"></div>
                
                <div id="driver-compass" style="width: 40px; height: 40px; transform: rotate(${bearing}deg); transition: transform 0.25s ease-out; display: flex; align-items: center; justify-content: center; position: relative;">
                  <!-- Dynamic Headlight Beam (triangular headlight glow) -->
                  <div style="position: absolute; bottom: 20px; width: 55px; height: 75px; background: linear-gradient(to top, rgba(20, 184, 166, 0) 10%, rgba(20, 184, 166, 0.4) 100%); clip-path: polygon(50% 100%, 0 0, 100% 0); transform-origin: bottom center; filter: blur(1.5px); pointer-events: none; opacity: 0.85; z-index: 1;"></div>
                  
                  <!-- Motorcycle premium circle SVG element -->
                  <div style="width: 30px; height: 30px; background: #0b0f19; border-radius: 50%; border: 2px solid #14b8a6; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 10;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="5.5" cy="17.5" r="2.5" fill="#14b8a6" fill-opacity="0.25"/>
                      <circle cx="18.5" cy="17.5" r="2.5" fill="#14b8a6" fill-opacity="0.25"/>
                      <path d="M5.5 17.5H10l1.5-4.5H16l1.5 4.5h1" />
                      <path d="M15 8h2.5l1.5 3.5" />
                      <path d="M10 8h2l1.5 5" />
                      <circle cx="16" cy="7" r="1" fill="#14b8a6" />
                    </svg>
                  </div>
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

        // Resolve snap to route for driver marker to align exactly with path
        let finalLat = marker.lat;
        let finalLng = marker.lng;
        if (marker.type === 'driver' && routeCoordsRef.current.length >= 2) {
          const snapped = snapToRoute(marker.lat, marker.lng, routeCoordsRef.current, 50);
          finalLat = snapped.lat;
          finalLng = snapped.lng;
        }

        if (existingMarker) {
          // Smooth location interpolation & dynamic camera tracking
          const startCoords = existingMarker.getLngLat();
          const targetLng = finalLng;
          const targetLat = finalLat;

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
                  const routeSource = safeGetSource(map, 'route');
                  if (newCoords && routeSource) {
                    routeCoordsRef.current = newCoords;
                    (routeSource as any).setData({
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

              // Smoothly animate the position to prevent jumping
              animateMarker(existingMarker, { lng: startCoords.lng, lat: startCoords.lat }, { lng: targetLng, lat: targetLat }, 1400);
            } else {
              existingMarker.setLngLat([targetLng, targetLat]);
            }
          }
        } else {
          // Add brand new marker
          const type = marker.type || 'default';
          const el = createDOMElement(type, type === 'driver' ? driverBearing : 0);
          
          const glMarker = new maplibregl.Marker({ element: el })
            .setLngLat([finalLng, finalLat])
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
        const routeSource = safeGetSource(map, 'route');
        if (routeSource) {
          (routeSource as any).setData({
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
      const routeSource = safeGetSource(map, 'route');
      if (routeSource) {
        (routeSource as any).setData({
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
      }

      // Safe update or addition of layer
      const routeLayer = safeGetLayer(map, 'route-layer');
      if (!routeLayer && safeGetSource(map, 'route')) {
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
