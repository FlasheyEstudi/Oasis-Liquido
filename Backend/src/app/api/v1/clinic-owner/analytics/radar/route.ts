import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { db } from '@/lib/db';

/**
 * GET /api/v1/clinic-owner/analytics/radar
 * Retrieves clinic doctor dimensions
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Find clinic owned by this clinic owner
    const clinic = await db.clinic.findFirst({
      where: { ownerId: req.user.userId }
    });

    const data = await AnalyticsService.getRadarData(clinic?.id || '');
    return successResponse(data);
  } catch (error: any) {
    console.error('Radar analytics error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener analíticas de desempeño médico', 500);
  }
}, { roles: ['clinic_owner', 'admin'] });
