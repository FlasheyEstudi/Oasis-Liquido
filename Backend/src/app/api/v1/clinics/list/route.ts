// OASIS - Clinics List Route
// GET /api/v1/clinics/list
// Public endpoint used for dropdown selection during registration

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const list = await db.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(list);
  } catch (error: any) {
    console.error('[CLINICS-LIST] Error listando clínicas:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error obteniendo lista de clínicas', 500);
  }
}
