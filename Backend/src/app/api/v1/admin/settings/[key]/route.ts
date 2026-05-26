// OASIS - Admin Global Settings By Key Routes
// PUT /api/v1/admin/settings/:key - Update a specific global setting (admin only)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as settingsService from '@/lib/services/settings.service';

/**
 * PUT /api/v1/admin/settings/:key
 * Update a global setting
 */
export const PUT = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ key: string }> }) => {
  try {
    const { key } = await context.params;
    const body = await req.json();

    if (body.value === undefined || body.value === null) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'El valor es requerido', 400);
    }

    const updatedSetting = await settingsService.updateGlobalSetting(
      key,
      String(body.value),
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(updatedSetting);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Configuración no encontrada', 404);
    }
    console.error('[PUT SETTINGS ERROR]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar configuración global', 500);
  }
}, { roles: ['admin'] });
