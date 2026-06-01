// OASIS - Delivery Order Driver Assignment Route
// PATCH /api/v1/delivery-orders/:id/assign

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as deliveryService from '@/lib/services/delivery.service';

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    const body = await req.json();
    
    // Support both 'driver_id' (used in order-management.tsx) and 'delivery_driver_id' (used in DB mapping)
    const driverId = body.driver_id || body.delivery_driver_id || body.deliveryDriverId;
    
    if (!driverId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'El ID del repartidor (driver_id) es obligatorio', 400);
    }

    const userRole = req.user.role;
    const userId = req.user.userId;

    // Use updateDeliveryStatus with status 'assigned' and driver ID
    const updatedOrder = await deliveryService.updateDeliveryStatus(
      id,
      'assigned',
      userRole,
      userId,
      driverId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    const mappedOrder = deliveryService.mapDeliveryOrder(updatedOrder);
    return successResponse(mappedOrder, 'Repartidor asignado correctamente al pedido');
  } catch (error: any) {

    console.error('Error assigning driver:', error);
    
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }
    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return errorResponse(ErrorCodes.INVALID_STATUS_TRANSITION, 'El pedido no se encuentra en un estado pendiente para asignación', 400);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para realizar esta acción en este pedido', 403);
    }
    if (error.message?.startsWith('VALIDATION_ERROR')) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.message.replace('VALIDATION_ERROR: ', ''), 400);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor al asignar el repartidor', 500);
  }
}, { roles: ['pharmacy_manager', 'pharmacy_admin', 'admin'] });
