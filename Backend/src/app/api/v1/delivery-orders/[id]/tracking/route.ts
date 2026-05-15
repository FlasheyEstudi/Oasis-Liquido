// OASIS - Delivery Order Tracking Route
// GET /api/delivery-orders/:id/tracking

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as deliveryService from '@/lib/services/delivery.service';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    const tracking = await deliveryService.getDeliveryTracking(id);

    // Role-based access check: patient owner, assigned driver, admin
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole !== 'admin') {
      const order = tracking.order;
      if (userRole === 'patient' && order.patientId !== userId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver este seguimiento', 403);
      }
      if (userRole === 'delivery_driver' && order.deliveryDriverId !== userId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver este seguimiento', 403);
      }
    }

    return successResponse(tracking);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
