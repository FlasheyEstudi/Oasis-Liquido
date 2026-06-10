// OASIS - User Service
// CRUD operations for users and profiles

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createAuditLog } from './audit.service';

/**
 * Get users with filters (admin only)
 */
export async function getUsers(filters: {
  role?: string;
  search?: string;
  clinicId?: string;
  pharmacyId?: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Record<string, any> = {};

  if (filters.role) where.role = filters.role;

  const conditions: any[] = [];

  if (filters.search) {
    conditions.push({
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  if (filters.clinicId) {
    conditions.push({
      OR: [
        { doctorProfile: { clinicId: filters.clinicId } },
        { receptionistProfile: { clinicId: filters.clinicId } },
      ],
    });
  }

  if (filters.pharmacyId) {
    conditions.push({
      OR: [
        { pharmacyManagerProfile: { pharmacyId: filters.pharmacyId } },
        { deliveryDriverProfile: { pharmacyId: filters.pharmacyId } },
      ],
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        patientProfile: true,
        doctorProfile: { include: { clinic: true } },
        pharmacyManagerProfile: { include: { pharmacy: true } },
        deliveryDriverProfile: true,
        receptionistProfile: { include: { clinic: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: filters.skip,
      take: filters.limit,
    }),
    db.user.count({ where }),
  ]);

  const transformedData = data.map(u => ({
    ...u,
    patient_profile: u.patientProfile,
    doctor_profile: u.doctorProfile,
    pharmacy_manager_profile: u.pharmacyManagerProfile,
    delivery_driver_profile: u.deliveryDriverProfile,
    receptionist_profile: u.receptionistProfile,
  }));

  return { data: transformedData, total };
}

/**
 * Create a new user (admin only)
 */
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  clinicId?: string;
  pharmacyId?: string;
}, adminUserId?: string, ipAddress?: string, userAgent?: string) {
  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(data.password);

  // Create user and profile in a transaction with robust fallback resolutions
  const user = await db.$transaction(async (tx) => {
    let resolvedClinicId = data.clinicId;
    let resolvedPharmacyId = data.pharmacyId;

    if (data.role === 'doctor' || data.role === 'receptionist') {
      if (!resolvedClinicId) {
        let clinic = await tx.clinic.findFirst();
        if (!clinic) {
          clinic = await tx.clinic.create({
            data: {
              name: 'Clínica Oasis Principal',
              address: 'Managua, Nicaragua',
              latitude: 12.1364,
              longitude: -86.2514,
            }
          });
        }
        resolvedClinicId = clinic.id;
      }
    }

    if (data.role === 'delivery_driver' || data.role === 'pharmacy_manager' || data.role === 'pharmacy_admin' || data.role === 'cashier') {
      if (!resolvedPharmacyId) {
        let pharmacy = await tx.pharmacy.findFirst();
        if (!pharmacy) {
          pharmacy = await tx.pharmacy.create({
            data: {
              name: 'Farmacia Oasis Principal',
              address: 'Managua, Nicaragua',
              latitude: 12.1364,
              longitude: -86.2514,
              deliveryFee: 29.90,
            }
          });
        }
        resolvedPharmacyId = pharmacy.id;
      }
    }

    return await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        phone: data.phone,
        patientProfile: data.role === 'patient' ? { create: {} } : undefined,
        doctorProfile: (data.role === 'doctor') ? { 
          create: { 
            licenseNumber: `LIC-${Date.now()}`,
            clinicId: resolvedClinicId!
          } 
        } : undefined,
        pharmacyManagerProfile: (data.role === 'pharmacy_manager' || data.role === 'pharmacy_admin' || data.role === 'cashier') ? { 
          create: { 
            pharmacyId: resolvedPharmacyId 
          } 
        } : undefined,
        deliveryDriverProfile: data.role === 'delivery_driver' ? { 
          create: { 
            pharmacyId: resolvedPharmacyId!,
            vehicleType: 'motocicleta',
            isAvailable: true,
          } 
        } : undefined,
        receptionistProfile: data.role === 'receptionist' ? { 
          create: { 
            clinicId: resolvedClinicId 
          } 
        } : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  // Audit log
  await createAuditLog({
    userId: adminUserId,
    action: 'create',
    entityType: 'user',
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return user;
}

/**
 * Update user (admin or self)
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    password?: string;
  },
  adminUserId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if user exists
  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  // If email is changing, check uniqueness
  if (data.email && data.email !== existing.email) {
    const emailExists = await db.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      throw new Error('EMAIL_EXISTS');
    }

    // Update email in Firebase Auth if the user has an active Firebase record
    try {
      const { firebaseAdmin } = await import('@/lib/firebase/admin');
      if (firebaseAdmin) {
        try {
          await firebaseAdmin.auth().getUser(userId);
          await firebaseAdmin.auth().updateUser(userId, { email: data.email });
          console.log(`🔥 Synchronized email update in Firebase Auth for user: ${userId}`);
        } catch (firebaseErr: any) {
          if (firebaseErr.code === 'auth/user-not-found') {
            console.log(`ℹ️ User ${userId} not registered in Firebase Auth. Skipping Firebase email sync.`);
          } else {
            throw firebaseErr;
          }
        }
      }
    } catch (err: any) {
      console.error(`⚠️ Failed to sync email update with Firebase: ${err.message}`);
    }
  }

  // Run update and profile checks in a safe transaction
  const user = await db.$transaction(async (tx) => {
    // Hash password if updating password
    let passwordHash: string | undefined = undefined;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
    }

    // 1. Perform User table update
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive,
        passwordHash: passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate active sessions if role, email or active status changes
    if (
      (data.email && data.email !== existing.email) ||
      (data.role && data.role !== existing.role) ||
      (data.isActive !== undefined && data.isActive !== existing.isActive)
    ) {
      await tx.refreshToken.deleteMany({ where: { userId } });
      console.log(`🔒 Revoked all active refresh tokens for user: ${userId} due to identity updates.`);
    }

    // 2. Manage role-specific profiles on role change
    const targetRole = data.role || existing.role;

    // a) Deprovision profiles that do not match the target role
    if (targetRole !== 'patient') {
      await tx.patientProfile.deleteMany({ where: { userId } });
    }
    if (targetRole !== 'doctor') {
      try {
        await tx.doctorProfileSpecialty.deleteMany({ where: { doctorId: userId } });
      } catch (e) {
        // Ignore if table does not exist or relation name differs
      }
      await tx.doctorProfile.deleteMany({ where: { userId } });
    }
    if (targetRole !== 'delivery_driver') {
      await tx.deliveryDriverProfile.deleteMany({ where: { userId } });
    }
    if (targetRole !== 'receptionist') {
      await tx.receptionistProfile.deleteMany({ where: { userId } });
    }
    if (targetRole !== 'cashier' && targetRole !== 'pharmacy_manager' && targetRole !== 'pharmacy_admin') {
      await tx.pharmacyManagerProfile.deleteMany({ where: { userId } });
    }

    // b) Provision matching profile if missing
    if (targetRole === 'patient') {
      const patientProfile = await tx.patientProfile.findUnique({ where: { userId } });
      if (!patientProfile) {
        await tx.patientProfile.create({
          data: { userId },
        });
      }
    } else if (targetRole === 'doctor') {
      const docProfile = await tx.doctorProfile.findUnique({ where: { userId } });
      if (!docProfile) {
        let clinic = await tx.clinic.findFirst();
        if (!clinic) {
          clinic = await tx.clinic.create({
            data: {
              name: 'Clínica Oasis Principal',
              address: 'Managua, Nicaragua',
              latitude: 12.1364,
              longitude: -86.2514,
            }
          });
        }
        await tx.doctorProfile.create({
          data: {
            userId,
            clinicId: clinic.id,
            specialty: 'Medicina General',
            licenseNumber: `MINSA-${userId.substring(0, 8).toUpperCase()}`,
          },
        });
      }
    } else if (targetRole === 'delivery_driver') {
      const driverProfile = await tx.deliveryDriverProfile.findUnique({ where: { userId } });
      if (!driverProfile) {
        let pharmacy = await tx.pharmacy.findFirst();
        if (!pharmacy) {
          pharmacy = await tx.pharmacy.create({
            data: {
              name: 'Farmacia Oasis Principal',
              address: 'Managua, Nicaragua',
              latitude: 12.1364,
              longitude: -86.2514,
              deliveryFee: 29.90,
            }
          });
        }
        await tx.deliveryDriverProfile.create({
          data: {
            userId,
            pharmacyId: pharmacy.id,
            vehicleType: 'motocicleta',
            isAvailable: true,
          },
        });
      }
    } else if (targetRole === 'receptionist') {
      const recProfile = await tx.receptionistProfile.findUnique({ where: { userId } });
      if (!recProfile) {
        const clinic = await tx.clinic.findFirst();
        await tx.receptionistProfile.create({
          data: {
            userId,
            clinicId: clinic?.id || null,
          },
        });
      }
    } else if (targetRole === 'cashier' || targetRole === 'pharmacy_manager' || targetRole === 'pharmacy_admin') {
      const mgrProfile = await tx.pharmacyManagerProfile.findUnique({ where: { userId } });
      if (!mgrProfile) {
        const pharmacy = await tx.pharmacy.findFirst();
        await tx.pharmacyManagerProfile.create({
          data: {
            userId,
            pharmacyId: pharmacy?.id || null,
          },
        });
      }
    }

    return updatedUser;
  });

  // Audit log
  await createAuditLog({
    userId: adminUserId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    details: JSON.stringify(data),
    ipAddress,
    userAgent,
  });

  return user;
}

/**
 * Get authenticated user with profile (GET /api/auth/me)
 */
export async function getMe(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      patientProfile: true,
      doctorProfile: { include: { clinic: true } },
      pharmacyManagerProfile: { include: { pharmacy: true } },
      deliveryDriverProfile: true,
      receptionistProfile: { include: { clinic: true } },
    },
  });

  return user;
}

/**
 * Update patient profile
 */
export async function updatePatientProfile(
  userId: string,
  data: {
    date_of_birth?: string;
    blood_type?: string;
    allergies?: string[];
    medical_notes?: string;
    emergency_contact?: string;
    emergency_phone?: string;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const profile = await db.patientProfile.update({
    where: { userId },
    data: {
      dateOfBirth: data.date_of_birth,
      bloodType: data.blood_type,
      allergies: data.allergies ? JSON.stringify(data.allergies) : undefined,
      medicalNotes: data.medical_notes,
      emergencyContact: data.emergency_contact,
      emergencyPhone: data.emergency_phone,
    },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    details: JSON.stringify({ updated: 'patient_profile', ...data }),
    ipAddress,
    userAgent,
  });

  return {
    userId: profile.userId,
    date_of_birth: profile.dateOfBirth,
    blood_type: profile.bloodType,
    allergies: profile.allergies ? JSON.parse(profile.allergies) : null,
    medical_notes: profile.medicalNotes,
    emergency_contact: profile.emergencyContact,
    emergency_phone: profile.emergencyPhone,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

/**
 * Update own profile (PATCH /api/users/me)
 */
export async function updateMe(
  userId: string,
  data: { name?: string; phone?: string },
  ipAddress?: string,
  userAgent?: string
) {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    details: JSON.stringify(data),
    ipAddress,
    userAgent,
  });

  return user;
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('NOT_FOUND');
  }

  const { verifyPassword } = await import('@/lib/auth/password');
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    details: JSON.stringify({ action: 'change_password' }),
    ipAddress,
    userAgent,
  });

  return { message: 'Contraseña actualizada' };
}

/**
 * Update FCM token
 */
export async function updateFcmToken(
  userId: string,
  token: string | null,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await db.user.update({
    where: { id: userId },
    data: { fcmToken: token },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      fcmToken: true,
    },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    details: JSON.stringify({ updated: 'fcm_token', hasToken: !!token }),
    ipAddress,
    userAgent,
  });

  return user;
}
