// OASIS - Admin Stats Route
// GET /api/admin/stats

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as adminService from '@/lib/services/admin.service';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const stats = await adminService.getAdminStats();
    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin'] });
