// OASIS - Delivery Service
// Delivery orders, status updates, and GPS tracking

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';
import { emitDeliveryLocation } from '@/lib/socket';
import { sendPushNotification } from '@/lib/fcm';

/**
 * Get delivery orders with role-based filtering
 */
export async function getDeliveryOrders(filters: {
  pharmacyId?: string;
  deliveryDriverId?: string;
  patientId?: string;
  status?: string;
  userRole?: string;
  userId?: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Record<string, unknown> = {};

  // Role-based filtering
  if (filters.userRole === 'patient' && filters.userId) {
    where.patientId = filters.userId;
  } else if (filters.userRole === 'delivery_driver' && filters.userId) {
    where.deliveryDriverId = filters.userId;
  } else if (filters.userRole === 'pharmacy_manager' && filters.userId) {
    // Get pharmacy_manager's pharmacy
    const profile = await db.pharmacyManagerProfile.findUnique({
      where: { userId: filters.userId },
    });
    if (profile?.pharmacyId) {
      where.pharmacyId = profile.pharmacyId;
    }
  } else if (filters.userRole === 'pharmacy_admin' && filters.userId) {
    // Get all pharmacies owned by this admin to enforce strict multi-tenant containment
    const pharmacies = await db.pharmacy.findMany({
      where: { ownerId: filters.userId },
      select: { id: true }
    });
    const pharmacyIds = pharmacies.map(p => p.id);
    where.pharmacyId = { in: pharmacyIds };
  } else {
    // Admin sees based on filters
    if (filters.pharmacyId) where.pharmacyId = filters.pharmacyId;
    if (filters.deliveryDriverId) where.deliveryDriverId = filters.deliveryDriverId;
    if (filters.patientId) where.patientId = filters.patientId;
  }


  if (filters.status) where.status = filters.status;

  const [data, total] = await Promise.all([
    db.deliveryOrder.findMany({
      where,
      include: {
        sale: { include: { saleItems: { include: { medicine: true } } } },
        pharmacy: { select: { id: true, name: true, address: true, phone: true } },
        deliveryDriver: { select: { id: true, name: true, phone: true, deliveryDriverProfile: true } },
        patient: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: filters.skip,
      take: filters.limit,
    }),
    db.deliveryOrder.count({ where }),
  ]);

  return { data, total };
}

/**
 * Get single delivery order
 */
export async function getDeliveryOrder(id: string) {
  return db.deliveryOrder.findUnique({
    where: { id },
    include: {
      sale: { include: { saleItems: { include: { medicine: true } } } },
      pharmacy: true,
      deliveryDriver: { select: { id: true, name: true, phone: true, deliveryDriverProfile: true } },
      patient: { select: { id: true, name: true, phone: true } },
    },
  });
}

/**
 * Update delivery order status with role-based authorization
 */
export async function updateDeliveryStatus(
  id: string,
  newStatus: string,
  userRole: string,
  userId: string,
  deliveryDriverId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const order = await db.deliveryOrder.findUnique({ where: { id } });
  if (!order) throw new Error('NOT_FOUND');

  const currentStatus = order.status;

  if (userRole === 'pharmacy_manager' || userRole === 'pharmacy_admin' || userRole === 'admin') {
    // Managers and Admins can: pending → assigned (with driver_id)
    if (currentStatus !== 'pending' || newStatus !== 'assigned') {
      throw new Error('INVALID_STATUS_TRANSITION');
    }
    if (!deliveryDriverId) {
      throw new Error('VALIDATION_ERROR: delivery_driver_id required for assignment');
    }
  } else if (userRole === 'delivery_driver') {
    // delivery_driver can: assigned → picked_up, picked_up → in_transit, in_transit → delivered
    const driverTransitions: Record<string, string> = {
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered',
    };
    if (driverTransitions[currentStatus] !== newStatus) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }
    // Verify this driver is assigned
    if (order.deliveryDriverId !== userId) {
      throw new Error('FORBIDDEN');
    }
  } else {
    throw new Error('FORBIDDEN');
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  // Set timestamps
  if (newStatus === 'assigned') {
    updateData.assignedAt = new Date();
    updateData.deliveryDriverId = deliveryDriverId;
  } else if (newStatus === 'picked_up') {
    updateData.pickedUpAt = new Date();
  } else if (newStatus === 'delivered') {
    updateData.deliveredAt = new Date();
  }

  const updated = await db.deliveryOrder.update({
    where: { id },
    data: updateData,
    include: {
      sale: { include: { saleItems: true } },
      pharmacy: true,
      deliveryDriver: { select: { id: true, name: true, phone: true, deliveryDriverProfile: true } },
      patient: { select: { id: true, name: true } },
    },
  });

  // Update sale status if delivery is delivered
  if (newStatus === 'delivered' && order.saleId) {
    await db.sale.update({
      where: { id: order.saleId },
      data: { status: 'delivered' },
    });
  }

  // Deactivate chat session if delivery is completed or failed
  if (['delivered', 'failed'].includes(newStatus)) {
    await db.chatSession.updateMany({
      where: { targetId: id },
      data: { isActive: false }
    }).catch(e => console.error('Failed to deactivate chat session in updateDeliveryStatus:', e));
  }

  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'delivery_order',
    entityId: id,
    details: JSON.stringify({ field: 'status', from: currentStatus, to: newStatus }),
    ipAddress,
    userAgent,
  });

  // REAL-TIME: Emit update via Socket.IO if in transit
  if (newStatus === 'in_transit' && updated.deliveryDriver?.deliveryDriverProfile) {
    const profile = updated.deliveryDriver.deliveryDriverProfile as any;
    emitDeliveryLocation(id, profile.currentLat || 0, profile.currentLng || 0);
  }

  // PUSH NOTIFICATIONS: Notify patient of status change
  const statusLabels: Record<string, string> = {
    assigned: 'ha sido asignado a un repartidor',
    picked_up: 'ha sido recolectado en la farmacia',
    in_transit: 'está en camino a tu ubicación',
    delivered: 'ha sido entregado con éxito',
  };

  if (updated.patientId && statusLabels[newStatus]) {
    sendPushNotification(
      updated.patientId,
      'Actualización de tu pedido',
      `Tu pedido ${statusLabels[newStatus]}.`
    );

    try {
      const { notifyDeliveryStatusChanged } = await import('./event-notifications');
      notifyDeliveryStatusChanged(updated.patientId, updated.saleId ? updated.saleId.slice(-6) : id.slice(-6), newStatus).catch((err: any) => console.error(err));
    } catch (err) {
      console.error('Error triggering local delivery status notification:', err);
    }
  }

  // Notify pharmacy staff of the status update in their bells
  if (updated.pharmacyId) {
    try {
      const { notifyPharmacyDeliveryStatus } = await import('./event-notifications');
      notifyPharmacyDeliveryStatus(
        updated.pharmacyId,
        updated.saleId ? updated.saleId.slice(-6) : id.slice(-6),
        newStatus,
        updated.deliveryDriver?.name || 'un repartidor'
      ).catch((err: any) => console.error(err));
    } catch (err) {
      console.error('Error triggering pharmacy status notification:', err);
    }
  }

  if (newStatus === 'assigned' && deliveryDriverId) {
    sendPushNotification(
      deliveryDriverId,
      '🛒 Nuevo pedido asignado',
      `Se te ha asignado el pedido de entrega #${id.slice(-6)} para ${updated.patient?.name || 'un paciente'}.`,
      { type: 'delivery_assigned', orderId: id }
    );

    // In-app notification in driver's bell
    try {
      const { NotificationService } = await import('./notification.service');
      NotificationService.createNotification({
        userId: deliveryDriverId,
        title: '🛒 Nuevo reparto asignado',
        body: `Se te ha asignado el pedido #${id.slice(-6)} para ${updated.patient?.name || 'un paciente'}.`,
        type: 'delivery_assigned',
        link: 'inicio-repartidor',
      }).catch((err: any) => console.error(err));
    } catch (err) {
      console.error('Error creating driver in-app notification:', err);
    }
  }

  return updated;
}

