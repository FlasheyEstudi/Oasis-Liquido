// OASIS - Users Route
// GET /api/users (admin only) - List users with filters
// POST /api/users (admin only) - Create a new user

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createUserSchema } from '@/lib/validators';
import * as userService from '@/lib/services/user.service';
import { parsePagination } from '@/lib/utils/pagination';

/**
 * GET /api/users
 * List all users with optional filters (admin only)
 * Query: ?role=patient&search=carlos&page=1&limit=20
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    const { data, total } = await userService.getUsers({
      role,
      search,
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
