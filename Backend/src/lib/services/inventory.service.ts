// OASIS - Inventory Service
// Stock management: list, adjust, seed

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

/**
 * Get inventory for a pharmacy
 */
export async function getInventory(filters: {
  pharmacyId: string;
  search?: string;
  lowStock?: boolean;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: any = {
    pharmacyId: filters.pharmacyId,
  };

  if (filters.search) {
    where.medicine = {
      OR: [
        { name: { contains: filters.search } },
        { genericName: { contains: filters.search } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    db.inventory.findMany({
      where,
      include: { medicine: true },
      orderBy: { medicine: { name: 'asc' } },
      skip: filters.skip,
      take: filters.limit,
    }),
    db.inventory.count({ where }),
  ]);

  // Filter low stock in memory for SQLite compatibility since we can't compare columns easily in where
  let filteredItems = items;
  if (filters.lowStock) {
    filteredItems = items.filter((item) => item.quantity <= item.minStock);
  }

  return { data: filteredItems, total: filters.lowStock ? filteredItems.length : total };
}

/**
 * Adjust inventory stock
 */
export async function adjustInventory(
  pharmacyId: string,
  data: {
    medicine_id: string;
    quantity_change: number;
    new_price?: number;
    reason?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Find existing inventory item
  let item = await db.inventory.findFirst({
    where: {
      pharmacyId,
      medicineId: data.medicine_id,
    },
  });

  if (!item) {
    // If item doesn't exist and we're adding stock, create it
    if (data.quantity_change > 0) {
      item = await db.inventory.create({
        data: {
          pharmacyId,
          medicineId: data.medicine_id,
          quantity: data.quantity_change,
          unitPrice: data.new_price || 0,
        },
      });
    } else {
      throw new Error('INSUFFICIENT_STOCK');
    }
  } else {
    // Check if new quantity would be negative
    const newQuantity = item.quantity + data.quantity_change;
    if (newQuantity < 0) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    // Update existing item
    const updateData: any = { quantity: newQuantity };
    if (data.new_price !== undefined) updateData.unitPrice = data.new_price;

    item = await db.inventory.update({
      where: { id: item.id },
      data: updateData,
    });
  }

  // Record precise movement for Kardex
  if (userId) {
    // Use any as a safety if types are lagging, but the field should exist
    await (db as any).inventoryMovement.create({
      data: {
        inventoryId: item.id,
        userId: userId,
        quantityChange: data.quantity_change,
        type: data.quantity_change > 0 ? 'restock' : 'adjustment',
        reason: data.reason || 'Ajuste manual',
      }
    });
  }

  // Return with medicine info
  const result = await db.inventory.findUnique({
    where: { id: item.id },
    include: { medicine: true },
  });

  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'inventory',
    entityId: item.id,
    details: JSON.stringify({
      medicine_id: data.medicine_id,
      quantity_change: data.quantity_change,
      new_quantity: item.quantity,
      reason: data.reason,
    }),
    ipAddress,
    userAgent,
  });

  return result;
}

/**
 * Seed inventory (bulk upsert)
 */
export async function seedInventory(
  pharmacyId: string,
  items: Array<{
    medicine_id: string;
    quantity: number;
    unit_price: number;
    min_stock?: number;
  }>
) {
  const results: any[] = [];

  for (const item of items) {
    const existing = await db.inventory.findFirst({
      where: { pharmacyId, medicineId: item.medicine_id },
    });

    if (existing) {
      // Update existing
      const updated = await db.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: item.quantity,
          unitPrice: item.unit_price,
          minStock: item.min_stock ?? existing.minStock,
        },
        include: { medicine: true },
      });
      results.push(updated);
    } else {
      // Create new
      const created = await db.inventory.create({
        data: {
          pharmacyId,
          medicineId: item.medicine_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          minStock: item.min_stock ?? 10,
        },
        include: { medicine: true },
      });
      results.push(created);
    }
  }

  return results;
}
