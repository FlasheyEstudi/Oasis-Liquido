// OASIS - Family Verify API Route
// POST /api/v1/family/verify
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody } from '@/lib/validators';
import { z } from 'zod/v4';
import * as familyService from '@/lib/services/family.service';

const verifyLinkSchema = z.object({
  code: z.string().length(6, 'El código debe tener exactamente 6 dígitos'),
});

/**
 * POST /api/v1/family/verify
 * Dependent verifies code to complete linkage
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(verifyLinkSchema, body);
    if (!validation.success) return validation.error;

    const result = await familyService.verifyFamilyLink(
      req.user.userId,
      body.code,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );

    return successResponse(result, 'Vinculación familiar completada con éxito');
  } catch (error: any) {
    if (error.message === 'INVALID_CODE') {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Código de verificación inválido o relación inexistente', 400);
    }
    if (error.message === 'CODE_EXPIRED') {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'El código de verificación ha expirado (validez de 24 horas)', 400);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error del servidor', 500);
  }
}, { roles: ['patient', 'admin'] });
