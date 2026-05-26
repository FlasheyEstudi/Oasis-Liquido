// OASIS - Firebase Authentication Login API Route
// POST /api/v1/auth/firebase-login
import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody } from '@/lib/validators';
import { z } from 'zod/v4';
import { firebaseAdmin } from '@/lib/firebase/admin';
import * as authService from '@/lib/services/auth.service';

const firebaseLoginSchema = z.object({
  idToken: z.string().min(10, 'El Token ID de Firebase es obligatorio'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(firebaseLoginSchema, body);
    if (!validation.success) return validation.error;

    let email: string;
    let name: string;

    // Verify token using Firebase Admin SDK if initialized, otherwise run a fallback for development testing
    if (firebaseAdmin && firebaseAdmin.apps.length > 0) {
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(body.idToken);
        email = decodedToken.email || '';
        name = decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario Oasis';

        if (!email) {
          return errorResponse(ErrorCodes.BAD_REQUEST, 'El token verificado no contiene un correo electrónico', 400);
        }
      } catch (fbError: any) {
        console.error('❌ Firebase token verification failed:', fbError);
        return errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Token de Firebase inválido o expirado', 401);
      }
    } else {
      // Graceful fallback for offline development / placeholder configurations
      console.warn('⚠️ Firebase Admin SDK not initialized. Processing in development bypass mode.');
      // Assuming body.idToken is structured or contains plain mock information for development
      if (body.idToken.startsWith('mock-token-')) {
        email = body.idToken.replace('mock-token-', '') + '@oasis.com';
        name = 'Usuario Demo Google';
      } else {
        return errorResponse(ErrorCodes.INTERNAL_ERROR, 'El servicio de Firebase Auth no está configurado en el servidor', 500);
      }
    }

    // Call service to login or auto-register the verified user
    const result = await authService.loginWithFirebase(
      email,
      name,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    // Set refresh token in secure cookie
    const { refresh_token, ...data } = result;
    const response = successResponse(data, 'Autenticación con Firebase completada');
    
    response.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false, // Local networking friendly
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    if (error.message === 'USER_INACTIVE') {
      return errorResponse(ErrorCodes.USER_INACTIVE, 'Esta cuenta ha sido desactivada por el administrador', 403);
    }
    console.error('❌ Firebase auth login route error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error interno de autenticación', 500);
  }
}
