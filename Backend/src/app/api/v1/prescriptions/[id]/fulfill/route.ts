// OASIS - Prescription Fulfill Route
// POST /api/prescriptions/:id/fulfill (pharmacy_manager only)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, fulfillPrescriptionSchema } from '@/lib/validators';
import * as prescriptionService from '@/lib/services/prescription.service';

export const POST = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      const body = await req.json();
      const validation = validateBody(fulfillPrescriptionSchema, body);
      if (!validation.success) return validation.error;

      const ipAddress =
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      const result = await prescriptionService.fulfillPrescription(
        id,
        validation.data,
        req.user.userId,
        ipAddress,
        userAgent
      );

      return successResponse(result, 'Receta dispensada exitosamente');
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }
      if (error.message === 'INSUFFICIENT_STOCK') {
        return errorResponse(ErrorCodes.INSUFFICIENT_STOCK, 'Stock insuficiente', 400);
      }
      if (error.message === 'PRESCRIPTION_EXPIRED') {
        return errorResponse(ErrorCodes.PRESCRIPTION_EXPIRED, 'Receta expirada', 400);
      }
      if (error.message === 'PRESCRIPTION_CANCELLED') {
        return errorResponse(ErrorCodes.PRESCRIPTION_CANCELLED, 'Receta cancelada', 400);
      }
      if (error.message === 'INVALID_STATUS_TRANSITION') {
        return errorResponse(ErrorCodes.INVALID_STATUS_TRANSITION, 'Transición de estado no válida', 400);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager'] }
);
