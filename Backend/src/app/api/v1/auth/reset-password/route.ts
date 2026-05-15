// OASIS - Auth Reset Password Route
// POST /api/auth/reset-password

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, resetPasswordSchema } from '@/lib/validators';
import * as authService from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(resetPasswordSchema, body);
    if (!validation.success) return validation.error;

    const result = await authService.resetPassword(body.token, body.new_password);

    return successResponse(result, 'Contraseña actualizada');
  } catch (error: any) {
    if (error.message === 'TOKEN_INVALID') {
      return errorResponse(ErrorCodes.TOKEN_INVALID, 'Token inválido', 401);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}
