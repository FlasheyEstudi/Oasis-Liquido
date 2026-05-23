// OASIS - Pharmacies List Route
// GET /api/v1/pharmacies/list
// Public endpoint used for dropdown selection during registration

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const list = await db.pharmacy.findMany({
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
    console.error('[PHARMACIES-LIST] Error listando farmacias:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error obteniendo lista de farmacias', 500);
  }
}
