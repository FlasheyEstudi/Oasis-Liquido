// OASIS - Change Password Route
// POST /api/users/me/change-password (any authenticated user) - Change own password

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, changePasswordSchema } from '@/lib/validators';
import * as userService from '@/lib/services/user.service';

/**
 * POST /api/users/me/change-password
 * Change own password (any authenticated user)
 * Body: { current_password, new_password }
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(changePasswordSchema, body);
    if (!validation.success) return validation.error;

    await userService.changePassword(
      req.user.userId,
      body.current_password,
      body.new_password,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse({ message: 'Contraseña actualizada' }, 'Contraseña actualizada exitosamente');
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Contraseña actual incorrecta', 401);
    }
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
