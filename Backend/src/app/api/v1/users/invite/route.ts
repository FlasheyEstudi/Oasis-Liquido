// OASIS - Admin Invite Route
// POST /api/v1/users/invite
// Endpoint allowing admins to invite other admins or high-privileged roles

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { createAuditLog } from '@/lib/services/audit.service';
import crypto from 'crypto';

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { email, name, role } = body;

      if (!email || !name || !role) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'email, name y role son requeridos', 400);
      }

      // Only allow admins to invite other admins or clinic/pharmacy admins
      if (role !== 'admin' && role !== 'clinic_admin' && role !== 'pharmacy_admin') {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Rol de invitación no soportado por este endpoint', 400);
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return errorResponse(ErrorCodes.EMAIL_EXISTS, 'El email ya está registrado en el sistema', 409);
      }

      // Generate invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

      // Create invitation
      const invitation = await db.invitation.create({
        data: {
          email,
          role,
          token,
          expiresAt,
          senderId: req.user.userId,
        },
      });

      // Audit Log
      try {
        await createAuditLog({
          userId: req.user.userId,
          action: 'create',
          entityType: 'invitation',
          entityId: invitation.id,
          details: JSON.stringify({ email, role, action: 'invite_admin_or_owner' }),
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        });
      } catch (auditError) {
        console.warn('[INVITE-ROUTE] Error creando audit log:', auditError);
      }

      console.log('[INVITE-ROUTE] Invitación creada exitosamente para:', email, 'con rol:', role);

      return successResponse({
        message: 'Invitación enviada exitosamente.',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
        }
      });

    } catch (error: any) {
      console.error('[INVITE-ROUTE] Error invitando usuario:', error);
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor al crear invitación', 500);
    }
  },
  { roles: ['admin'] }
);
