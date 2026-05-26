// OASIS - Family Update Permissions API Route
// PUT /api/v1/family/[id]/permissions
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody } from '@/lib/validators';
import { z } from 'zod/v4';
import * as familyService from '@/lib/services/family.service';

const permissionsSchema = z.object({
  permissions: z.array(z.string()),
});

/**
 * PUT /api/v1/family/[id]/permissions
 * Update supervisor permissions over dependent
 */
export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: relationshipId } = await params;
    if (!relationshipId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Identificador de relación inválido', 400);
    }

    const body = await req.json();
    const validation = validateBody(permissionsSchema, body);
    if (!validation.success) return validation.error;

    const result = await familyService.updateFamilyPermissions(
      req.user.userId,
      relationshipId,
      body.permissions,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(result, 'Permisos actualizados con éxito');
  } catch (error: any) {
    if (error.message === 'RELATIONSHIP_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Relación familiar no encontrada o no autorizada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient', 'admin'] });
