import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { sendPushNotification } from '@/lib/fcm';

/**
 * POST /api/v1/delivery/orders/:id/accept
 * Assigns a delivery driver to an order and updates status to 'assigned'
 */
export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: orderId } = await context.params;
    const driverId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'delivery_driver' && userRole !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Solo los repartidores pueden aceptar pedidos', 403);
    }

    // 1. Verify that the order exists and is unassigned
    const order = await db.deliveryOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Pedido no encontrado', 404);
    }

    if (order.deliveryDriverId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Este pedido ya tiene un repartidor asignado', 400);
    }

    // 2. Assign the driver and update status to 'assigned' (consistent with delivery service transitions)
    const updatedOrder = await db.deliveryOrder.update({
      where: { id: orderId },
      data: {
        deliveryDriverId: driverId,
        status: 'assigned',
        assignedAt: new Date()
      },
      include: {
        pharmacy: true,
        patient: true
      }
    });

    // 3. Notify patient of delivery assignment via Push notification (asynchronous, non-blocking)
    if (updatedOrder.patientId) {
      sendPushNotification(
        updatedOrder.patientId,
        '🚚 Repartidor Asignado',
        `Tu pedido de ${updatedOrder.pharmacy?.name || 'la farmacia'} ya tiene un repartidor asignado y se está preparando para la entrega.`
      ).catch(err => console.warn('⚠️ Error sending push notification on order accept:', err));
    }

    return successResponse({
      success: true,
      message: 'Pedido aceptado con éxito',
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error accepting delivery order:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al aceptar el pedido de entrega', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });
