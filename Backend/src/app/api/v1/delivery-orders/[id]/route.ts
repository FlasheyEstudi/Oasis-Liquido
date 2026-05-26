// OASIS - Delivery Order Detail Route
// GET /api/delivery-orders/:id

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { getInMemoryDeliveries } from '@/lib/db/mock-deliveries';
import * as deliveryService from '@/lib/services/delivery.service';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    // Support mock orders from the shared global memory store
    if (id.startsWith('del-mock-')) {
      const mockDeliveries = getInMemoryDeliveries();
      const mockOrder = mockDeliveries.find((d: any) => d.id === id);
      if (mockOrder) {
        return successResponse(mockOrder);
      }
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }

    const order = await deliveryService.getDeliveryOrder(id);

    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }

    // Role-based access check
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole === 'admin') {
      // Admin can see any order
    } else if (userRole === 'patient') {
      if (order.patientId !== userId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver esta orden', 403);
      }
    } else if (userRole === 'delivery_driver') {
      if (order.deliveryDriverId !== userId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver esta orden', 403);
      }
    } else if (userRole === 'pharmacy_manager' || userRole === 'pharmacy_admin') {
      // Validar aislamiento multi-tenant para personal y administradores de farmacia
      let isAuthorized = false;
      if (userRole === 'pharmacy_admin') {
        const pharmacy = await db.pharmacy.findFirst({
          where: { id: order.pharmacyId, ownerId: userId }
        });
        if (pharmacy) isAuthorized = true;
      } else {
        const profile = await db.pharmacyManagerProfile.findUnique({
          where: { userId }
        });
        if (profile && profile.pharmacyId === order.pharmacyId) {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para ver esta orden', 403);
      }
    } else {
      // Cualquier otro rol sin especificar tiene prohibido el acceso
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para realizar esta acción', 403);
    }

    return successResponse(order);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
