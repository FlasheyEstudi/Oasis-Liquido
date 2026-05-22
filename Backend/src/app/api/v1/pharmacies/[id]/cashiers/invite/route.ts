// POST /api/v1/pharmacies/:id/cashiers/invite - Invite cashier

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody } from '@/lib/validators';
import { z } from 'zod/v4';
import * as invitationService from '@/lib/services/invitation.service';

const inviteCashierSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = validateBody(inviteCashierSchema, body);
    if (!validation.success) return validation.error;

    const invitation = await invitationService.inviteWorker(
      req.user.userId,
      body.email,
      'cashier',
      undefined,
      id,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(invitation, 'Invitación para cajero creada exitosamente', 201);
  } catch (error: any) {
    if (error.message === 'EMAIL_ALREADY_REGISTERED') {
      return errorResponse(ErrorCodes.CONFLICT, 'El correo ya está registrado en el sistema', 409);
    }
    if (error.message === 'FORBIDDEN_PHARMACY') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos sobre esta farmacia', 403);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['pharmacy_owner', 'pharmacy_admin', 'admin'] });
