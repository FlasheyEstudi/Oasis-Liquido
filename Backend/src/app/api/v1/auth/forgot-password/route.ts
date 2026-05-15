// OASIS - Auth Forgot Password Route
// POST /api/auth/forgot-password

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, forgotPasswordSchema } from '@/lib/validators';
import * as authService from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(forgotPasswordSchema, body);
    if (!validation.success) return validation.error;

    const result = await authService.forgotPassword(body.email);

    return successResponse(result, 'Se envió un correo de recuperación');
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}
