// GET /api/v1/staff - Get active staff list for the authenticated facility owner (unified endpoint)

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import * as invitationService from '@/lib/services/invitation.service';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    if (role === 'clinic_admin') {
      // Find clinic owned by this admin
      const clinic = await db.clinic.findFirst({
        where: { ownerId: userId },
      });
      if (!clinic) {
        return successResponse({ doctors: [], receptionists: [] }, 'No se encontró clínica para este administrador');
      }

      const workers = await invitationService.getClinicWorkers(clinic.id, userId);
      return successResponse(workers, 'Personal de la clínica cargado correctamente');
    }

    if (role === 'pharmacy_admin') {
      // Find pharmacy owned by this admin
      const pharmacy = await db.pharmacy.findFirst({
        where: { ownerId: userId },
      });
      if (!pharmacy) {
        return successResponse({ cashiers: [], drivers: [] }, 'No se encontró farmacia para este administrador');
      }

      const workers = await invitationService.getPharmacyWorkers(pharmacy.id, userId);
      return successResponse(workers, 'Personal de la farmacia cargado correctamente');
    }

    return errorResponse(ErrorCodes.FORBIDDEN, 'Acceso denegado. Rol no autorizado.', 403);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['clinic_admin', 'pharmacy_admin'] });
