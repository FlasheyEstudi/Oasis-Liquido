import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { AnalyticsService } from '@/lib/services/analytics.service';

/**
 * GET /api/v1/admin/analytics/sankey
 * Retrieves real transaction flow conversion data
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const data = await AnalyticsService.getSankeyData();
    return successResponse(data);
  } catch (error: any) {
    console.error('Sankey analytics error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener analíticas Sankey', 500);
  }
}, { roles: ['admin'] });
