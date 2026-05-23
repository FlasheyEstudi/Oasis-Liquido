import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as deliveryService from '@/lib/services/delivery.service';

/**
 * Encodes a list of coordinates into a standard polyline string
 */
function encodePolyline(points: [number, number][]): string {
  const encodeSignAndMagnitude = (num: number): string => {
    let sVal = Math.round(num * 1e5);
    sVal = sVal < 0 ? ~(sVal << 1) : sVal << 1;
    let out = '';
    while (sVal >= 0x20) {
      out += String.fromCharCode((0x20 | (sVal & 0x1f)) + 63);
      sVal >>= 5;
    }
    out += String.fromCharCode(sVal + 63);
    return out;
  };

  let lastLat = 0;
  let lastLng = 0;
  let result = '';

  for (const point of points) {
    const lat = point[0];
    const lng = point[1];
    const deltaLat = lat - lastLat;
    const deltaLng = lng - lastLng;
    result += encodeSignAndMagnitude(deltaLat);
    result += encodeSignAndMagnitude(deltaLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
}

/**
 * Calculates straight line distance (Haversine formula) in meters and estimates travel time
 */
function calculateHaversineFallback(originLat: number, originLng: number, destLat: number, destLng: number) {
  const R = 6371e3; // metres
  const phi1 = originLat * Math.PI / 180;
  const phi2 = destLat * Math.PI / 180;
  const deltaPhi = (destLat - originLat) * Math.PI / 180;
  const deltaLambda = (destLng - originLng) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // distance in meters
  const averageSpeed = 8.33; // average urban speed: 30 km/h in meters/sec (8.33 m/s)
  const duration = distance / averageSpeed; // duration in seconds

  // Generate standard polyline encoding for a straight line
  const geometry = encodePolyline([[originLat, originLng], [destLat, destLng]]);

  return {
    geometry,
    distance,
    duration
  };
}

import { calculateRealRoute } from '@/lib/map/osrm';

/**
 * GET /api/v1/delivery-orders/:id/route
 * Returns the street-aware routing polyline and route points from pharmacy/driver to delivery address.
 * Query params: ?currentLat=X&currentLng=Y&stage=to_pharmacy|to_patient
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const searchParams = req.nextUrl.searchParams;
    const currentLatParam = searchParams.get('currentLat');
    const currentLngParam = searchParams.get('currentLng');
    const stage = searchParams.get('stage'); // 'to_pharmacy' | 'to_patient'

    const order = await deliveryService.getDeliveryOrder(id);
    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }

    // Role-based access check
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole === 'patient' && order.patientId !== userId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver esta orden', 403);
    } else if (userRole === 'delivery_driver' && order.deliveryDriverId !== userId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver esta orden', 403);
    }

    // 1. Determine origin coordinates (override with query params if available)
    const driverProfile = (order as any).deliveryDriver?.deliveryDriverProfile || (order as any).deliveryDriver?.delivery_driver_profile;
    
    let originLat = parseFloat(currentLatParam || '');
    let originLng = parseFloat(currentLngParam || '');

    if (isNaN(originLat) || isNaN(originLng)) {
      originLat = (order.status === 'in_transit' && driverProfile?.currentLat) 
        ? driverProfile.currentLat 
        : (order.pickupLat || (order.pharmacy as any)?.latitude);
        
      originLng = (order.status === 'in_transit' && driverProfile?.currentLng) 
        ? driverProfile.currentLng 
        : (order.pickupLng || (order.pharmacy as any)?.longitude);
    }

    // 2. Determine destination coordinates based on stage
    let destLat = order.deliveryLat;
    let destLng = order.deliveryLng;

    if (stage === 'to_pharmacy') {
      destLat = order.pickupLat || (order.pharmacy as any)?.latitude;
      destLng = order.pickupLng || (order.pharmacy as any)?.longitude;
    }

    if (!originLat || !originLng || !destLat || !destLng) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Coordenadas de origen o destino no definidas en la orden', 400);
    }

    // 3. Compute real OSRM street route
    try {
      console.log(`🛣️ Calculating real route from (${originLat}, ${originLng}) to (${destLat}, ${destLng}) for stage: ${stage || 'to_patient'}`);
      const routeData = await calculateRealRoute(originLat, originLng, destLat, destLng);
      return successResponse(routeData);
    } catch (e: any) {
      console.warn('⚠️ OSRM public services failed, rendering Haversine fallback:', e.message);
      
      const fallbackData = calculateHaversineFallback(originLat, originLng, destLat, destLng);
      return successResponse({
        route: [{ lat: originLat, lng: originLng }, { lat: destLat, lng: destLng }],
        distanceKm: fallbackData.distance / 1000,
        durationMinutes: Math.round(fallbackData.duration / 60),
        durationText: `${Math.round(fallbackData.duration / 60)} min`,
        geometry: fallbackData.geometry,
        distance_meters: fallbackData.distance,
        duration_seconds: fallbackData.duration,
      });
    }

  } catch (error: any) {
    console.error('Error fetching delivery order route:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
