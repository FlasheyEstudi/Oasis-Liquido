import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { NotificationService } from '@/lib/services/notification.service';

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;
    const userId = req.user.userId;

    const result = await NotificationService.markAsRead(userId, notificationId);

    return successResponse({ 
      success: true, 
      message: notificationId ? 'Notificación marcada como leída' : 'Todas las notificaciones marcadas como leídas',
      data: result
    });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al marcar las notificaciones como leídas', 500);
  }
});
