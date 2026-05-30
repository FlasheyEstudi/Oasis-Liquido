
import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

/**
 * GET /api/v1/routes/driving
 * Fetches routing data from OSRM for street-aware navigation
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Origin and destination are required (format: lng,lat)', 400);
    }

    const osrmBaseUrl = process.env.OSRM_BASE_URL || 'http://localhost:5000';
    const path = `/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`;

    const servers = [
      osrmBaseUrl,
      `https://routing.openstreetmap.de/routed-car`,
      `https://router.project-osrm.org`
    ];

    let response: Response | null = null;
    let fallbackUsed = false;
    let success = false;

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      const url = `${server}${path}`;
      try {
        console.log(`📡 [Route API] Trying OSRM server: ${server}`);
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          response = res;
          fallbackUsed = i > 0;
          success = true;
          break;
        } else {
          console.warn(`⚠️ [Route API] Server ${server} returned status: ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`⚠️ [Route API] Connection to ${server} failed: ${err.message}`);
      }
    }

    if (!success || !response) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Ambos motores de ruta (primario y fallbacks) fallaron', 502);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'No se encontró una ruta viable', 404);
    }

    const route = data.routes[0];

    return successResponse({
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
      geometry: route.geometry, // GeoJSON LineString
      waypoints: data.waypoints,
      fallbackUsed
    });
  } catch (error: any) {
    console.error('Route API Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno al procesar ruta', 500);
  }
}
