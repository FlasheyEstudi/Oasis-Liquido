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
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters.role) where.role = filters.role;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
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

  // Create user with role-specific profile
  const user = await db.user.create({
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
          clinicId: data.clinicId 
        } 
      } : undefined,
      pharmacyManagerProfile: (data.role === 'pharmacy_manager' || data.role === 'pharmacy_admin') ? { 
        create: { 
          pharmacyId: data.pharmacyId 
        } 
      } : undefined,
      deliveryDriverProfile: data.role === 'delivery_driver' ? { create: {} } : undefined,
      receptionistProfile: data.role === 'receptionist' ? { 
        create: { 
          clinicId: data.clinicId 
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
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
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
