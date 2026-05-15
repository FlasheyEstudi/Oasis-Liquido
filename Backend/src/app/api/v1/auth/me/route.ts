// OASIS - Auth Me Route
// GET /api/auth/me

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as userService from '@/lib/services/user.service';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const user = await userService.getMe((req as AuthenticatedRequest).user.userId);
    if (!user) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
    }
    return successResponse(user);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
