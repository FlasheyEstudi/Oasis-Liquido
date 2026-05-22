
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
    // OSRM expects coordinates in format: {longitude},{latitude}
    const path = `/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`;
    const primaryUrl = `${osrmBaseUrl}${path}`;
    const fallbackUrl = `https://router.project-osrm.org${path}`;

    let response: Response;
    let fallbackUsed = false;

    try {
      response = await fetch(primaryUrl);
      if (!response.ok) {
        throw new Error(`Primary OSRM server responded with status: ${response.status}`);
      }
    } catch (primaryError: any) {
      console.warn(`Primary OSRM engine failed (${primaryUrl}): ${primaryError.message}. Falling back to public OSRM...`);
      try {
        response = await fetch(fallbackUrl);
        fallbackUsed = true;
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fallback OSRM Error:', errorText);
          return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al contactar motor de rutas fallback', 502);
        }
      } catch (fallbackError: any) {
        console.error('Fallback OSRM also failed:', fallbackError);
        return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Ambos motores de ruta (primario y fallback) fallaron', 502);
      }
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
