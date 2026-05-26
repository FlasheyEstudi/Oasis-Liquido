// OASIS - Family Request API Route
// POST /api/v1/family/request
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody } from '@/lib/validators';
import { z } from 'zod/v4';
import * as familyService from '@/lib/services/family.service';

const requestLinkSchema = z.object({
  email: z.string().email('Email de dependiente inválido'),
  relationship: z.enum(['padre', 'madre', 'hijo', 'conyuge', 'tutor', 'otro']),
  permissions: z.array(z.string()).optional(),
});

/**
 * POST /api/v1/family/request
 * Supervisor requests to link a dependent by email
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(requestLinkSchema, body);
    if (!validation.success) return validation.error;

    const result = await familyService.requestFamilyLink(
      req.user.userId,
      body.email,
      body.relationship,
      body.permissions || ['view_health_data', 'buy_medicines', 'schedule_appointments'],
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(result, 'Invitación familiar generada con éxito', 201);
  } catch (error: any) {
    if (error.message === 'PATIENT_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Paciente no encontrado con ese correo', 404);
    }
    if (error.message === 'CANNOT_LINK_SELF') {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'No puedes vincularte a ti mismo', 400);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient', 'admin'] });
