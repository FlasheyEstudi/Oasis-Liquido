// OASIS - Family Caregiver Act-As API Route
// POST /api/v1/family/[id]/act-as
// Allows caregiver to acquire a delegation access token to act on behalf of a dependent

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { signAccessToken } from '@/lib/auth/jwt';
import { createAuditLog } from '@/lib/services/audit.service';

/**
 * POST /api/v1/family/[id]/act-as
 * Switch session context to dependent
 */
export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: dependentId } = await context.params;
    const caregiverId = req.user.userId;

    // Verify active family relationship exists where current user is the caregiver
    const relationship = await db.familyRelationship.findFirst({
      where: {
        caregiverId,
        patientId: dependentId,
        isActive: true,
        status: 'active', // OAS-004: Ensure relationship is formally accepted and verified
      },
      include: {
        patient: true,
      },
    });

    if (!relationship) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        'No tienes una relación de cuidador activa autorizada con este paciente',
        403
      );
    }

    // Generate access token in dependent's context
    const token = signAccessToken({
      userId: relationship.patient.id,
      email: relationship.patient.email,
      role: 'patient',
    });

    // Audit log
    await createAuditLog({
      userId: caregiverId,
      action: 'act_as',
      entityType: 'user',
      entityId: dependentId,
      details: JSON.stringify({ caregiverId, dependentId, relationshipId: relationship.id }),
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return successResponse(
      {
        token,
        user: {
          id: relationship.patient.id,
          name: relationship.patient.name,
          email: relationship.patient.email,
          role: 'patient',
        },
      },
      `Iniciada sesión delegada como ${relationship.patient.name} exitosamente`
    );
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient'] });
