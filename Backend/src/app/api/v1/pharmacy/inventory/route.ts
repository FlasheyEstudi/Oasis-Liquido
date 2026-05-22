// OASIS - My Pharmacy Inventory Route
// GET /api/v1/pharmacy/inventory
// POST /api/v1/pharmacy/inventory

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as inventoryService from '@/lib/services/inventory.service';
import { parsePagination } from '@/lib/utils/pagination';
import { db } from '@/lib/db';

async function getMyPharmacyId(userId: string) {
  const profile = await db.pharmacyManagerProfile.findUnique({
    where: { userId },
  });
  return profile?.pharmacyId;
}

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const pharmacyId = await getMyPharmacyId(req.user.userId);
      if (!pharmacyId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes una farmacia asignada', 403);
      }

      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || undefined;
      const lowStock = searchParams.get('low_stock') === 'true';
      const { page, limit, skip } = parsePagination(searchParams);

      const result = await inventoryService.getInventory({
        pharmacyId,
        search,
        lowStock,
        page,
        limit,
        skip,
      });

      return paginatedResponse(result.data, page, limit, result.total);
    } catch (error: any) {
      console.error('GET inventory error:', error);
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager', 'admin'] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const pharmacyId = await getMyPharmacyId(req.user.userId);
      if (!pharmacyId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes una farmacia asignada', 403);
      }

      const body = await req.json();
      
      // If we are creating a batch for an existing inventory item
      if (body.inventory_id) {
        const batch = await inventoryService.createBatch({
          inventoryId: body.inventory_id,
          batchNumber: body.batch_number,
          quantity: body.quantity,
          costPrice: body.cost_price,
          sellingPrice: body.selling_price,
          expirationDate: body.expiration_date ? new Date(body.expiration_date) : undefined,
          supplier: body.supplier,
        });
        return successResponse(batch, 'Lote creado exitosamente', 201);
      }

      // Or if we are adjusting total stock (legacy support)
      const item = await inventoryService.adjustInventory(pharmacyId, {
        medicine_id: body.medicine_id,
        quantity_change: body.quantity,
        new_price: body.unit_price,
        reason: body.reason || 'Ingreso manual',
      }, req.user.userId);

      return successResponse(item, 'Inventario actualizado exitosamente', 201);
    } catch (error: any) {
      console.error('POST inventory error:', error);
      if (error.message === 'INSUFFICIENT_STOCK') {
        return errorResponse(ErrorCodes.INSUFFICIENT_STOCK, 'Stock insuficiente', 400);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager', 'admin'] }
);
