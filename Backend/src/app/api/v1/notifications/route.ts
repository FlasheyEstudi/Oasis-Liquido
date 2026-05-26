import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { NotificationService } from '@/lib/services/notification.service';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const userId = req.user.userId;

    const result = await NotificationService.listForUser(userId, {
      page,
      limit,
      isRead: unreadOnly ? false : undefined,
    });

    return successResponse(result);
  } catch (error: any) {
    console.error('Error listing notifications:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al listar las notificaciones', 500);
  }
});
