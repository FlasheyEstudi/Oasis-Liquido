// OASIS - Delivery Orders List Route
// GET /api/delivery-orders

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { paginatedResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as deliveryService from '@/lib/services/delivery.service';
import { parsePagination } from '@/lib/utils/pagination';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const userRole = req.user.role;
    const userId = req.user.userId;

    // Role-based query param extraction
    const pharmacyId = searchParams.get('pharmacy_id') || undefined;
    const deliveryDriverId = searchParams.get('delivery_driver_id') || undefined;
    const patientId = searchParams.get('patient_id') || undefined;
    const status = searchParams.get('status') || undefined;

    const { data, total } = await deliveryService.getDeliveryOrders({
      pharmacyId,
      deliveryDriverId,
      patientId,
      status,
      userRole,
      userId,
      page,
      limit,
      skip,
    });

    return paginatedResponse(data, page, limit, total);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
