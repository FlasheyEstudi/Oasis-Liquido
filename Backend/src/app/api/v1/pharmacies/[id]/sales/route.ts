// OASIS - Pharmacy Sales Route
// POST /api/pharmacies/:id/sales

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createSaleSchema } from '@/lib/validators';
import * as saleService from '@/lib/services/sale.service';

export const POST = withAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id: pharmacyId } = await context.params;

    const body = await req.json();
    const validation = validateBody(createSaleSchema, body);
    if (!validation.success) return validation.error;

    // If pharmacist is creating, patientId might be in body (manual entry) or null
    // If patient is creating (current code fallback), use req.user.userId
    const creatorId = req.user.userId;
    const patientId = body.patient_id || (req.user.role === 'patient' ? req.user.userId : undefined);

    const data = await saleService.createSale(
      pharmacyId,
      validation.data,
      patientId,
      creatorId,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(data, 'Venta creada exitosamente', 201);
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_STOCK')) {
      return errorResponse(ErrorCodes.INSUFFICIENT_STOCK, 'Stock insuficiente', 400);
    }
    if (error.message === 'NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Farmacia no encontrada', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['patient', 'pharmacy_manager', 'pharmacy_admin', 'admin'] });
