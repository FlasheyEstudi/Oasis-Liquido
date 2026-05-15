// OASIS - Clinics Route
// GET /api/clinics (public, admin sees all including inactive)
// POST /api/clinics (admin only)

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createClinicSchema } from '@/lib/validators';
import * as clinicService from '@/lib/services/clinic.service';

/**
 * GET /api/clinics
 * Public endpoint — non-admin users only see active clinics.
 * If a valid Bearer token with admin role is provided, inactive clinics are also shown.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Try to extract user role from Authorization header (optional auth)
    let userRole: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { verifyAccessToken } = await import('@/lib/auth/jwt');
      const payload = verifyAccessToken(authHeader.slice(7));
      if (payload) userRole = payload.role;
    }

    const clinics = await clinicService.getClinics({
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('is_active') || undefined,
      userRole,
    });

    return successResponse(clinics);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}

/**
 * POST /api/clinics
 * Admin only — creates a new clinic.
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createClinicSchema, body);
    if (!validation.success) return validation.error;

    const clinic = await clinicService.createClinic(
      validation.data,
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(clinic, 'Clínica creada exitosamente', 201);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin'] });
