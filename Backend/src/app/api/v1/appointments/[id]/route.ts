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

/**
 * PATCH /api/appointments/:id
 * Update/Reschedule an appointment
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await appointmentService.updateAppointment(
      id,
      {
        date_time: body.date_time,
        duration_minutes: body.duration_minutes,
        notes: body.notes,
      },
      req.user.userId,
      req.user.role,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(updated);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Cita no encontrada', 404);
    }
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'No tienes permiso para actualizar esta cita', 403);
    }
    console.error('[PATCH APPOINTMENT ERROR]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar la cita', 500);
  }
});

