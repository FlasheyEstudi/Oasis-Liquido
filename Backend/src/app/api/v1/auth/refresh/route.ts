// OASIS - Auth Refresh Token Route
// POST /api/auth/refresh

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, refreshTokenSchema } from '@/lib/validators';
import * as authService from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    // Try to get refresh_token from cookies first, then body
    let refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body.refresh_token;
      } catch {
        // Body might be empty, which is fine if cookie exists
      }
    }

    if (!refreshToken) {
      return errorResponse(ErrorCodes.TOKEN_INVALID, 'Token de refresco faltante', 401);
    }

    const result = await authService.refreshTokens(refreshToken);

    // Set new refresh token in secure cookie
    const { refresh_token, ...data } = result;
    const response = successResponse(data);
    
    response.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    if (error.message === 'TOKEN_INVALID') {
      return errorResponse(ErrorCodes.TOKEN_INVALID, 'Token inválido', 401);
    }
    if (error.message === 'USER_INACTIVE') {
      return errorResponse(ErrorCodes.USER_INACTIVE, 'Cuenta desactivada', 403);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}
