// OASIS - Pharmacies Route
// GET /api/pharmacies (public)
// POST /api/pharmacies (admin only)

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createPharmacySchema } from '@/lib/validators';
import * as pharmacyService from '@/lib/services/pharmacy.service';

/**
 * GET /api/pharmacies
 * Public endpoint — lists active pharmacies with optional search, geolocation, and medicine filters.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse optional numeric parameters
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : undefined;

    // Parse comma-separated medicine_ids into an array
    const medicineIdsParam = searchParams.get('medicine_ids');
    const medicineIds = medicineIdsParam
      ? medicineIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;

    const pharmacies = await pharmacyService.getPharmacies({
      search: searchParams.get('search') || undefined,
      lat,
      lng,
      radiusKm,
      medicineIds,
      isActive: searchParams.get('is_active') || undefined,
    });

    return successResponse(pharmacies);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}

/**
 * POST /api/pharmacies
 * Admin only — creates a new pharmacy.
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createPharmacySchema, body);
    if (!validation.success) return validation.error;

    const pharmacy = await pharmacyService.createPharmacy(
      validation.data,
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(pharmacy, 'Farmacia creada exitosamente', 201);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin'] });
