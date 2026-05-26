// OASIS - Family API Routes
// GET /api/v1/family - List caregiver/patient relations
// POST /api/v1/family - Create relation (patient_email, relationship)

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody } from '@/lib/validators';
import { z } from 'zod/v4';
import * as familyService from '@/lib/services/family.service';

const createRelationshipSchema = z.object({
  patient_email: z.string().email('Email de paciente inválido'),
  relationship: z.enum(['padre', 'madre', 'hijo', 'conyuge', 'tutor', 'otro']),
});

/**
 * GET /api/v1/family
 * List all patient caregiver relations
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const relationships = await familyService.getFamilyRelationships(req.user.userId);
    return successResponse(relationships, 'Relaciones familiares cargadas');
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient', 'admin'] });

/**
 * POST /api/v1/family
 * Link caregiver to a patient
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createRelationshipSchema, body);
    if (!validation.success) return validation.error;

    const relationship = await familyService.requestFamilyLink(
      req.user.userId,
      body.patient_email,
      body.relationship,
      undefined,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(relationship, 'Solicitud de relación creada exitosamente', 201);
  } catch (error: any) {
    if (error.message === 'PATIENT_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Paciente no encontrado con ese correo', 404);
    }
    if (error.message === 'CANNOT_LINK_SELF') {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'No puedes vincularte a ti mismo como familiar', 400);
    }
    if (error.message === 'RELATIONSHIP_ALREADY_EXISTS') {
      return errorResponse(ErrorCodes.CONFLICT, 'Ya existe una relación activa con este familiar', 409);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient'] });
