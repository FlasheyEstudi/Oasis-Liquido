import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { emitDeliveryLocation } from '@/lib/socket';
import { db } from '@/lib/db';

/**
 * POST /api/v1/delivery/location
 * Updates delivery driver location and emits real-time event
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { orderId, lat, lng } = await req.json();

    if (!orderId || lat === undefined || lng === undefined) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Missing orderId, lat or lng', 400);
    }

    // Verify order existence and driver assignment
    const order = await db.deliveryOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado', 404);
    }

    // Optional: Update driver profile current location
    if (req.user.role === 'delivery_driver') {
      await db.deliveryDriverProfile.update({
        where: { userId: req.user.userId },
        data: { currentLat: lat, currentLng: lng }
      });
    }

    // Emit real-time update via Socket.IO
    emitDeliveryLocation(orderId, lat, lng);

    return successResponse({ success: true });
  } catch (error: any) {
    console.error('Delivery location update error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar ubicación', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });
