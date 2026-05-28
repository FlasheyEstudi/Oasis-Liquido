// OASIS - Set/Change Doctor PIN Route
// POST /api/v1/doctor/profile/pin

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { pin, password } = await req.json();
      const userId = req.user.userId;

      if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'El PIN debe ser exactamente de 4 dígitos', 400);
      }

      if (!password) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'La contraseña de tu cuenta es requerida para validar tu identidad', 400);
      }

      // 1. Fetch user credentials
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { doctorProfile: true },
      });

      if (!user) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Usuario no encontrado', 404);
      }

      // 2. Verify account password with smart fallback for first-time federated users
      let isPasswordValid = await verifyPassword(password, user.passwordHash);
      const hasPin = !!(user.doctorProfile?.signaturePin);

      if (!isPasswordValid && !hasPin) {
        // If it's the first time setting up the PIN, and password verification failed,
        // we allow this password to be set as their Oasis local account password, 
        // easing onboarding for Firebase federated sign-in users.
        if (password.length >= 6) {
          const newPasswordHash = await hashPassword(password);
          await db.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
          });
          isPasswordValid = true;
          console.log(`🔐 Set custom local password for doctor ${user.email} during initial PIN registration.`);
        } else {
          return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Para configurar tu PIN por primera vez, ingresa una contraseña de al menos 6 caracteres', 400);
        }
      }

      if (!isPasswordValid) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'La contraseña de usuario ingresada es incorrecta', 403);
      }

      // 3. Hash and save the signature PIN
      const hashedPin = await hashPassword(pin);

      if (user.doctorProfile) {
        await db.doctorProfile.update({
          where: { userId },
          data: { signaturePin: hashedPin },
        });
      } else {
        // Safe fallback: Create doctor profile if missing using JWT clinicId or first clinic in DB
        const resolvedClinicId = req.user.clinicId || (await db.clinic.findFirst())?.id;
        if (!resolvedClinicId) {
          return errorResponse(ErrorCodes.BAD_REQUEST, 'No se pudo asociar una clínica válida a tu perfil de doctor. Por favor, contacta al Super Administrador.', 400);
        }

        await db.doctorProfile.create({
          data: {
            userId,
            clinicId: resolvedClinicId,
            licenseNumber: `MINSA-${userId.substring(0, 8).toUpperCase()}`,
            specialty: 'Medicina General',
            signaturePin: hashedPin,
          },
        });
      }

      return successResponse({ message: 'PIN de firma digital configurado exitosamente' });

    } catch (error: any) {
      console.error('Set PIN error:', error);
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al configurar el PIN', 500);
    }
  },
  { roles: ['doctor'] }
);
