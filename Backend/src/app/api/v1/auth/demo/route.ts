// OASIS - Auth Demo Route
// POST /api/auth/demo
// Login with a specific role for testing/demo purposes

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { signAccessToken, signRefreshToken, AccessTokenPayload } from '@/lib/auth/jwt';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Role is required', 400);
    }

    // Find the first active user with this role
    const user = await db.user.findFirst({
      where: { role, isActive: true },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        pharmacyManagerProfile: true,
        patientProfile: true,
        deliveryDriverProfile: true,
      }
    });

    if (!user) {
      return errorResponse(ErrorCodes.NOT_FOUND, `No active demo user found for role: ${role}`, 404);
    }

    // Generate tokens
    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.doctorProfile?.clinicId || user.receptionistProfile?.clinicId || undefined,
      pharmacyId: user.pharmacyManagerProfile?.pharmacyId || undefined,
    };

    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Set refresh token in secure cookie
    const { passwordHash: _, ...userWithoutPassword } = user;
    const response = successResponse({
      user: userWithoutPassword,
      access_token
    });
    
    response.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false, // Set to false for local network testing
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error: any) {
    console.error('Demo login error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno en demo login', 500);
  }
}
