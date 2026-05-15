// OASIS - Patient Profile Route
// PATCH /api/users/me/patient-profile (patient only) - Update own patient profile

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updatePatientProfileSchema } from '@/lib/validators';
import * as userService from '@/lib/services/user.service';

/**
 * PATCH /api/users/me/patient-profile
 * Update own patient profile (patient only)
 * Body: { date_of_birth?, blood_type?, allergies?, medical_notes? }
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(updatePatientProfileSchema, body);
    if (!validation.success) return validation.error;

    const profile = await userService.updatePatientProfile(
      req.user.userId,
      {
        date_of_birth: body.date_of_birth,
        blood_type: body.blood_type,
        allergies: body.allergies,
        medical_notes: body.medical_notes,
      },
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(profile, 'Perfil de paciente actualizado exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Perfil de paciente no encontrado', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['patient'] });
