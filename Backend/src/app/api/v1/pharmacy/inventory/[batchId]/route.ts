// OASIS - Pharmacy Inventory Batch Route
// PUT /api/v1/pharmacy/inventory/[batchId]

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as inventoryService from '@/lib/services/inventory.service';
import { db } from '@/lib/db';

async function getMyPharmacyId(userId: string) {
  const profile = await db.pharmacyManagerProfile.findUnique({
    where: { userId },
  });
  return profile?.pharmacyId;
}

export const PUT = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ batchId: string }> }) => {
    try {
      const { batchId } = await context.params;
      const pharmacyId = await getMyPharmacyId(req.user.userId);
      
      if (!pharmacyId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes una farmacia asignada', 403);
      }

      // Verify the batch belongs to the user's pharmacy
      const batch = await db.inventoryBatch.findUnique({
        where: { id: batchId },
        include: { inventory: true }
      });

      if (!batch || batch.inventory.pharmacyId !== pharmacyId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a este lote', 403);
      }

      const body = await req.json();
      
      const updated = await inventoryService.updateBatch(batchId, {
        quantity: body.quantity,
        batchNumber: body.batch_number,
        costPrice: body.cost_price,
        sellingPrice: body.selling_price,
        expirationDate: body.expiration_date ? new Date(body.expiration_date) : undefined,
      });

      return successResponse(updated, 'Lote actualizado exitosamente');
    } catch (error: any) {
      console.error('PUT batch error:', error);
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Lote no encontrado', 404);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager', 'admin'] }
);
