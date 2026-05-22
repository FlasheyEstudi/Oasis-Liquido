// OASIS - Set Doctor PIN Route
// POST /api/doctor/profile/pin

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const { pin, userId } = await req.json();

    if (!pin || pin.length < 4) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'PIN debe tener al menos 4 dígitos', 400);
    }

    const hashedPin = await hashPassword(pin);

    await db.doctorProfile.update({
      where: { userId },
      data: { signaturePin: hashedPin },
    });

    return successResponse({ message: 'PIN de firma configurado correctamente' });

  } catch (error: any) {
    console.error('Set PIN error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al configurar el PIN', 500);
  }
}
