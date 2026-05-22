import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { AnalyticsService } from '@/lib/services/analytics.service';

/**
 * GET /api/v1/admin/analytics/network
 * Retrieves active relational nodes map
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const data = await AnalyticsService.getNetworkData();
    return successResponse(data);
  } catch (error: any) {
    console.error('Network analytics error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener analíticas de red', 500);
  }
}, { roles: ['admin'] });
