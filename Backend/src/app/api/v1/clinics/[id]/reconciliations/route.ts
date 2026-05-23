// OASIS - Clinic Cash Reconciliations Route
// GET /api/v1/clinics/[id]/reconciliations - List settlement history
// POST /api/v1/clinics/[id]/reconciliations - Submit a cash drawer balance/settle

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as cashReconciliationService from '@/lib/services/cash-reconciliation.service';

/**
 * GET /api/v1/clinics/[id]/reconciliations
 * Returns historical settlements for the clinic
 */
export const GET = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const clinicId = params.id;
    if (!clinicId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'ID de clínica requerido', 400);
    }

    const history = await cashReconciliationService.getReconciliationHistory(clinicId, 'clinic');
    return successResponse(history);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error al obtener historial de arqueos', 500);
  }
}, { roles: ['clinic_admin', 'receptionist', 'admin'] });

/**
 * POST /api/v1/clinics/[id]/reconciliations
 * Saves a new daily settle / cash reconciliation record
 */
export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const clinicId = params.id;
    if (!clinicId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'ID de clínica requerido', 400);
    }

    const body = await req.json();
    const { openingBalance, actualCash, actualCard, notes } = body;

    if (openingBalance === undefined || actualCash === undefined || actualCard === undefined) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Balances de apertura, efectivo real y tarjeta real son obligatorios',
        400
      );
    }

    const settle = await cashReconciliationService.createCashReconciliation(
      req.user.userId,
      {
        entityId: clinicId,
        entityType: 'clinic',
        openingBalance: parseFloat(openingBalance),
        actualCash: parseFloat(actualCash),
        actualCard: parseFloat(actualCard),
        notes: notes || '',
      },
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(settle, 'Arqueo de caja guardado exitosamente y registrado en bitácora inmutable', 201);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error al guardar el arqueo de caja', 500);
  }
}, { roles: ['clinic_admin', 'receptionist', 'admin'] });
