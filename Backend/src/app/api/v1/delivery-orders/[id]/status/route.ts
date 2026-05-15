// OASIS - Delivery Order Status Update Route
// PATCH /api/delivery-orders/:id/status

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updateDeliveryStatusSchema } from '@/lib/validators';
import * as deliveryService from '@/lib/services/delivery.service';

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    const body = await req.json();
    const validation = validateBody(updateDeliveryStatusSchema, body);
    if (!validation.success) return validation.error;

    const { status, delivery_driver_id } = validation.data;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const data = await deliveryService.updateDeliveryStatus(
      id,
      status,
      userRole,
      userId,
      delivery_driver_id,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(data, 'Estado de entrega actualizado');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Orden de entrega no encontrada', 404);
    }
    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return errorResponse(ErrorCodes.INVALID_STATUS_TRANSITION, 'Transición de estado no válida', 400);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para realizar esta acción', 403);
    }
    if (error.message?.startsWith('VALIDATION_ERROR')) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.message.replace('VALIDATION_ERROR: ', ''), 400);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['pharmacy_manager', 'delivery_driver'] });
