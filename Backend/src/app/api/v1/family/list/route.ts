// OASIS - Family List API Route
// GET /api/v1/family/list
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as familyService from '@/lib/services/family.service';

/**
 * GET /api/v1/family/list
 * List all family relationships (supervisor/caregiver and dependent/patient)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const relationships = await familyService.getFamilyRelationships(req.user.userId);
    return successResponse(relationships, 'Relaciones familiares cargadas');
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient', 'admin'] });
