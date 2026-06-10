// OASIS - Prescription Detail Route
// GET /api/prescriptions/:id (owner patient/doctor, pharmacy_manager, admin)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as prescriptionService from '@/lib/services/prescription.service';
import { verifyFacilityAccess } from '@/lib/auth/access';
import { db } from '@/lib/db';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      const prescription = await prescriptionService.getPrescription(id);

      if (!prescription) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }

      // Super Admin bypass
      if (req.user.role === 'admin') {
        return successResponse(prescription);
      }

      // 1. Patient Access & Caregiver Delegation
      if (req.user.role === 'patient' && prescription.patientId !== req.user.userId) {
        const hasRelationship = await db.familyRelationship.findFirst({
          where: {
            caregiverId: req.user.userId,
            patientId: prescription.patientId,
            isActive: true,
            status: 'active',
          }
        });
        if (!hasRelationship) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
        }
      }

      // 2. Doctor/Clinic Staff Access
      if (req.user.role === 'doctor' && prescription.doctorId !== req.user.userId) {
        if (!prescription.clinicId) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
        }
        const isSameClinic = await verifyFacilityAccess(req.user.userId, req.user.role, prescription.clinicId, 'clinic');
        if (!isSameClinic) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
        }
      }

      if (req.user.role === 'receptionist' || req.user.role === 'clinic_admin') {
        if (!prescription.clinicId) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
        }
        const isSameClinic = await verifyFacilityAccess(req.user.userId, req.user.role, prescription.clinicId, 'clinic');
        if (!isSameClinic) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
        }
      }

      // 3. Pharmacy Access
      if (['pharmacy_manager', 'cashier', 'pharmacy_admin'].includes(req.user.role)) {
        if (prescription.fulfilledPharmacyId) {
          const hasAccess = await verifyFacilityAccess(req.user.userId, req.user.role, prescription.fulfilledPharmacyId, 'pharmacy');
          if (!hasAccess) {
            return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
          }
        } else {
          // If not yet fulfilled, verify the pharmacy user is linked to a valid active pharmacy
          let pharmacyId: string | null = null;
          if (req.user.role === 'pharmacy_admin') {
            const ph = await db.pharmacy.findFirst({ where: { ownerId: req.user.userId } });
            pharmacyId = ph?.id || null;
          } else {
            const profile = await db.pharmacyManagerProfile.findUnique({ where: { userId: req.user.userId } });
            pharmacyId = profile?.pharmacyId || null;
          }
          if (!pharmacyId) {
            return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes una farmacia asociada', 403);
          }
        }
      }

      // 4. Delivery Driver Access (only if assigned to deliver the order/sale related to this prescription)
      if (req.user.role === 'delivery_driver') {
        const hasDelivery = await db.deliveryOrder.findFirst({
          where: {
            deliveryDriverId: req.user.userId,
            patientId: prescription.patientId,
            status: { in: ['assigned', 'accepted', 'picked_up', 'in_transit'] }
          }
        });
        if (!hasDelivery) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta receta', 403);
        }
      }

      return successResponse(prescription);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
    }
  }
);
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const body = await req.json();

      const updated = await prescriptionService.updatePrescription(id, body, req.user.userId);
      return successResponse(updated, 'Receta actualizada exitosamente');
    } catch (error: any) {
      if (error.message === 'SIGNED_PRESCRIPTION_CANNOT_BE_EDITED') {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No se puede editar una receta que ya ha sido firmada', 403);
      }
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar la receta', 500);
    }
  },
  { roles: ['doctor', 'admin'] }
);
