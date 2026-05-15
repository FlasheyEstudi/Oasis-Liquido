// OASIS - User Me Route
// PATCH /api/users/me (any authenticated user) - Update own profile

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updateMeSchema } from '@/lib/validators';
import * as userService from '@/lib/services/user.service';

/**
 * PATCH /api/users/me
 * Update own profile (any authenticated user)
 * Body: { name?, phone? }
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(updateMeSchema, body);
    if (!validation.success) return validation.error;

    const user = await userService.updateMe(
      req.user.userId,
      {
        name: body.name,
        phone: body.phone,
      },
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(user, 'Perfil actualizado exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
