// OASIS - Prescription Validate Route
// POST /api/prescriptions/validate (pharmacy_manager only)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, validatePrescriptionSchema } from '@/lib/validators';
import * as prescriptionService from '@/lib/services/prescription.service';

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const validation = validateBody(validatePrescriptionSchema, body);
      if (!validation.success) return validation.error;

      const result = await prescriptionService.validatePrescription(validation.data.qr_data);

      return successResponse(result, 'Receta validada exitosamente');
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }
      if (error.message === 'PRESCRIPTION_EXPIRED') {
        return errorResponse(ErrorCodes.PRESCRIPTION_EXPIRED, 'Receta expirada', 400);
      }
      if (error.message === 'PRESCRIPTION_CANCELLED') {
        return errorResponse(ErrorCodes.PRESCRIPTION_CANCELLED, 'Receta cancelada', 400);
      }
      if (error.message === 'PRESCRIPTION_FULFILLED') {
        return errorResponse(ErrorCodes.INVALID_STATUS_TRANSITION, 'Receta ya dispensada completamente', 400);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager'] }
);
