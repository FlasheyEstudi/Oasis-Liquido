// OASIS - Individual Medication Adherence Reminder Route
// PATCH /api/v1/reminders/[id] (Authenticated patient)
// DELETE /api/v1/reminders/[id] (Authenticated patient)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, updateReminderStatusSchema } from '@/lib/validators';
import { ReminderService } from '@/lib/services/reminder.service';

export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const validation = validateBody(updateReminderStatusSchema, body);
      if (!validation.success) return validation.error;

      const result = await ReminderService.updateReminderStatus(
        req.user.userId,
        id,
        validation.data.status
      );

      return successResponse(result, 'Estado del recordatorio actualizado exitosamente');
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Recordatorio no encontrado', 404);
      }
      if (error.message === 'UNAUTHORIZED') {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a este recordatorio', 403);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar recordatorio', 500);
    }
  }
);

export const DELETE = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const result = await ReminderService.deleteReminder(req.user.userId, id);
      return successResponse(result, 'Recordatorio eliminado exitosamente');
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Recordatorio no encontrado', 404);
      }
      if (error.message === 'UNAUTHORIZED') {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a este recordatorio', 403);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al eliminar recordatorio', 500);
    }
  }
);
