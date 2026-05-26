import { NextRequest } from 'next/server';
import { CronService } from '@/lib/services/cron.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

/**
 * GET /api/v1/cron
 * Trigger daily cron checks for legal document expirations.
 * Protected by CRON_SECRET token.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'oasis_cron_super_secret_token_123';

    if (secret !== expectedSecret) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'No autorizado para ejecutar tareas cron', 401);
    }

    await CronService.checkExpirations();

    return successResponse({ processed: true }, 'Tareas programadas de expiración ejecutadas de forma atómica y exitosa.');
  } catch (error: any) {
    console.error('Cron job route error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno al ejecutar tareas cron', 500);
  }
}
