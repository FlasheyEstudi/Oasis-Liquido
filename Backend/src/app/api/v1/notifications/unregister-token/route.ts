import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { NotificationService } from '@/lib/services/notification.service';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Token is required', 400);
    }

    await NotificationService.unregisterToken(token);

    return successResponse({ success: true, message: 'Token unregistered successfully' });
  } catch (error: any) {
    console.error('Error unregistering token:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al eliminar el token', 500);
  }
});
