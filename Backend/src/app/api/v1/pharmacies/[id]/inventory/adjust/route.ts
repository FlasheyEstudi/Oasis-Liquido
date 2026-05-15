// OASIS - Pharmacy Inventory Adjust Route
// POST /api/pharmacies/:id/inventory/adjust

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, adjustInventorySchema } from '@/lib/validators';
import * as inventoryService from '@/lib/services/inventory.service';
import { db } from '@/lib/db';

export const POST = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      // Verify pharmacy_manager belongs to this pharmacy
      if (req.user.role === 'pharmacy_manager') {
        const profile = await db.pharmacyManagerProfile.findUnique({
          where: { userId: req.user.userId },
        });
        if (!profile || profile.pharmacyId !== id) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
        }
      }

      const body = await req.json();
      const validation = validateBody(adjustInventorySchema, body);
      if (!validation.success) return validation.error;

      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      const result = await inventoryService.adjustInventory(
        id,
        validation.data,
        req.user.userId,
        ipAddress,
        userAgent
      );

      return successResponse(result, 'Inventario ajustado exitosamente');
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_STOCK') {
        return errorResponse(ErrorCodes.INSUFFICIENT_STOCK, 'Stock insuficiente', 400);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  },
  { roles: ['pharmacy_manager', 'admin'] }
);
