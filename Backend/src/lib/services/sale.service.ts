// OASIS - Sale Service
// Create sales with optional delivery order

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';
import { sendPushNotification } from '@/lib/fcm';
import { notifyNewOrderReceived, notifyDeliveryStatusChanged } from './event-notifications';

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
    payments?: Array<{ amount: number; method: string; currency?: string; transaction_id?: string }>;
  },
  patientId?: string,
  creatorId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  return await db.$transaction(async (tx) => {
    // Validate inventory availability and calculate total
    let totalAmount = 0;
    const saleItemsData: Array<{ medicine_id: string; quantity: number; unit_price: number }> = [];

    for (const item of data.items) {
      let unitPrice = (item as any).unit_price || 0;
      
      // If it's a pharmacy sale, get price from inventory and check stock
      if (pharmacyId && !data.clinic_id) {
        const inventoryItem = await tx.inventory.findFirst({
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
      const pharmacy = await tx.pharmacy.findUnique({ where: { id: pharmacyId } });
      if (pharmacy) {
        totalAmount += pharmacy.deliveryFee;
      }
    }

    // Validate split payments cover the total and calculate change (vuelto)
    let changeAmount = 0;
    if (data.payments && data.payments.length > 0) {
      const paidTotal = data.payments.reduce((sum, p) => sum + p.amount, 0);
      if (paidTotal < totalAmount) {
        throw new Error('INSUFFICIENT_PAYMENT');
      }
      changeAmount = paidTotal - totalAmount;
    }

    // Create sale in transaction
    const sale = await tx.sale.create({
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
        payments: {
          create: data.payments && data.payments.length > 0
            ? data.payments.map((p) => ({
                amount: p.amount,
                method: p.method,
                currency: p.currency || 'NIO',
                status: 'completed',
                transactionId: p.transaction_id || null,
                notes: p.method === 'cash' && changeAmount > 0 ? `Vuelto/Cambio: C$${changeAmount.toFixed(2)}` : null,
              }))
            : [
                {
                  amount: totalAmount,
                  method: 'cash',
                  currency: 'NIO',
                  status: 'completed',
                  notes: null,
                },
              ],
        },
      },
      include: {
        saleItems: { include: { medicine: true } },
        pharmacy: true,
      },
    });

    // Decrement inventory only for pharmacy sales using FEFO
    if (pharmacyId && !data.clinic_id) {
      for (const item of data.items) {
        const inventoryItem = await tx.inventory.findFirst({
          where: { pharmacyId, medicineId: item.medicine_id },
          include: {
            batches: {
              where: { quantity: { gt: 0 } },
              orderBy: { expirationDate: 'asc' },
            }
          }
        });

        if (inventoryItem) {
          let remainingToDiscount = item.quantity;

          // FEFO: Discount from batches
          for (const batch of inventoryItem.batches) {
            if (remainingToDiscount <= 0) break;

            const discountFromBatch = Math.min(batch.quantity, remainingToDiscount);
            
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: { quantity: batch.quantity - discountFromBatch }
            });

            remainingToDiscount -= discountFromBatch;
          }

          // Update total inventory quantity
          const newQty = inventoryItem.quantity - item.quantity;
          await tx.inventory.update({
            where: { id: inventoryItem.id },
            data: { quantity: newQty },
          });

          // Trigger low stock warning if applicable
          try {
            const pharmacySettings = await tx.pharmacySettings.findUnique({
              where: { pharmacyId }
            });
            const threshold = pharmacySettings?.minStockAlertThreshold ?? 10;
            if (newQty <= threshold) {
              const { notifyLowStockAlert } = require('./event-notifications');
              const medicine = await tx.medicine.findUnique({ where: { id: item.medicine_id } });
              notifyLowStockAlert(pharmacyId, medicine?.name || 'Medicamento', newQty).catch((err: any) => console.error(err));
            }
          } catch (stockErr) {
            console.error('Error triggering low stock warning:', stockErr);
          }

          // Record movement for Kardex
          await (tx as any).inventoryMovement.create({
            data: {
              inventoryId: inventoryItem.id,
              userId: creatorId || patientId || 'system',
              quantityChange: -item.quantity,
              type: 'sale',
              reason: `Venta #${sale.id.slice(-6)} (FEFO applied)`,
            }
          });
        }
      }
    }

    // Create delivery order if is_delivery
    if (data.is_delivery && data.delivery_address) {
      const pharmacy = await tx.pharmacy.findUnique({ where: { id: pharmacyId } });
      
      await tx.deliveryOrder.create({
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
    const result = await tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        saleItems: { include: { medicine: true } },
        pharmacy: true,
        deliveryOrder: true,
        payments: true,
      },
    });

    await createAuditLog({
      userId: creatorId || patientId,
      action: 'create',
      entityType: 'sale',
      entityId: sale.id,
      ipAddress,
      userAgent,
      details: JSON.stringify({
        totalAmount,
        paidAmount: data.payments ? data.payments.reduce((sum, p) => sum + p.amount, 0) : totalAmount,
        change: changeAmount,
        payments: data.payments || [{ amount: totalAmount, method: 'cash' }],
      }),
    });

    // PUSH NOTIFICATIONS: Notify patient of delivery confirmation
    if (data.is_delivery && patientId) {
      try {
        await sendPushNotification(
          patientId,
          '🛒 Pedido Confirmado',
          `Tu pedido por C$${totalAmount.toFixed(2)} ha sido registrado y está siendo preparado.`,
          { type: 'sale_created', saleId: sale.id }
        );
      } catch (error) {
        console.error('❌ Error sending sale confirmation push notification:', error);
      }
    }

    // Trigger local notifications
    try {
      const orderNumber = sale.id.slice(-6);
      if (pharmacyId && !data.clinic_id) {
        notifyNewOrderReceived(pharmacyId, orderNumber, totalAmount).catch(err => console.error(err));
      }
      if (patientId) {
        notifyDeliveryStatusChanged(patientId, orderNumber, 'pending').catch(err => console.error(err));
      }
    } catch (err) {
      console.error('Failed to dispatch sale/order notifications:', err);
    }

    return result;
  });
}
