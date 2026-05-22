// OASIS - Family Relation Item API Route
// DELETE /api/v1/family/[id] - Deactivate relationship

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as familyService from '@/lib/services/family.service';

/**
 * DELETE /api/v1/family/[id]
 * Deactivate family relationship
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    await familyService.deleteFamilyRelationship(
      req.user.userId,
      id,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );
    return successResponse(null, 'Relación familiar removida exitosamente');
  } catch (error: any) {
    if (error.message === 'RELATIONSHIP_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Relación no encontrada o no autorizada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient'] });
