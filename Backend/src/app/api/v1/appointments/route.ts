// OASIS - Appointments Route
// GET /api/appointments - List appointments (authenticated, role-based filtering)
// POST /api/appointments - Create appointment (patient only)

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, paginatedResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createAppointmentSchema } from '@/lib/validators';
import { parsePagination } from '@/lib/utils/pagination';
import * as appointmentService from '@/lib/services/appointment.service';

/**
 * GET /api/appointments
 * List appointments with role-based filtering
 * Query: ?patient_id=&doctor_id=&clinic_id=&status=&date_from=&date_to=&limit=20&page=1
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const { userId, role: userRole } = req.user;

    const result = await appointmentService.getAppointments({
      patientId: searchParams.get('patient_id') || undefined,
      doctorId: searchParams.get('doctor_id') || undefined,
      clinicId: searchParams.get('clinic_id') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('date_from') || undefined,
      dateTo: searchParams.get('date_to') || undefined,
      userRole,
      userId,
      page,
      limit,
      skip,
    });

    return paginatedResponse(result.data, page, limit, result.total);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});

/**
 * POST /api/appointments
 * Create a new appointment (patient only)
 * Body: { doctor_id, clinic_id, date_time, duration_minutes?, notes? }
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createAppointmentSchema, body);
    if (!validation.success) return validation.error;

    const patientId = req.user.userId;

    const appointment = await appointmentService.createAppointment(
      {
        doctor_id: body.doctor_id,
        clinic_id: body.clinic_id,
        date_time: body.date_time,
        duration_minutes: body.duration_minutes,
        notes: body.notes,
        patientId,
      },
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(appointment, 'Cita creada exitosamente', 201);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['patient'] });
