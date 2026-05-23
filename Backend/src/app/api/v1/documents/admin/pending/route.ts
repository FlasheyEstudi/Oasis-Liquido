import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { DocumentService } from '@/lib/services/document.service';

/**
 * GET /api/v1/documents/admin/pending
 * Superadmin dashboard endpoint to query all pending verification files.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const data = await DocumentService.getPendingDocuments();
    return successResponse(data, 'Listado de documentos pendientes para auditoría cargados exitosamente');
  } catch (error: any) {
    console.error('Pending documents query error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener documentos pendientes', 500);
  }
}, { roles: ['admin'] });
