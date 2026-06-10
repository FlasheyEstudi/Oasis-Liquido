// OASIS - Pharmacy Inventory Route
// GET /api/pharmacies/:id/inventory

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as inventoryService from '@/lib/services/inventory.service';
import { parsePagination } from '@/lib/utils/pagination';
import { db } from '@/lib/db';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<any> }) => {
    try {
      const { id } = await context.params;

      // Verify access to this pharmacy based on employee role profile
      if (req.user.role === 'pharmacy_manager' || req.user.role === 'cashier') {
        const profile = await db.pharmacyManagerProfile.findUnique({
          where: { userId: req.user.userId },
        });
        if (!profile || profile.pharmacyId !== id) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
        }
      } else if (req.user.role === 'delivery_driver') {
        const profile = await db.deliveryDriverProfile.findUnique({
          where: { userId: req.user.userId },
        });
        if (!profile || profile.pharmacyId !== id) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
        }
      } else if (req.user.role === 'pharmacy_admin') {
        const pharmacy = await db.pharmacy.findUnique({
          where: { id },
        });
        if (!pharmacy || (pharmacy.ownerId !== req.user.userId && (pharmacy as any).owner_id !== req.user.userId)) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
        }
      }

      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || undefined;
      const lowStock = searchParams.get('low_stock') === 'true';
      const { page, limit, skip } = parsePagination(searchParams);

      const result = await inventoryService.getInventory({
        pharmacyId: id,
        search,
        lowStock,
        page,
        limit,
        skip,
      });

      return paginatedResponse(result.data, page, limit, result.total);
    } catch (error: any) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager', 'pharmacy_admin', 'admin', 'patient', 'doctor', 'cashier', 'delivery_driver'] }
);
