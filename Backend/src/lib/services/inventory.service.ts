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
      include: { 
        medicine: true,
        batches: {
          orderBy: { expirationDate: 'asc' },
          where: { quantity: { gt: 0 } }
        }
      },
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
  return await db.$transaction(async (tx) => {
    // Find existing inventory item
    let item = await tx.inventory.findFirst({
      where: {
        pharmacyId,
        medicineId: data.medicine_id,
      },
    });

    if (!item) {
      // If item doesn't exist and we're adding stock, create it
      if (data.quantity_change > 0) {
        item = await tx.inventory.create({
          data: {
            pharmacyId,
            medicineId: data.medicine_id,
            quantity: data.quantity_change,
            unitPrice: data.new_price || 0,
          },
        });
        
        // OAS-005: Create corresponding batch
        await tx.inventoryBatch.create({
          data: {
            inventoryId: item.id,
            batchNumber: `AJUSTE-${Date.now().toString().slice(-6)}`,
            quantity: data.quantity_change,
            sellingPrice: data.new_price || 0,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year expiration
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

      // OAS-005: Sync batches on adjustment
      if (data.quantity_change > 0) {
        // Restock / Adding stock: create adjustment batch
        await tx.inventoryBatch.create({
          data: {
            inventoryId: item.id,
            batchNumber: `AJUSTE-${Date.now().toString().slice(-6)}`,
            quantity: data.quantity_change,
            sellingPrice: data.new_price || item.unitPrice,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      } else if (data.quantity_change < 0) {
        // Adjusting down / Removing stock: Deduct FEFO
        let remainingToDeduct = Math.abs(data.quantity_change);
        
        const activeBatches = await tx.inventoryBatch.findMany({
          where: {
            inventoryId: item.id,
            quantity: { gt: 0 },
          },
          orderBy: {
            expirationDate: 'asc', // FEFO
          },
        });

        for (const batch of activeBatches) {
          if (remainingToDeduct <= 0) break;
          const deduct = Math.min(batch.quantity, remainingToDeduct);
          
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduct } },
          });
          
          remainingToDeduct -= deduct;
        }

        // If there is still remaining quantity to deduct but no batches left, it's legacy stock.
        // We allow it because the total inventory quantity will be deducted below.
      }

      // Update existing item
      const updateData: any = { quantity: newQuantity };
      if (data.new_price !== undefined) updateData.unitPrice = data.new_price;

      item = await tx.inventory.update({
        where: { id: item.id },
        data: updateData,
      });
    }

    // Record precise movement for Kardex
    if (userId) {
      await (tx as any).inventoryMovement.create({
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
    const result = await tx.inventory.findUnique({
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
  });
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
/**
 * Create a new inventory batch
 */
export async function createBatch(data: {
  inventoryId: string;
  batchNumber: string;
  quantity: number;
  costPrice?: number;
  sellingPrice?: number;
  expirationDate?: Date;
  supplier?: string;
}) {
  if (data.quantity < 0) {
    throw new Error('INVALID_QUANTITY: Batch quantity must be non-negative');
  }
  if (data.costPrice !== undefined && data.costPrice < 0) {
    throw new Error('INVALID_PRICE: Cost price must be non-negative');
  }
  if (data.sellingPrice !== undefined && data.sellingPrice < 0) {
    throw new Error('INVALID_PRICE: Selling price must be non-negative');
  }

  return await db.$transaction(async (tx) => {
    const batch = await tx.inventoryBatch.create({
      data: {
        inventoryId: data.inventoryId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        expirationDate: data.expirationDate,
        supplier: data.supplier,
      },
    });

    // Update total inventory quantity
    await tx.inventory.update({
      where: { id: data.inventoryId },
      data: { 
        quantity: { increment: data.quantity },
        // Update price if sellingPrice provided
        ...(data.sellingPrice ? { unitPrice: data.sellingPrice } : {})
      },
    });

    return batch;
  });
}

/**
 * Update an existing batch
 */
export async function updateBatch(id: string, data: {
  quantity?: number;
  batchNumber?: string;
  costPrice?: number;
  sellingPrice?: number;
  expirationDate?: Date;
}) {
  if (data.quantity !== undefined && data.quantity < 0) {
    throw new Error('INVALID_QUANTITY: Batch quantity must be non-negative');
  }
  if (data.costPrice !== undefined && data.costPrice < 0) {
    throw new Error('INVALID_PRICE: Cost price must be non-negative');
  }
  if (data.sellingPrice !== undefined && data.sellingPrice < 0) {
    throw new Error('INVALID_PRICE: Selling price must be non-negative');
  }

  return await db.$transaction(async (tx) => {
    const oldBatch = await tx.inventoryBatch.findUnique({ where: { id } });
    if (!oldBatch) throw new Error('NOT_FOUND');

    // If quantity changed, check that overall inventory doesn't become negative
    if (data.quantity !== undefined) {
      const diff = data.quantity - oldBatch.quantity;
      const inventory = await tx.inventory.findUnique({
        where: { id: oldBatch.inventoryId },
      });
      if (inventory && (inventory.quantity + diff) < 0) {
        throw new Error('INSUFFICIENT_STOCK: Consolidated inventory quantity cannot be negative');
      }

      await tx.inventory.update({
        where: { id: oldBatch.inventoryId },
        data: { quantity: { increment: diff } },
      });
    }

    const updated = await tx.inventoryBatch.update({
      where: { id },
      data,
    });

    return updated;
  });
}

/**
 * Get Kardex movements for a specific medicine across pharmacies, or a single pharmacy
 */
export async function getKardex(medicineId: string, pharmacyId?: string) {
  const where: any = {
    inventory: {
      medicineId,
    },
  };

  if (pharmacyId) {
    where.inventory.pharmacyId = pharmacyId;
  }

  const movements = await db.inventoryMovement.findMany({
    where,
    include: {
      inventory: {
        include: {
          pharmacy: true,
          medicine: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return movements.map((m) => ({
    id: m.id,
    inventory_id: m.inventoryId,
    type: m.type,
    quantity_change: m.quantityChange,
    reason: m.reason,
    created_at: m.createdAt,
    pharmacy_name: m.inventory.pharmacy.name,
    medicine_name: m.inventory.medicine.name,
  }));
}

/**
 * Get expiring batches for a pharmacy (FEFO)
 */
export async function getExpiringBatches(pharmacyId: string, limit: number = 10) {
  return await db.inventoryBatch.findMany({
    where: {
      inventory: {
        pharmacyId,
      },
      quantity: { gt: 0 },
      expirationDate: { not: null },
    },
    include: {
      inventory: {
        include: {
          medicine: true,
        },
      },
    },
    orderBy: {
      expirationDate: 'asc',
    },
    take: limit,
  });
}

