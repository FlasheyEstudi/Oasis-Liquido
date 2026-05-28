// OASIS - Clinic Service
// CRUD for clinics and listing doctors by clinic

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get clinics with optional filters
 */
export async function getClinics(filters: {
  search?: string;
  isActive?: string;
  userRole?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}) {
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

  let clinics = await db.clinic.findMany({
    where,
    include: {
      _count: { select: { doctorProfiles: true, appointments: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Filter by radius if lat/lng provided
  if (filters.lat !== undefined && filters.lng !== undefined) {
    const radiusKm = filters.radiusKm || 10;
    clinics = clinics.filter((c) => {
      if (c.latitude == null || c.longitude == null) return false;
      const distance = haversineDistance(filters.lat!, filters.lng!, c.latitude, c.longitude);
      return distance <= radiusKm;
    });

    // Add distance to each clinic
    const clinicsWithDistance = clinics.map((c) => ({
      ...c,
      distance: haversineDistance(filters.lat!, filters.lng!, c.latitude!, c.longitude!),
    }));

    // Sort by distance
    clinicsWithDistance.sort((a, b) => a.distance - b.distance);
    return clinicsWithDistance;
  }

  return clinics;
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
  ownerId?: string;
  owner_id?: string;
}, userId?: string, ipAddress?: string, userAgent?: string) {
  const resolvedOwnerId = data.ownerId || data.owner_id;

  const clinic = await db.clinic.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude ?? 19.4326,
      longitude: data.longitude ?? -99.1332,
      phone: data.phone,
      ownerId: resolvedOwnerId || null,
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
    ownerId?: string;
    owner_id?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const clinic = await db.clinic.findUnique({ where: { id } });
  if (!clinic) throw new Error('NOT_FOUND');

  const resolvedOwnerId = data.ownerId !== undefined ? data.ownerId : data.owner_id;

  const updatePayload: any = {
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    phone: data.phone,
    isActive: data.isActive,
  };

  if (resolvedOwnerId !== undefined) {
    updatePayload.ownerId = resolvedOwnerId || null;
  }

  const updated = await db.clinic.update({
    where: { id },
    data: updatePayload,
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

  return doctors.map(doc => ({
    ...doc,
    doctor_profile: doc.doctorProfile ? {
      ...doc.doctorProfile,
      license_number: doc.doctorProfile.licenseNumber,
      clinic_id: doc.doctorProfile.clinicId,
    } : null
  }));
}

/**
 * Get a single clinic by ID
 */
export async function getClinic(id: string) {
  const clinic = await db.clinic.findUnique({
    where: { id },
    include: {
      _count: { select: { doctorProfiles: true, appointments: true } },
    },
  });
  if (!clinic) throw new Error('NOT_FOUND');
  return clinic;
}

