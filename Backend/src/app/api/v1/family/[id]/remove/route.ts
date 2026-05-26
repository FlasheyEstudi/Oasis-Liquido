// OASIS - Family Remove Link API Route
// DELETE /api/v1/family/[id]/remove
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as familyService from '@/lib/services/family.service';

/**
 * DELETE /api/v1/family/[id]/remove
 * Removes / deactivates a family link
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: relationshipId } = await params;
    if (!relationshipId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Identificador de relación inválido', 400);
    }

    const result = await familyService.deleteFamilyRelationship(
      req.user.userId,
      relationshipId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(result, 'Vinculación familiar eliminada');
  } catch (error: any) {
    if (error.message === 'RELATIONSHIP_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Relación familiar no encontrada o no autorizada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient', 'admin'] });
