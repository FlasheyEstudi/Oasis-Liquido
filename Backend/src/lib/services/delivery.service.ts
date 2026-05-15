// OASIS - Delivery Service
// Delivery orders, status updates, and GPS tracking

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

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
  } else {
    // admin sees based on filters
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

  // Validate transitions based on role
  if (userRole === 'pharmacy_manager') {
    // pharmacy_manager can: pending → assigned (with driver_id)
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
      deliveryDriver: { select: { id: true, name: true, phone: true } },
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

  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'delivery_order',
    entityId: id,
    details: JSON.stringify({ field: 'status', from: currentStatus, to: newStatus }),
    ipAddress,
    userAgent,
  });

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
