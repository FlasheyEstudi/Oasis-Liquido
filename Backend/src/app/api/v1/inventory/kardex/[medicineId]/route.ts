// OASIS - Inventory Kardex API Route
// GET /api/v1/inventory/kardex/[medicineId] - Historical inventory movements

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as inventoryService from '@/lib/services/inventory.service';

/**
 * GET /api/v1/inventory/kardex/[medicineId]
 * Get history of inventory movements for a medicine
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ medicineId: string }> }) => {
  try {
    const { medicineId } = await context.params;
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get('pharmacy_id') || undefined;

    const kardex = await inventoryService.getKardex(medicineId, pharmacyId);
    return successResponse(kardex, 'Movimientos de Kardex cargados exitosamente');
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['pharmacy_manager', 'admin'] });
