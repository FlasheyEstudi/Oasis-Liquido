import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { NotificationService } from '@/lib/services/notification.service';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { token, deviceInfo } = await req.json();

    if (!token) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Token is required', 400);
    }

    const userId = req.user.userId;

    await NotificationService.registerToken(userId, token, deviceInfo);

    return successResponse({ success: true, message: 'Token registered successfully' });
  } catch (error: any) {
    console.error('Error registering token:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al registrar el token', 500);
  }
});