/**
 * Get tracking data for a delivery order
 */
export async function getDeliveryTracking(orderId: string) {
  const order = await db.deliveryOrder.findUnique({
    where: { id: orderId },
    include: {
      sale: { include: { saleItems: { include: { medicine: true } } } },
      pharmacy: true,
      deliveryDriver: { select: { id: true, name: true, phone: true, deliveryDriverProfile: true } },
      patient: { select: { id: true, name: true } },
      deliveryRoutes: {
        orderBy: { recordedAt: 'desc' },
        take: 50, // Last 50 GPS points
      },
    },
  });

  if (!order) throw new Error('NOT_FOUND');

  return {
    order,
    route: order.deliveryRoutes,
  };
}

/**
 * Maps a database DeliveryOrder model to the snake_case format expected by the frontend,
 * including mapping sale.saleItems to items and setting necessary default fallbacks.
 */
export function mapDeliveryOrder(order: any) {
  if (!order) return null;
  
  const items = order.sale?.saleItems?.map((item: any) => ({
    id: item.id,
    delivery_order_id: order.id,
    medicine_id: item.medicineId,
    medicine: item.medicine,
    quantity: item.quantity,
    unit_price: item.unitPrice ?? item.unit_price ?? 0,
  })) || [];

  return {
    id: order.id,
    pharmacy_id: order.pharmacyId,
    patient_id: order.patientId,
    delivery_driver_id: order.deliveryDriverId,
    status: order.status,
    delivery_address: order.deliveryAddress,
    delivery_lat: order.deliveryLat,
    delivery_lng: order.deliveryLng,
    pickup_address: order.pickupAddress,
    pickup_lat: order.pickupLat,
    pickup_lng: order.pickupLng,
    order_date: order.createdAt,
    delivered_at: order.deliveredAt,
    notes: order.notes,
    pharmacy: order.pharmacy,
    patient: order.patient,
    driver: order.deliveryDriver || order.driver,
    items,
    sale: order.sale,
  };
}

