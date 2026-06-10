// OASIS - Users Route
// GET /api/users (admin only) - List users with filters
// POST /api/users (admin only) - Create a new user

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createUserSchema } from '@/lib/validators';
import * as userService from '@/lib/services/user.service';
import { parsePagination } from '@/lib/utils/pagination';

/**
 * GET /api/users
 * List all users with optional filters (admin only)
 * Query: ?role=patient&search=carlos&page=1&limit=20
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    const callerId = req.user.userId;
    const callerRole = req.user.role;
    let clinicId: string | undefined = undefined;
    let pharmacyId: string | undefined = undefined;

    if (callerRole === 'clinic_admin') {
      const clinic = await db.clinic.findFirst({ where: { ownerId: callerId } });
      clinicId = clinic?.id;
    } else if (callerRole === 'doctor') {
      const profile = await db.doctorProfile.findUnique({ where: { userId: callerId } });
      clinicId = profile?.clinicId;
    } else if (callerRole === 'receptionist') {
      const profile = await db.receptionistProfile.findUnique({ where: { userId: callerId } });
      clinicId = profile?.clinicId || undefined;
    } else if (callerRole === 'pharmacy_admin') {
      const pharmacy = await db.pharmacy.findFirst({ where: { ownerId: callerId } });
      pharmacyId = pharmacy?.id;
    } else if (callerRole === 'pharmacy_manager' || callerRole === 'cashier') {
      const profile = await db.pharmacyManagerProfile.findUnique({ where: { userId: callerId } });
      pharmacyId = profile?.pharmacyId || undefined;
    } else if (callerRole === 'delivery_driver') {
      const profile = await db.deliveryDriverProfile.findUnique({ where: { userId: callerId } });
      pharmacyId = profile?.pharmacyId;
    }

    const { data, total } = await userService.getUsers({
      role,
      search,
      clinicId,
      pharmacyId,
      page,
      limit,
      skip,
    });

    return paginatedResponse(data, page, limit, total);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin', 'clinic_admin', 'pharmacy_admin', 'pharmacy_manager', 'receptionist'] });

/**
 * POST /api/users
 * Create a new user (admin only)
 * Body: { name, email, password, role, phone? }
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createUserSchema, body);
    if (!validation.success) return validation.error;

    const user = await userService.createUser(
      {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        phone: body.phone,
        clinicId: body.clinicId || (req.user.role === 'clinic_admin' || req.user.role === 'receptionist' ? req.user.clinicId : undefined),
        pharmacyId: body.pharmacyId || (req.user.role === 'pharmacy_admin' || req.user.role === 'pharmacy_manager' ? req.user.pharmacyId : undefined),
      },
      req.user.userId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(user, 'Usuario creado exitosamente', 201);
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return errorResponse(ErrorCodes.EMAIL_EXISTS, 'El email ya está registrado', 409);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin', 'clinic_admin', 'pharmacy_admin', 'receptionist'] });
