// OASIS - Admin Audit Logs Route
// GET /api/admin/audit-logs

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { paginatedResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import * as auditService from '@/lib/services/audit.service';
import { parsePagination } from '@/lib/utils/pagination';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const userId = searchParams.get('user_id') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entity_type') || undefined;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    const { data, total } = await auditService.getAuditLogs({
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      page,
      limit,
      skip,
    });

    return paginatedResponse(data, page, limit, total);
  } catch (error: any) {
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
}, { roles: ['admin'] });
