// OASIS - Clinic Cash Reconciliation Summary Route
// GET /api/v1/clinics/[id]/reconciliations/summary - Calculate system expected sales for reconciliation

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as cashReconciliationService from '@/lib/services/cash-reconciliation.service';

/**
 * GET /api/v1/clinics/[id]/reconciliations/summary
 * Calculates expected sales drawer balance for today
 */
export const GET = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const clinicId = params.id;
    if (!clinicId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'ID de clínica requerido', 400);
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;

    const summary = await cashReconciliationService.getCashSummary(clinicId, 'clinic', date);
    return successResponse(summary);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error al calcular resumen de caja', 500);
  }
}, { roles: ['clinic_admin', 'receptionist', 'admin'] });
