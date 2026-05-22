// OASIS - FCM Token Registration Route
// POST /api/v1/users/me/fcm-token - Register own FCM token
// DELETE /api/v1/users/me/fcm-token - Remove own FCM token

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as userService from '@/lib/services/user.service';
import { z } from 'zod';

const fcmTokenSchema = z.object({
  token: z.string().min(1, 'Token de FCM es requerido'),
});

/**
 * POST /api/v1/users/me/fcm-token
 * Register own FCM token
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const result = fcmTokenSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        result.error.issues[0].message,
        400
      );
    }

    const user = await userService.updateFcmToken(
      req.user.userId,
      result.data.token,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(user, 'Token de FCM registrado exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});

/**
 * DELETE /api/v1/users/me/fcm-token
 * Remove own FCM token
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = await userService.updateFcmToken(
      req.user.userId,
      null,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(user, 'Token de FCM removido exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
