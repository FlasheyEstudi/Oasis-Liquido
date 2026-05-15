// OASIS - Auth Register Route
// POST /api/auth/register

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, registerSchema } from '@/lib/validators';
import * as authService from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(registerSchema, body);
    if (!validation.success) return validation.error;

    const result = await authService.register(
      body.name,
      body.email,
      body.password,
      body.role,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    // Set refresh token in secure cookie
    const { refresh_token, ...data } = result;
    const response = successResponse(data, 'Registro exitoso');
    
    response.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return errorResponse(ErrorCodes.EMAIL_EXISTS, 'El email ya está registrado', 409);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}
