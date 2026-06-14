// OASIS - Pharmacy Inventory FEFO Expirations Route
// GET /api/v1/pharmacies/:id/inventory/expirations

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as inventoryService from '@/lib/services/inventory.service';
import { db } from '@/lib/db';
import { verifyFacilityAccess } from '@/lib/auth/access';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<any> }) => {
    try {
      const { id } = await context.params;

      // Verify pharmacy_manager or pharmacy_admin belongs to this pharmacy using centralized access helper
      const hasAccess = await verifyFacilityAccess(req.user.userId, req.user.role, id, 'pharmacy');
      if (!hasAccess) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
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
