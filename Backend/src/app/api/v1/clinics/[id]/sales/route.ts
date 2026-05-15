
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createSaleSchema } from '@/lib/validators';
import * as saleService from '@/lib/services/sale.service';
import { db } from '@/lib/db';

/**
 * POST /api/v1/clinics/:id/sales
 * Create a billing record for a consultation or service
 */
export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: clinicId } = await context.params;
    const body = await req.json();

    // Verify access
    if (req.user.role === 'receptionist' || req.user.role === 'clinic_admin') {
      const profile = await db.receptionistProfile.findUnique({
        where: { userId: req.user.userId },
      });
      // Simple verification for demo, ideally check clinic_admin too
      if (profile && profile.clinicId !== clinicId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta clínica', 403);
      }
    }

    const creatorId = req.user.userId;
    
    // For clinic sales, we usually have an appointment_id and patient_id
    const data = await saleService.createSale(
      '', // No pharmacy_id
      {
        ...body,
        clinic_id: clinicId,
      },
      body.patient_id,
      creatorId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    // If there's an appointment, mark it as completed/billed?
    if (body.appointment_id) {
      await db.appointment.update({
        where: { id: body.appointment_id },
        data: { status: 'completed' }
      });
    }

    return successResponse(data, 'Cobro registrado exitosamente', 201);
  } catch (error: any) {
    console.error('Clinic Sale Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al procesar cobro', 500);
  }
}, { roles: ['admin', 'receptionist', 'clinic_admin', 'doctor'] });
