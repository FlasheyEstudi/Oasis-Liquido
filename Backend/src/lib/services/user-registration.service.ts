// OASIS - Centralized User Registration Service
// Handles business logic, role-specific profile creation, validations, and transaction stability.

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken, AccessTokenPayload } from '@/lib/auth/jwt';
import { createAuditLog } from './audit.service';
import crypto from 'crypto';

interface RegistrationData {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  pharmacyId?: string;
  clinicId?: string;
  vehicleType?: string;
  licensePlate?: string;
  invitationToken?: string;
  entityName?: string;
  entityAddress?: string;
  entityPhone?: string;
  entityLatitude?: number;
  entityLongitude?: number;
}

export async function registerUser(
  data: {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    pharmacyId?: string;
    clinicId?: string;
    vehicleType?: string;
    licensePlate?: string;
    invitationToken?: string;
    entityName?: string;
    entityAddress?: string;
    entityPhone?: string;
    entityLatitude?: number;
    entityLongitude?: number;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const { 
    name, 
    email, 
    passwordHash, 
    role, 
    pharmacyId, 
    clinicId, 
    vehicleType, 
    licensePlate, 
    invitationToken,
    entityName,
    entityAddress,
    entityPhone,
    entityLatitude,
    entityLongitude 
  } = data;

  const normalizedEmail = email.trim().toLowerCase();

  console.log('[REGISTER] Intentando registrar usuario:', { email: normalizedEmail, role, pharmacyId, clinicId, entityName });

  // 1. Validations outside of transaction for speed/clarity
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    console.log('[REGISTER] Error: El email ya existe:', normalizedEmail);
    throw new Error('EMAIL_EXISTS');
  }

  // Admin validation
  if (role === 'admin') {
    if (!invitationToken) {
      console.log('[REGISTER] Error: Intento de registro de admin sin token de invitación público');
      throw new Error('ADMIN_NOT_ALLOWED');
    }
    // Verify token exists and is valid
    const invitation = await db.invitation.findUnique({
      where: { token: invitationToken }
    });
    if (!invitation || invitation.role !== 'admin' || invitation.isAccepted || invitation.expiresAt < new Date()) {
      console.log('[REGISTER] Error: Token de invitación de admin inválido o expirado:', invitationToken);
      throw new Error('INVALID_INVITATION_TOKEN');
    }
  }

  // Security: Prevent hijacking existing clinics or pharmacies
  if (role !== 'patient' && role !== 'admin') {
    if ((pharmacyId || clinicId) && !invitationToken) {
      console.log('[REGISTER] Error: Intento de secuestro de entidad existente sin invitación.');
      throw new Error('CANNOT_CLAIM_EXISTING_ENTITY_WITHOUT_INVITATION');
    }
  }

  // Pharmacy admin/manager validation
  if (role === 'pharmacy_admin' || role === 'pharmacy_manager') {
    if (!pharmacyId) {
      if (role === 'pharmacy_admin' && entityName && entityAddress) {
        console.log('[REGISTER] Flujo de registro de nueva farmacia para administrador:', entityName);
      } else {
        console.log('[REGISTER] Error: pharmacyId o detalles de farmacia requeridos para roles de farmacia');
        throw new Error('PHARMACY_ID_REQUIRED');
      }
    } else {
      const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
      if (!pharmacy) {
        console.log('[REGISTER] Error: Farmacia no encontrada:', pharmacyId);
        throw new Error('PHARMACY_NOT_FOUND');
      }
    }
  }

  // Clinic admin validation
  if (role === 'clinic_admin') {
    if (!clinicId) {
      if (entityName && entityAddress) {
        console.log('[REGISTER] Flujo de registro de nueva clínica para administrador:', entityName);
      } else {
        console.log('[REGISTER] Error: clinicId o detalles de clínica requeridos para administradores de clínicas');
        throw new Error('CLINIC_ID_REQUIRED');
      }
    } else {
      const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) {
        console.log('[REGISTER] Error: Clínica no encontrada:', clinicId);
        throw new Error('CLINIC_NOT_FOUND');
      }
    }
  }

  // 2. Transaccional registration and profile linkage
  try {
    const result = await db.$transaction(async (tx) => {
      // Calculate 14 days compliance deadline for administrators
      const isOwner = role === 'pharmacy_admin' || role === 'clinic_admin';
      const deadline = isOwner ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null;

      // Create primary user
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role,
          emailVerified: false,
          verificationStatus: isOwner ? 'pending' : 'approved',
          verificationDeadline: deadline,
        }
      });

      // Create role-specific profiles
      if (role === 'patient') {
        await tx.patientProfile.create({
          data: {
            userId: user.id,
          }
        });
      } else if (role === 'delivery_driver') {
        await tx.deliveryDriverProfile.create({
          data: {
            userId: user.id,
            pharmacyId: pharmacyId || null,
            vehicleType: vehicleType || 'motocicleta',
            licensePlate: licensePlate || null,
            isAvailable: true,
            employmentType: 'contractor',
          }
        });
      } else if (role === 'pharmacy_admin' || role === 'pharmacy_manager') {
        let finalPharmacyId = pharmacyId;

        if (!finalPharmacyId && role === 'pharmacy_admin' && entityName) {
          const newPharmacy = await tx.pharmacy.create({
            data: {
              name: entityName,
              address: entityAddress || '',
              phone: entityPhone || null,
              latitude: entityLatitude || 12.1328,
              longitude: entityLongitude || -86.2504,
              ownerId: user.id
            }
          });
          finalPharmacyId = newPharmacy.id;
        }

        // Create profile linkage
        await tx.pharmacyManagerProfile.create({
          data: {
            userId: user.id,
            pharmacyId: finalPharmacyId!,
          }
        });

        // Set owner of the pharmacy if role is admin and linking to existing pharmacy
        if (role === 'pharmacy_admin' && pharmacyId) {
          await tx.pharmacy.update({
            where: { id: pharmacyId },
            data: { ownerId: user.id }
          });
        }
      } else if (role === 'clinic_admin') {
        let finalClinicId = clinicId;

        if (!finalClinicId && entityName) {
          const newClinic = await tx.clinic.create({
            data: {
              name: entityName,
              address: entityAddress || '',
              phone: entityPhone || null,
              latitude: entityLatitude || 12.1328,
              longitude: entityLongitude || -86.2504,
              ownerId: user.id
            }
          });
          finalClinicId = newClinic.id;
        }

        // Set owner of the clinic if linking to existing clinic
        if (clinicId) {
          await tx.clinic.update({
            where: { id: clinicId },
            data: { ownerId: user.id }
          });
        }
      } else if (role === 'admin' && invitationToken) {
        // Mark invitation as accepted
        await tx.invitation.update({
          where: { token: invitationToken },
          data: { isAccepted: true }
        });
      }

      // Fetch user with newly created profile included
      const createdUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          patientProfile: true,
          deliveryDriverProfile: true,
          pharmacyManagerProfile: true,
        }
      });

      return createdUser!;
    });

    console.log('[REGISTER] Registro transaccional exitoso para:', result.email);

    // 3. Token generation
    const payload: AccessTokenPayload = {
      userId: result.id,
      email: result.email,
      role: result.role,
      clinicId: clinicId || undefined,
      pharmacyId: pharmacyId || undefined,
    };

    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.refreshToken.create({
      data: {
        userId: result.id,
        tokenHash,
        expiresAt,
      },
    });

    // Create Audit Log
    try {
      await createAuditLog({
        userId: result.id,
        action: 'create',
        entityType: 'user',
        entityId: result.id,
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      console.warn('[REGISTER] Error creando audit log:', auditError);
    }

    const { passwordHash: _, ...userWithoutPassword } = result;

    return {
      user: userWithoutPassword,
      access_token,
      refresh_token,
    };

  } catch (error) {
    console.error('[REGISTER] Fallo en la transacción de registro:', error);
    throw error;
  }
}
