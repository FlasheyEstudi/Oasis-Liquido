import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

import { getInMemoryDeliveries, MockDeliveryOrder } from '@/lib/db/mock-deliveries';

const inMemoryDeliveries = getInMemoryDeliveries();

/**
 * Handle GET Actions
 */
export const GET = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ action: string[] }> }) => {
  try {
    const { action } = await params;
    const actionPath = action.join('/');

    // GET available orders
    if (actionPath === 'orders/available') {
      try {
        const userRole = req.user.role;
        const driverId = req.user.userId;

        const driverProfile = await db.deliveryDriverProfile.findUnique({
          where: { userId: driverId }
        });

        const whereClause: any = { status: 'pending' };
        if (userRole === 'delivery_driver') {
          if (!driverProfile?.pharmacyId) {
            return successResponse([]);
          }
          whereClause.pharmacyId = driverProfile.pharmacyId;
        }

        const available = await db.deliveryOrder.findMany({
          where: whereClause,
          include: {
            pharmacy: true,
            patient: true,
          },
        });
        return successResponse(available);
      } catch (dbError) {
        console.warn('Database offline, returning available deliveries from in-memory fallback:', dbError);
        return successResponse(inMemoryDeliveries.filter(d => d.status === 'pending'));
      }
    }

    // GET assigned orders
    if (actionPath === 'orders/assigned') {
      const driverId = req.user.userId;
      try {
        const assigned = await db.deliveryOrder.findMany({
          where: {
            deliveryDriverId: driverId,
            status: { in: ['accepted', 'picked_up', 'in_transit'] },
          },
          include: {
            pharmacy: true,
            patient: true,
          },
        });
        return successResponse(assigned);
      } catch (dbError) {
        console.warn('Database offline, returning assigned deliveries from in-memory fallback:', dbError);
        return successResponse(inMemoryDeliveries.filter(d => d.deliveryDriverId === driverId && ['accepted', 'picked_up', 'in_transit'].includes(d.status)));
      }
    }

    // GET earnings summary
    if (actionPath === 'earnings') {
      const driverId = req.user.userId;
      try {
        const totalDeliveries = await db.deliveryOrder.count({
          where: { deliveryDriverId: driverId, status: 'delivered' }
        });
        const orders = await db.deliveryOrder.findMany({
          where: { deliveryDriverId: driverId, status: 'delivered' },
          include: { pharmacy: true }
        });
        const totalEarnings = orders.reduce((sum, o) => sum + (o.pharmacy?.deliveryFee || 0), 0);

        // Fetch rating from reviews (if any, default to 5.0)
        const reviews = await db.review.findMany({
          where: {
            targetId: driverId,
            targetType: 'driver'
          }
        });
        const rating = reviews.length > 0
          ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2))
          : 5.00;

        return successResponse({
          totalDeliveries,
          totalEarnings,
          rating,
        });
      } catch (dbError) {
        console.warn('Database error querying earnings:', dbError);
        return successResponse({
          totalDeliveries: 0,
          totalEarnings: 0.00,
          rating: 5.00,
        });
      }
    }

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Action not found', 400);
  } catch (error: any) {
    console.error('Delivery action error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error del servidor de delivery', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });

/**
 * Handle POST Actions
 */
export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ action: string[] }> }) => {
  try {
    const { action } = await params;
    const actionPath = action.join('/');
    const driverId = req.user.userId;

    // Matches pattern: orders/:id/accept, orders/:id/pickup, etc.
    const pathParts = action;
    if (pathParts[0] === 'orders' && pathParts.length === 3) {
      const orderId = pathParts[1];
      const subAction = pathParts[2];

      // ACCEPT ORDER
      if (subAction === 'accept') {
        try {
          const updated = await db.deliveryOrder.update({
            where: { id: orderId },
            data: {
              deliveryDriverId: driverId,
              status: 'accepted',
              assignedAt: new Date(),
            },
          });
          return successResponse(updated);
        } catch (dbError) {
          console.warn('Database offline, accepting in memory:', dbError);
          const item = inMemoryDeliveries.find(d => d.id === orderId);
          if (item) {
            item.status = 'accepted';
            item.deliveryDriverId = driverId;
            return successResponse(item);
          }
          return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado en fallback', 404);
        }
      }

      // REJECT ORDER
      if (subAction === 'reject') {
        try {
          const updated = await db.deliveryOrder.update({
            where: { id: orderId },
            data: {
              deliveryDriverId: null,
              status: 'pending',
            },
          });
          return successResponse(updated);
        } catch (dbError) {
          console.warn('Database offline, rejecting in memory:', dbError);
          const item = inMemoryDeliveries.find(d => d.id === orderId);
          if (item) {
            item.status = 'pending';
            item.deliveryDriverId = null;
            return successResponse(item);
          }
          return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado en fallback', 404);
        }
      }

      // PICKUP ORDER
      if (subAction === 'pickup') {
        try {
          const updated = await db.deliveryOrder.update({
            where: { id: orderId },
            data: {
              status: 'picked_up',
              pickedUpAt: new Date(),
            },
          });
          return successResponse(updated);
        } catch (dbError) {
          console.warn('Database offline, picking up in memory:', dbError);
          const item = inMemoryDeliveries.find(d => d.id === orderId);
          if (item) {
            item.status = 'picked_up';
            return successResponse(item);
          }
          return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado en fallback', 404);
        }
      }

      // DELIVER ORDER
      if (subAction === 'deliver') {
        try {
          const updated = await db.deliveryOrder.update({
            where: { id: orderId },
            data: {
              status: 'delivered',
              deliveredAt: new Date(),
            },
          });
          
          if (updated.saleId) {
            await db.sale.update({
              where: { id: updated.saleId },
              data: { status: 'delivered' },
            }).catch(e => console.error('Failed to update sale status in delivery catch-all:', e));
          }

          return successResponse(updated);
        } catch (dbError) {
          console.warn('Database offline, delivering in memory:', dbError);
          const item = inMemoryDeliveries.find(d => d.id === orderId);
          if (item) {
            item.status = 'delivered';
            return successResponse(item);
          }
          return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado en fallback', 404);
        }
      }

      // FAIL ORDER
      if (subAction === 'fail') {
        const { reason } = await req.json();
        try {
          const updated = await db.deliveryOrder.update({
            where: { id: orderId },
            data: {
              status: 'failed',
              notes: `Fallo de entrega: ${reason}`,
            },
          });
          return successResponse(updated);
        } catch (dbError) {
          console.warn('Database offline, failing in memory:', dbError);
          const item = inMemoryDeliveries.find(d => d.id === orderId);
          if (item) {
            item.status = 'failed';
            item.notes = `Fallo de entrega: ${reason}`;
            return successResponse(item);
          }
          return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado en fallback', 404);
        }
      }
    }

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Action not found', 400);
  } catch (error: any) {
    console.error('Delivery POST action error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error del servidor de delivery', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });
