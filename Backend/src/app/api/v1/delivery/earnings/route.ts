import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

/**
 * GET /api/v1/delivery/earnings
 * Calculates the driver's earnings: total historical, today's earnings, weekly earnings, and rating
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const driverId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'delivery_driver' && userRole !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Solo los repartidores pueden ver sus ganancias', 403);
    }

    // Get all delivered orders for the current driver
    const deliveredOrders = await db.deliveryOrder.findMany({
      where: {
        deliveryDriverId: driverId,
        status: 'delivered'
      },
      include: {
        pharmacy: {
          select: {
            deliveryFee: true
          }
        }
      }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of the week: 7 days ago
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const totalDeliveries = deliveredOrders.length;
    const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.pharmacy?.deliveryFee || 29.90), 0);

    const todayOrders = deliveredOrders.filter(order => order.deliveredAt && new Date(order.deliveredAt) >= startOfToday);
    const todayEarnings = todayOrders.reduce((sum, order) => sum + (order.pharmacy?.deliveryFee || 29.90), 0);

    const weekOrders = deliveredOrders.filter(order => order.deliveredAt && new Date(order.deliveredAt) >= startOfWeek);
    const weekEarnings = weekOrders.reduce((sum, order) => sum + (order.pharmacy?.deliveryFee || 29.90), 0);

    // Get rating from reviews (if any, default to 4.90)
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
      todayEarnings,
      weekEarnings,
      rating
    });

  } catch (error: any) {
    console.error('Error fetching driver earnings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al calcular las ganancias del repartidor', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });
