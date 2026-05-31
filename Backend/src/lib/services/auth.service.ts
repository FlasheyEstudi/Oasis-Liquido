// OASIS - Auth Service
// Login, register, refresh tokens, forgot/reset password

import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateResetToken, verifyResetToken, AccessTokenPayload } from '@/lib/auth/jwt';
import { createAuditLog } from './audit.service';
import { sendWhatsAppOTP } from './whatsapp.service';
import { registerUser } from './user-registration.service';
import { sendOasisEmail } from '@/lib/utils/mailer';
import crypto from 'crypto';

/**
 * Login with email/password, returns JWT pair + user
 */
export async function login(email: string, password: string, ipAddress?: string, userAgent?: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    // Find user by email with profiles
    const user = await db.user.findUnique({ 
      where: { email: normalizedEmail },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        pharmacyManagerProfile: true,
        deliveryDriverProfile: true,
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
      pharmacyId: user.pharmacyManagerProfile?.pharmacyId || user.deliveryDriverProfile?.pharmacyId || undefined,
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
    try {
      await createAuditLog({
        userId: user.id,
        action: 'login',
        entityType: 'user',
        entityId: user.id,
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      console.error('Audit log failed during login:', auditError);
      // Continue anyway as login was successful
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      access_token,
      refresh_token,
    };
  } catch (error: any) {
    console.error('CRITICAL LOGIN ERROR:', error);
    throw error;
  }
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

  // Find first pharmacy if registering a driver
  let pharmacyId: string | undefined;
  if (role === 'delivery_driver') {
    const p = await db.pharmacy.findFirst();
    pharmacyId = p?.id;
  }

  // Create user + patient profile in transaction
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      emailVerified: false,
      patientProfile: role === 'patient' ? { create: {} } : undefined,
      deliveryDriverProfile: role === 'delivery_driver' && pharmacyId ? { create: { pharmacyId } } : undefined,
    },
    include: {
      patientProfile: true,
      deliveryDriverProfile: true,
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
      deliveryDriverProfile: true,
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
    pharmacyId: user.pharmacyManagerProfile?.pharmacyId || user.deliveryDriverProfile?.pharmacyId || undefined,
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
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    console.warn(`⚠️ [FORGOT PASSWORD] El correo ${normalizedEmail} no está registrado en la base de datos de Oasis. Se omite el envío por seguridad.`);
    // Don't reveal if email exists for security
    return { message: 'Se envió un correo de recuperación' };
  }

  // Generate reset token (JWT)
  const resetToken = generateResetToken();

  // Securely hash the token for DB storage
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiration date (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Store token safely with user email and state
  await (db as any).passwordResetToken.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      isUsed: false,
    },
  });

  // Record audit log without the sensitive token
  await createAuditLog({
    userId: user.id,
    action: 'update',
    entityType: 'user',
    entityId: user.id,
    details: JSON.stringify({ action: 'forgot_password_requested' }),
  });

  // OAS-001: Log recovery token securely to server console ONLY in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔑 [OASIS PASSWORD RECOVERY] User: ${normalizedEmail} | Recovery Token: ${resetToken}`);
  }

  // Enviar correo transaccional real de forma segura y esperar su confirmación
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oasis-liquido.vercel.app';
  const resetUrl = `${frontendUrl}/cambiar-clave`;

  try {
    const emailSent = await sendOasisEmail({
      to: normalizedEmail,
      subject: 'Recuperación de contraseña - Oasis Líquida',
      title: 'Restablece tu contraseña',
      description: `Hola ${user.name || 'Usuario'}. Recibimos una solicitud para cambiar tu contraseña en Oasis Líquida. Utiliza el siguiente código de verificación de un solo uso en la pantalla de recuperación.`,
      buttonText: 'Ir a restablecer contraseña',
      buttonUrl: resetUrl,
      code: resetToken
    });
    
    if (emailSent) {
      console.log(`✉️ Correo de recuperación despachado exitosamente a ${normalizedEmail}`);
    } else {
      console.warn(`⚠️ El correo no se pudo enviar a ${normalizedEmail} (posiblemente SMTP_PASS faltante o error interno)`);
    }
  } catch (err) {
    console.error('❌ Error crítico enviando correo de recuperación:', err);
  }

  return { 
    message: 'Solicitud registrada. Si el correo existe, recibirás un correo con las instrucciones.', 
    // Only return the reset token in local development for testing purposes
    ...(process.env.NODE_ENV !== 'production' ? { reset_token: resetToken } : {})
  };
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  // 1. Verify token signature and purpose
  const { valid } = verifyResetToken(token);
  if (!valid) {
    throw new Error('TOKEN_INVALID');
  }

  // 2. Hash token to query database
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // 3. Find valid, unused and non-expired token in DB
  const resetRecord = await (db as any).passwordResetToken.findFirst({
    where: {
      tokenHash,
      isUsed: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (!resetRecord) {
    throw new Error('TOKEN_INVALID');
  }

  // 4. Find the target user by the email registered in the token record
  const user = await db.user.findUnique({
    where: { email: resetRecord.email },
  });

  if (!user) {
    throw new Error('TOKEN_INVALID');
  }

  // 5. Update user password and invalidate token in a transaction
  const passwordHash = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    (db as any).passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { isUsed: true },
    }),
  ]);

  // Record audit log for security
  await createAuditLog({
    userId: user.id,
    action: 'update',
    entityType: 'user',
    entityId: user.id,
    details: JSON.stringify({ action: 'forgot_password_completed' }),
  });

  return { message: 'Contraseña actualizada' };
}

/**
 * Login or register automatically with Firebase Auth verified details
 */
export async function loginWithFirebase(
  email: string,
  name: string,
  role: string = 'patient',
  ipAddress?: string,
  userAgent?: string,
  additionalData?: {
    pharmacyId?: string;
    clinicId?: string;
    vehicleType?: string;
    licensePlate?: string;
    entityName?: string;
    entityAddress?: string;
    entityPhone?: string;
    entityLatitude?: number;
    entityLongitude?: number;
  }
) {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user by email
  let user = await db.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      doctorProfile: true,
      receptionistProfile: true,
      pharmacyManagerProfile: true,
      deliveryDriverProfile: true,
    },
  });

  // If user does not exist, auto-register with selected role and link profiles via the centralized service
  if (!user) {
    // Create a random password hash since password is managed by Firebase
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const randomHash = await hashPassword(randomPassword);

    await registerUser(
      {
        name: name || 'Usuario Oasis',
        email: normalizedEmail,
        passwordHash: randomHash,
        role: role,
        pharmacyId: additionalData?.pharmacyId,
        clinicId: additionalData?.clinicId,
        vehicleType: additionalData?.vehicleType,
        licensePlate: additionalData?.licensePlate,
        entityName: additionalData?.entityName,
        entityAddress: additionalData?.entityAddress,
        entityPhone: additionalData?.entityPhone,
        entityLatitude: additionalData?.entityLatitude,
        entityLongitude: additionalData?.entityLongitude,
      },
      ipAddress,
      userAgent
    );

    // Fetch user with newly created profile included
    user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        pharmacyManagerProfile: true,
        deliveryDriverProfile: true,
      },
    });

    if (!user) {
      throw new Error('REGISTRATION_FAILED');
    }

    console.log(`👤 Auto-registered new Firebase user with role [${role}]: ${normalizedEmail}`);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('USER_INACTIVE');
  }

  // Generate local JWT tokens for our app
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clinicId: user.doctorProfile?.clinicId || user.receptionistProfile?.clinicId || undefined,
    pharmacyId: user.pharmacyManagerProfile?.pharmacyId || user.deliveryDriverProfile?.pharmacyId || undefined,
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
  try {
    await createAuditLog({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      details: JSON.stringify({ provider: 'firebase' }),
      ipAddress,
      userAgent,
    });
  } catch (auditError) {
    console.error('Audit log failed during Firebase login:', auditError);
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    access_token,
    refresh_token,
  };
}

