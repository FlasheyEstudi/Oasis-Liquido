// OASIS - Sale Service
// Create sales with optional delivery order

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

/**
 * Create a sale - decrements inventory and optionally creates delivery order
 */
export async function createSale(
  pharmacyId: string,
  data: {
    items: Array<{ medicine_id: string; quantity: number }>;
    prescription_id?: string;
    is_delivery: boolean;
    delivery_address?: string;
    delivery_lat?: number;
    delivery_lng?: number;
    notes?: string;
    appointment_id?: string;
    clinic_id?: string;
  },
  patientId?: string,
  creatorId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Validate inventory availability and calculate total
  let totalAmount = 0;
  const saleItemsData: Array<{ medicine_id: string; quantity: number; unit_price: number }> = [];

  for (const item of data.items) {
    let unitPrice = (item as any).unit_price || 0;
    
    // If it's a pharmacy sale, get price from inventory and check stock
    if (pharmacyId && !data.clinic_id) {
      const inventoryItem = await db.inventory.findFirst({
        where: { pharmacyId, medicineId: item.medicine_id },
      });

      if (!inventoryItem || inventoryItem.quantity < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK: Medicine ${item.medicine_id} insufficient stock`);
      }
      unitPrice = inventoryItem.unitPrice;
    }

    const lineTotal = unitPrice * item.quantity;
    totalAmount += lineTotal;
    saleItemsData.push({
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      unit_price: unitPrice,
    });
  }

  // Add delivery fee if delivery
  if (data.is_delivery) {
    const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (pharmacy) {
      totalAmount += pharmacy.deliveryFee;
    }
  }

  // Create sale in transaction
  const sale = await db.sale.create({
    data: {
      pharmacyId: data.clinic_id ? undefined : pharmacyId,
      clinicId: data.clinic_id,
      appointmentId: data.appointment_id,
      patientId,
      prescriptionId: data.prescription_id,
      isDelivery: data.is_delivery,
      deliveryAddress: data.delivery_address,
      deliveryLat: data.delivery_lat,
      deliveryLng: data.delivery_lng,
      deliveryNotes: data.notes,
      totalAmount,
      saleItems: {
        create: saleItemsData.map((item) => ({
          medicineId: item.medicine_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
      },
    },
    include: {
      saleItems: { include: { medicine: true } },
      pharmacy: true,
    },
  });

  // Decrement inventory only for pharmacy sales
  if (pharmacyId && !data.clinic_id) {
    for (const item of data.items) {
      const inventoryItem = await db.inventory.findFirst({
        where: { pharmacyId, medicineId: item.medicine_id },
      });

      if (inventoryItem) {
        await db.inventory.update({
          where: { id: inventoryItem.id },
          data: { quantity: inventoryItem.quantity - item.quantity },
        });

        // Record movement for Kardex
        await (db as any).inventoryMovement.create({
          data: {
            inventoryId: inventoryItem.id,
            userId: creatorId || patientId || 'system',
            quantityChange: -item.quantity,
            type: 'sale',
            reason: `Venta #${sale.id.slice(-6)}`,
          }
        });
      }
    }
  }

  // Create delivery order if is_delivery
  if (data.is_delivery && data.delivery_address) {
    const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
    
    await db.deliveryOrder.create({
      data: {
        saleId: sale.id,
        pharmacyId,
        patientId: patientId || '',
        pickupAddress: pharmacy?.address || '',
        pickupLat: pharmacy?.latitude || 0,
        pickupLng: pharmacy?.longitude || 0,
        deliveryAddress: data.delivery_address,
        deliveryLat: data.delivery_lat || 0,
        deliveryLng: data.delivery_lng || 0,
        notes: data.notes,
      },
    });
  }

  // Return sale with delivery order if applicable
  const result = await db.sale.findUnique({
    where: { id: sale.id },
    include: {
      saleItems: { include: { medicine: true } },
      pharmacy: true,
      deliveryOrder: true,
    },
  });

  await createAuditLog({
    userId: creatorId || patientId,
    action: 'create',
    entityType: 'sale',
    entityId: sale.id,
    ipAddress,
    userAgent,
  });

  return result;
}
