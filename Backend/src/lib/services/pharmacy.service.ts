// OASIS - Pharmacy Service
// CRUD for pharmacies with geolocation search

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
 * Get pharmacies with optional filters and geolocation
 */
export async function getPharmacies(filters: {
  search?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  medicineIds?: string[];
  isActive?: string;
}) {
  const where: Record<string, unknown> = { isActive: true };

  if (filters.isActive && filters.isActive !== 'true') {
    delete where.isActive; // Admin can see inactive
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { address: { contains: filters.search } },
    ];
  }

  // If medicine_ids filter, only show pharmacies that have those medicines in stock
  if (filters.medicineIds && filters.medicineIds.length > 0) {
    where.inventory = {
      some: {
        medicineId: { in: filters.medicineIds },
        quantity: { gt: 0 },
      },
    };
  }

  let pharmacies = await db.pharmacy.findMany({
    where,
    include: {
      _count: { select: { inventory: true, sales: true } },
      ...(filters.medicineIds && filters.medicineIds.length > 0 ? {
        inventory: {
          where: {
            medicineId: { in: filters.medicineIds },
            quantity: { gt: 0 }
          },
          select: { medicineId: true, quantity: true }
        }
      } : {})
    },
    orderBy: { name: 'asc' },
  });

  // Calculate matchedMedicinesCount
  if (filters.medicineIds && filters.medicineIds.length > 0) {
    pharmacies = pharmacies.map(p => ({
      ...p,
      matchedMedicinesCount: (p as any).inventory?.length || 0,
      matchedMedicines: (p as any).inventory?.map((i: any) => i.medicineId) || [],
    }));
  }


  // Filter by radius if lat/lng provided
  if (filters.lat !== undefined && filters.lng !== undefined) {
    const radiusKm = filters.radiusKm || 10;
    pharmacies = pharmacies.filter((p) => {
      const distance = haversineDistance(filters.lat!, filters.lng!, p.latitude, p.longitude);
      return distance <= radiusKm;
    });

    // Add distance to each pharmacy
    pharmacies = pharmacies.map((p) => ({
      ...p,
      distance: haversineDistance(filters.lat!, filters.lng!, p.latitude, p.longitude),
    }));

    // Sort by distance
    pharmacies.sort((a, b) => (a.distance as number) - (b.distance as number));
  }

  return pharmacies;
}

/**
 * Get single pharmacy by ID with inventory summary
 */
export async function getPharmacy(id: string) {
  const pharmacy = await db.pharmacy.findUnique({
    where: { id },
    include: {
      inventory: {
        include: { medicine: true },
        where: { quantity: { gt: 0 } },
        take: 20,
        orderBy: { medicine: { name: 'asc' } },
      },
      _count: { select: { sales: true } },
    },
  });

  if (!pharmacy) throw new Error('NOT_FOUND');
  return pharmacy;
}

/**
 * Create a new pharmacy (admin only)
 */
export async function createPharmacy(data: {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  delivery_fee?: number;
}, userId?: string, ipAddress?: string, userAgent?: string) {
  const pharmacy = await db.pharmacy.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude ?? 19.4326,
      longitude: data.longitude ?? -99.1332,
      phone: data.phone,
      deliveryFee: data.delivery_fee ?? 29.90,
    },
  });

  await createAuditLog({
    userId,
    action: 'create',
    entityType: 'pharmacy',
    entityId: pharmacy.id,
    ipAddress,
    userAgent,
  });

  return pharmacy;
}

/**
 * Update a pharmacy (admin only)
 */
export async function updatePharmacy(
  id: string,
  data: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    isActive?: boolean;
    delivery_fee?: number;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const pharmacy = await db.pharmacy.findUnique({ where: { id } });
  if (!pharmacy) throw new Error('NOT_FOUND');

  const updateData: Record<string, unknown> = { ...data };
  if (data.delivery_fee !== undefined) {
    updateData.deliveryFee = data.delivery_fee;
    delete updateData.delivery_fee;
  }

  const updated = await db.pharmacy.update({
    where: { id },
    data: updateData,
  });

  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'pharmacy',
    entityId: id,
    details: JSON.stringify(data),
    ipAddress,
    userAgent,
  });

  return updated;
}
