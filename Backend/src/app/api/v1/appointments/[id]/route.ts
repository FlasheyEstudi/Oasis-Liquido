// OASIS - Appointment Detail Route
// GET /api/appointments/:id - Get single appointment (owner, admin, receptionist)

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as appointmentService from '@/lib/services/appointment.service';

/**
 * GET /api/appointments/:id
 * Get a single appointment by ID
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    const appointment = await appointmentService.getAppointment(id);
    if (!appointment) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Cita no encontrada', 404);
    }

    return successResponse(appointment);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Cita no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
