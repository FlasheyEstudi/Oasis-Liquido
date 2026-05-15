// OASIS - Pharmacy by ID Route
// GET /api/pharmacies/:id (public)
// PATCH /api/pharmacies/:id (admin only)

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updatePharmacySchema } from '@/lib/validators';
import * as pharmacyService from '@/lib/services/pharmacy.service';

/**
 * GET /api/pharmacies/:id
 * Public endpoint — retrieves a single pharmacy with its current inventory.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const pharmacy = await pharmacyService.getPharmacy(id);

    return successResponse(pharmacy);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Farmacia no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}

/**
 * PATCH /api/pharmacies/:id
 * Admin only — updates a pharmacy's data.
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    const body = await req.json();
    const validation = validateBody(updatePharmacySchema, body);
    if (!validation.success) return validation.error;

    const updated = await pharmacyService.updatePharmacy(
      id,
      validation.data,
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(updated, 'Farmacia actualizada exitosamente');
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Farmacia no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin'] });
