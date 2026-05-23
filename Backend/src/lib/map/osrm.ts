import fetch from 'node-fetch';

export interface RouteResponse {
  route: Array<{ lat: number; lng: number }>; // Coordinates of the route
  distanceKm: number;      // Distance in kilometers
  durationMinutes: number;  // Estimated time in minutes
  durationText: string;     // Formatted text, e.g., "15 min"
  geometry?: string;        // Polyline string for backward compatibility
  distance_meters?: number; // Distance in meters
  duration_seconds?: number;// Duration in seconds
}

/**
 * Calculates a real street-aware driving route using OpenStreetMap/OSRM
 */
export async function calculateRealRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResponse> {
  const path = `/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
  const pathPolyline = `/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline`;
  
  const servers = [
    `https://routing.openstreetmap.de/routed-car`,
    `https://router.project-osrm.org`
  ];
  
  let responseData: any = null;
  let polylineGeometry: string = '';
  
  // Try GeoJSON format first
  for (const server of servers) {
    try {
      console.log(`📡 [OSRM] Fetching GeoJSON route from: ${server}`);
      const res = await fetch(`${server}${path}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          responseData = data.routes[0];
          break;
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ [OSRM] Server ${server} failed:`, e.message);
    }
  }

  // Also fetch Polyline format for standard MapView compatibility
  for (const server of servers) {
    try {
      console.log(`📡 [OSRM] Fetching Polyline route from: ${server}`);
      const res = await fetch(`${server}${pathPolyline}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          polylineGeometry = data.routes[0].geometry;
          break;
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ [OSRM] Polyline fetch failed for ${server}:`, e.message);
    }
  }

  if (!responseData) {
    throw new Error('No se pudo calcular la ruta con ningún servidor OSRM');
  }

  const coordinates = responseData.geometry.coordinates.map((coord: number[]) => ({
    lat: coord[1],
    lng: coord[0]
  }));

  const distanceMeters = responseData.distance;
  const durationSeconds = responseData.duration;

  return {
    route: coordinates,
    distanceKm: distanceMeters / 1000,
    durationMinutes: Math.round(durationSeconds / 60),
    durationText: `${Math.round(durationSeconds / 60)} min`,
    geometry: polylineGeometry,
    distance_meters: distanceMeters,
    duration_seconds: durationSeconds
  };
}
