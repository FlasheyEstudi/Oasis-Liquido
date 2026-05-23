import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { DocumentService } from '@/lib/services/document.service';

/**
 * PUT /api/v1/documents/admin/[type]/[id]/verify
 * Endpoint for superadmins to verify doctor or clinic documents.
 * URL params:
 * - type: "doctor" | "clinic"
 * - id: documentId
 * Body:
 * - status: "approved" | "rejected"
 * - rejectionReason: string (optional, required if status is rejected)
 */
export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ type: string; id: string }> }) => {
  try {
    const { type, id } = await params;
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'status debe ser "approved" o "rejected"', 400);
    }

    if (status === 'rejected' && !rejectionReason) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'rejectionReason es obligatorio para rechazar un documento', 400);
    }

    let result;
    if (type === 'doctor') {
      result = await DocumentService.verifyDoctorDocument(
        id,
        req.user.userId,
        status,
        rejectionReason,
        req.headers.get('x-forwarded-for') || undefined,
        req.headers.get('user-agent') || undefined
      );
    } else if (type === 'clinic') {
      result = await DocumentService.verifyClinicDocument(
        id,
        req.user.userId,
        status,
        rejectionReason,
        req.headers.get('x-forwarded-for') || undefined,
        req.headers.get('user-agent') || undefined
      );
    } else {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tipo de documento inválido en la URL. Debe ser "doctor" o "clinic"', 400);
    }

    return successResponse(result, `Documento legal verificado exitosamente y guardado como ${status === 'approved' ? 'Aprobado' : 'Rechazado'}`);
  } catch (error: any) {
    console.error('Verify document error:', error);
    if (error.message === 'DOCUMENT_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'El documento legal especificado no existe', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error al procesar la verificación del documento', 500);
  }
}, { roles: ['admin'] });
