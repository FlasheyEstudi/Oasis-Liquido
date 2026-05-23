import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { sendPushNotification } from '@/lib/fcm';

/**
 * POST /api/v1/delivery/orders/:id/complete
 * Marks a delivery order as completed/delivered, updates the corresponding sale, and registers timestamp
 */
export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: orderId } = await context.params;
    const driverId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'delivery_driver' && userRole !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Solo los repartidores pueden completar entregas', 403);
    }

    // 1. Verify order existence and driver assignment
    const order = await db.deliveryOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido de entrega no encontrado', 404);
    }

    if (userRole === 'delivery_driver' && order.deliveryDriverId !== driverId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para completar esta entrega', 403);
    }

    // 2. Update status of the delivery order to 'delivered'
    const updatedOrder = await db.deliveryOrder.update({
      where: { id: orderId },
      data: {
        status: 'delivered',
        deliveredAt: new Date()
      },
      include: {
        pharmacy: true,
        patient: true
      }
    });

    // 3. Update status of the corresponding sale to 'delivered'
    if (updatedOrder.saleId) {
      await db.sale.update({
        where: { id: updatedOrder.saleId },
        data: {
          status: 'delivered'
        }
      });
    }

    // 4. Notify patient of delivery completion via Push notification
    if (updatedOrder.patientId) {
      sendPushNotification(
        updatedOrder.patientId,
        '🎉 Pedido Entregado con Éxito',
        `¡Tu pedido de ${updatedOrder.pharmacy?.name || 'la farmacia'} ha sido entregado! Gracias por confiar en OASIS.`
      ).catch(err => console.warn('⚠️ Error sending push notification on order complete:', err));
    }

    return successResponse({
      success: true,
      message: 'Pedido entregado con éxito',
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error completing delivery order:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al completar la entrega del pedido', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });
