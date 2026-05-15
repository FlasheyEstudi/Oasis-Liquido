// OASIS - Clinic Service
// CRUD for clinics and listing doctors by clinic

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

/**
 * Get clinics with optional filters
 */
export async function getClinics(filters: { search?: string; isActive?: string; userRole?: string }) {
  const where: Record<string, unknown> = {};

  // Non-admin users only see active clinics
  if (filters.userRole !== 'admin') {
    where.isActive = true;
  } else if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true';
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { address: { contains: filters.search } },
    ];
  }

  return db.clinic.findMany({
    where,
    include: {
      _count: { select: { doctorProfiles: true, appointments: true } },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Create a new clinic (admin only)
 */
export async function createClinic(data: {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}, userId?: string, ipAddress?: string, userAgent?: string) {
  const clinic = await db.clinic.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude ?? 19.4326,
      longitude: data.longitude ?? -99.1332,
      phone: data.phone,
    },
  });

  await createAuditLog({
    userId,
    action: 'create',
    entityType: 'clinic',
    entityId: clinic.id,
    ipAddress,
    userAgent,
  });

  return clinic;
}

/**
 * Update a clinic (admin only)
 */
export async function updateClinic(
  id: string,
  data: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    isActive?: boolean;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const clinic = await db.clinic.findUnique({ where: { id } });
  if (!clinic) throw new Error('NOT_FOUND');

  const updated = await db.clinic.update({
    where: { id },
    data,
  });

  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'clinic',
    entityId: id,
    details: JSON.stringify(data),
    ipAddress,
    userAgent,
  });

  return updated;
}

/**
 * Get doctors by clinic (public)
 */
export async function getClinicDoctors(clinicId: string, filters?: { search?: string; specialty?: string }) {
  const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new Error('NOT_FOUND');

  const where: any = {
    role: 'doctor',
    isActive: true,
    doctorProfile: { clinicId },
  };

  if (filters?.specialty) {
    where.doctorProfile.specialty = { contains: filters.specialty };
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { doctorProfile: { specialty: { contains: filters.search } } },
    ];
  }

  const doctors = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      doctorProfile: {
        select: {
          specialty: true,
          licenseNumber: true,
          clinicId: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return doctors;
}
