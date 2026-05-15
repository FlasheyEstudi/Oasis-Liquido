// OASIS - Medicine Service
// Public medicine catalog

import { db } from '@/lib/db';

/**
 * Get medicines with search and filters
 */
export async function getMedicines(filters: {
  search?: string;
  requiresPrescription?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = { isActive: true };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { genericName: { contains: filters.search } },
    ];
  }

  if (filters.requiresPrescription !== undefined) {
    where.requiresPrescription = filters.requiresPrescription === 'true';
  }

  return db.medicine.findMany({
    where,
    orderBy: { name: 'asc' },
    take: filters.limit || 50,
  });
}

/**
 * Get single medicine by ID
 */
export async function getMedicine(id: string) {
  const medicine = await db.medicine.findUnique({
    where: { id },
  });

  if (!medicine) throw new Error('NOT_FOUND');
  return medicine;
}
