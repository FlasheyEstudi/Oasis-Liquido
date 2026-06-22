// OASIS - Auth Register Route
// POST /api/v1/auth/register

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, registerSchema } from '@/lib/validators';
import { registerUser } from '@/lib/services/user-registration.service';
import { hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[REGISTER-API] Recibiendo solicitud de registro:', { email: body.email, role: body.role });

    const validation = validateBody(registerSchema, body);
    if (!validation.success) {
      console.log('[REGISTER-API] Validación de Zod fallida:', validation.error);
      return validation.error;
    }

    const passwordHash = await hashPassword(body.password);

    const result = await registerUser(
      {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        pharmacyId: body.pharmacyId,
        clinicId: body.clinicId,
        vehicleType: body.vehicleType,
        licensePlate: body.licensePlate,
        invitationToken: body.invitationToken,
        entityName: body.entityName,
        entityAddress: body.entityAddress,
        entityPhone: body.entityPhone,
        entityLatitude: body.entityLatitude,
        entityLongitude: body.entityLongitude,
      },
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    // Set refresh token in secure cookie
    const { refresh_token, ...data } = result;
    const response = successResponse(data, 'Registro exitoso');
    
    // Check if it's production or HTTPS environment for cookie security
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProduction, // True only in production to support local tunnels easily
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('[REGISTER-API] Registro procesado exitosamente.');
    return response;

  } catch (error: any) {
    console.error('[REGISTER-API] Error procesando registro:', error.message);

    if (error.message === 'EMAIL_EXISTS') {
      return errorResponse(ErrorCodes.EMAIL_EXISTS, 'El email ya está registrado', 409);
    }
    if (error.message === 'ADMIN_NOT_ALLOWED') {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'El rol de administrador no está permitido para registro público.', 403);
    }
    if (error.message === 'INVALID_INVITATION_TOKEN') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Token de invitación inválido o expirado.', 400);
    }
    if (error.message === 'PHARMACY_ID_REQUIRED' || error.message === 'PHARMACY_NOT_FOUND') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Se requiere una farmacia válida para registrarse con este rol.', 400);
    }
    if (error.message === 'CLINIC_ID_REQUIRED' || error.message === 'CLINIC_NOT_FOUND') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Se requiere una clínica válida para registrarse con este rol.', 400);
    }

    if (error.message === 'CANNOT_CLAIM_EXISTING_ENTITY_WITHOUT_INVITATION') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Para unirte a una clínica o farmacia existente debes recibir una invitación.', 403);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor en el registro.', 500);
  }
}
