// OASIS - Admin Global Settings Routes
// GET /api/v1/admin/settings - Retrieve all global settings (admin only)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as settingsService from '@/lib/services/settings.service';

/**
 * GET /api/v1/admin/settings
 * Retrieve all global settings
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const settings = await settingsService.getGlobalSettings();
    return successResponse(settings);
  } catch (error: any) {
    console.error('[GET SETTINGS ERROR]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al recuperar configuraciones globales', 500);
  }
}, { roles: ['admin'] });
