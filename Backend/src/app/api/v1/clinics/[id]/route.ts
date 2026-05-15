// OASIS - Clinic by ID Route
// PATCH /api/clinics/:id (admin only)

import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { withAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updateClinicSchema } from '@/lib/validators';
import * as clinicService from '@/lib/services/clinic.service';

/**
 * PATCH /api/clinics/:id
 * Admin only — updates a clinic's data.
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    const body = await req.json();
    const validation = validateBody(updateClinicSchema, body);
    if (!validation.success) return validation.error;

    const updated = await clinicService.updateClinic(
      id,
      validation.data,
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(updated, 'Clínica actualizada exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Clínica no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin'] });
