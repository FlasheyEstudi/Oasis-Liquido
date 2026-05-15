// OASIS - Prescription Detail Route
// GET /api/prescriptions/:id (owner patient/doctor, pharmacy_manager, admin)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as prescriptionService from '@/lib/services/prescription.service';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      const prescription = await prescriptionService.getPrescription(id);

      if (!prescription) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }

      // Role-based access: patient/doctor can only see their own
      if (req.user.role === 'patient' && prescription.patientId !== req.user.userId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
      }
      if (req.user.role === 'doctor' && prescription.doctorId !== req.user.userId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
      }

      return successResponse(prescription);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  }
);
