// OASIS - User by ID Route
// PATCH /api/users/:id (admin or self) - Update a user

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updateUserSchema } from '@/lib/validators';
import * as userService from '@/lib/services/user.service';

/**
 * PATCH /api/users/:id
 * Update a user (admin can update any user; other users can only update themselves)
 * Body: { name?, email?, phone?, role?, isActive? }
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    // Authorization check: admin can update any user, others can only update themselves
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Solo puedes actualizar tu propio perfil', 403);
    }

    const body = await req.json();
    const validation = validateBody(updateUserSchema, body);
    if (!validation.success) return validation.error;

    const user = await userService.updateUser(
      id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        isActive: body.isActive,
      },
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(user, 'Usuario actualizado exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
    }
    if (error.message === 'EMAIL_EXISTS') {
      return errorResponse(ErrorCodes.EMAIL_EXISTS, 'El email ya está registrado', 409);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
