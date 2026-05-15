// OASIS - Clinic Doctors Route
// GET /api/clinics/:id/doctors (public)

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as clinicService from '@/lib/services/clinic.service';

/**
 * GET /api/clinics/:id/doctors
 * Public endpoint — lists all active doctors belonging to a clinic.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const specialty = searchParams.get('specialty') || undefined;

    const doctors = await clinicService.getClinicDoctors(id, { search, specialty });

    return successResponse(doctors);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Clínica no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}
