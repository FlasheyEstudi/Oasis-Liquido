import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

/**
 * GET /api/v1/delivery/orders/available
 * Retrieves list of available delivery orders (status 'pending' or 'ready_for_pickup' with no driver assigned)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole !== 'delivery_driver' && userRole !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Solo los repartidores pueden ver pedidos disponibles', 403);
    }

    // Fetch delivery driver profile to verify status
    const driverProfile = await db.deliveryDriverProfile.findUnique({
      where: { userId }
    });

    if (userRole === 'delivery_driver' && !driverProfile) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Perfil de repartidor no encontrado', 404);
    }

    // Traer pedidos con status 'pending' o 'ready_for_pickup' y sin repartidor asignado
    const availableOrders = await db.deliveryOrder.findMany({
      where: {
        status: { in: ['pending', 'ready_for_pickup', 'accepted'] },
        deliveryDriverId: null
      },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            phone: true,
            deliveryFee: true
          }
        },
        patient: {
          select: {
            name: true,
            phone: true
          }
        },
        sale: {
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response to ensure all required fields are returned cleanly
    const formattedOrders = availableOrders.map(order => ({
      id: order.id,
      saleId: order.saleId,
      pharmacyId: order.pharmacyId,
      deliveryDriverId: order.deliveryDriverId,
      patientId: order.patientId,
      pickupAddress: order.pickupAddress || order.pharmacy?.address || 'Farmacia Oasis',
      pickupLat: order.pickupLat || order.pharmacy?.latitude || 12.136389,
      pickupLng: order.pickupLng || order.pharmacy?.longitude || -86.251389,
      deliveryAddress: order.deliveryAddress,
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
      status: order.status,
      notes: order.notes || '',
      createdAt: order.createdAt.toISOString(),
      pharmacy: {
        name: order.pharmacy?.name || 'Farmacia Oasis',
        address: order.pharmacy?.address || 'Managua, Nicaragua',
        phone: order.pharmacy?.phone || '+505 2200-0000',
        latitude: order.pharmacy?.latitude || 12.136389,
        longitude: order.pharmacy?.longitude || -86.251389
      },
      patient: {
        name: order.patient?.name || 'Paciente Anónimo',
        phone: order.patient?.phone || '+505 8000-0000'
      },
      totalAmount: order.sale?.totalAmount || 0,
      deliveryFee: order.pharmacy?.deliveryFee || 29.90,
      tip: 0,
      cashOnDelivery: order.sale?.totalAmount || 0
    }));

    return successResponse(formattedOrders);

  } catch (error: any) {
    console.error('Error fetching available delivery orders:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener pedidos disponibles', 500);
  }
}, { roles: ['delivery_driver', 'admin'] });
