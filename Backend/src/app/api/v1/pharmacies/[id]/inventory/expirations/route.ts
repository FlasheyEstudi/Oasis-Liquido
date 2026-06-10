// OASIS - Pharmacy Inventory FEFO Expirations Route
// GET /api/v1/pharmacies/:id/inventory/expirations

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as inventoryService from '@/lib/services/inventory.service';
import { db } from '@/lib/db';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<any> }) => {
    try {
      const { id } = await context.params;

      // Verify pharmacy_manager or pharmacy_admin belongs to this pharmacy
      if (req.user.role === 'pharmacy_manager') {
        const profile = await db.pharmacyManagerProfile.findUnique({
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

      const batches = await inventoryService.getExpiringBatches(id);
      return successResponse(batches);
    } catch (error: any) {
      console.error('Error getting expiring batches:', error);
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager', 'pharmacy_admin', 'admin'] }
);
