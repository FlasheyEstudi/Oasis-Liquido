// OASIS - Auth Service
// Login, register, refresh tokens, forgot/reset password

import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateResetToken, verifyResetToken, AccessTokenPayload } from '@/lib/auth/jwt';
import { createAuditLog } from './audit.service';
import crypto from 'crypto';

/**
 * Login with email/password, returns JWT pair + user
 */
export async function login(email: string, password: string, ipAddress?: string, userAgent?: string) {
  // Find user by email with profiles
  const user = await db.user.findUnique({ 
    where: { email },
    include: {
      doctorProfile: true,
      receptionistProfile: true,
      pharmacyManagerProfile: true,
    }
  });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('USER_INACTIVE');
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
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'login',
    entityType: 'user',
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    access_token,
    refresh_token,
  };
}

/**
 * Register a new patient
 */
export async function register(name: string, email: string, password: string, role: string = 'patient', ipAddress?: string, userAgent?: string) {
  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user + patient profile in transaction
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      emailVerified: false,
      patientProfile: role === 'patient' ? { create: {} } : undefined,
    },
    include: {
      patientProfile: true,
    },
  });

  // Generate tokens
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
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

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'create',
    entityType: 'user',
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    access_token,
    refresh_token,
  };
}

/**
 * Refresh token pair - revokes old refresh token and issues new pair
 */
export async function refreshTokens(refreshToken: string) {
  // Verify the refresh token JWT
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error('TOKEN_INVALID');
  }

  // Find the token in database
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = await db.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw new Error('TOKEN_INVALID');
  }

  // Revoke the old refresh token
  await db.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Verify user still exists and is active
  const user = await db.user.findUnique({ 
    where: { id: payload.userId },
    include: {
      doctorProfile: true,
      receptionistProfile: true,
      pharmacyManagerProfile: true,
    }
  });
  if (!user || !user.isActive) {
    throw new Error('USER_INACTIVE');
  }

  // Generate new token pair
  const newPayload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clinicId: user.doctorProfile?.clinicId || user.receptionistProfile?.clinicId || undefined,
    pharmacyId: user.pharmacyManagerProfile?.pharmacyId || undefined,
  };

  const access_token = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  // Store new refresh token with retry on hash collision
  const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });
  } catch (err: any) {
    // If unique constraint fails (hash collision), try deleting old expired tokens first
    if (err.code === 'P2002') {
      // Clean up expired/revoked tokens for this user
      await db.refreshToken.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { expiresAt: { lt: new Date() } },
            { revokedAt: { not: null } },
          ],
        },
      });
      // Retry
      await db.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt,
        },
      });
    } else {
      throw err;
    }
  }

  return {
    access_token,
    refresh_token: newRefreshToken,
  };
}

/**
 * Forgot password - generates a reset token (in production, this would be emailed)
 */
export async function forgotPassword(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists for security
    return { message: 'Se envió un correo de recuperación' };
  }

  // Generate reset token
  const resetToken = generateResetToken();

  // Store token in user's notes or a separate table
  // For simplicity, we store it as a detail that can be verified later
  // In production, this would be emailed via an email service
  await createAuditLog({
    userId: user.id,
    action: 'update',
    entityType: 'user',
    entityId: user.id,
    details: JSON.stringify({ action: 'forgot_password', token: resetToken }),
  });

  return { message: 'Se envió un correo de recuperación', reset_token: resetToken };
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  const { valid } = verifyResetToken(token);
  if (!valid) {
    throw new Error('TOKEN_INVALID');
  }

  // Find the audit log with this token to identify the user
  const auditLog = await db.auditLog.findFirst({
    where: {
      action: 'update',
      entityType: 'user',
      details: { contains: 'forgot_password' },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!auditLog || !auditLog.userId) {
    throw new Error('TOKEN_INVALID');
  }

  // Update password
  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: auditLog.userId },
    data: { passwordHash },
  });

  return { message: 'Contraseña actualizada' };
}
