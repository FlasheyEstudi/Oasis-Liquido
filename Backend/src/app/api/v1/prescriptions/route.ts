// OASIS - Prescriptions List & Create Route
// GET /api/prescriptions (patient own, doctor own, pharmacy_manager, admin)
// POST /api/prescriptions (doctor only)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createPrescriptionSchema } from '@/lib/validators';
import * as prescriptionService from '@/lib/services/prescription.service';
import { parsePagination } from '@/lib/utils/pagination';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id') || undefined;
    const doctorId = searchParams.get('doctor_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const { page, limit, skip } = parsePagination(searchParams);

    const result = await prescriptionService.getPrescriptions({
      patientId,
      doctorId,
      status,
      userRole: req.user.role,
      userId: req.user.userId,
      page,
      limit,
      skip,
    });

    return paginatedResponse(result.data, page, limit, result.total);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const validation = validateBody(createPrescriptionSchema, body);
      if (!validation.success) return validation.error;

      const ipAddress =
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      const result = await prescriptionService.createPrescription(
        validation.data,
        req.user.userId,
        ipAddress,
        userAgent
      );

      return successResponse(result, 'Receta creada exitosamente', 201);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Recurso no encontrado', 404);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['doctor'] }
);
