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
 * Decodes a Google encoded polyline format string into lat/lng coordinate objects.
 */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
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

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * High-fidelity straight line fallback when all public OSRM servers are offline.
 */
function calculateHaversineFallback(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): RouteResponse {
  console.log("⚡ [OSRM Fallback] Computing highly resilient Haversine fallback route.");
  const R = 6371; // Earth's radius in km
  const dLat = (endLat - startLat) * Math.PI / 180;
  const dLng = (endLng - startLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;

  // Add 30% winding margin for real city street layout simulation
  const estimatedRealDistanceKm = distanceKm * 1.30;
  const averageSpeedKmh = 25; // 25 km/h urban traffic speed
  const estimatedDurationSeconds = Math.round((estimatedRealDistanceKm / averageSpeedKmh) * 3600);

  // Generate intermediate coordinates for clean vector drawing on patient map
  const route: { lat: number; lng: number }[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    route.push({
      lat: startLat + (endLat - startLat) * fraction,
      lng: startLng + (endLng - startLng) * fraction
    });
  }

  return {
    route,
    distanceKm: estimatedRealDistanceKm,
    durationMinutes: Math.ceil(estimatedDurationSeconds / 60),
    durationText: `${Math.ceil(estimatedDurationSeconds / 60)} min`,
    distance_meters: Math.round(estimatedRealDistanceKm * 1000),
    duration_seconds: estimatedDurationSeconds,
    geometry: ""
  };
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
  const path = `/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline&steps=false`;
  
  const servers = [
    `https://routing.openstreetmap.de/routed-car`,
    `https://router.project-osrm.org`
  ];
  
  let responseData: any = null;

  // Single super-optimized network loop to fetch all details at once
  for (const server of servers) {
    try {
      console.log(`📡 [OSRM] Querying routing server: ${server}`);
      const res = await fetch(`${server}${path}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          responseData = data.routes[0];
          break;
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ [OSRM] Server ${server} query failed:`, e.message);
    }
  }

  // Fallback if all external APIs are unreachable or rate-limited
  if (!responseData) {
    return calculateHaversineFallback(startLat, startLng, endLat, endLng);
  }

  try {
    const polylineGeometry = responseData.geometry;
    const coordinates = decodePolyline(polylineGeometry);
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
  } catch (err: any) {
    console.error("⚠️ [OSRM] Parse error, falling back to Haversine:", err.message);
    return calculateHaversineFallback(startLat, startLng, endLat, endLng);
  }
}
