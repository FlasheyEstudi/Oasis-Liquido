// OASIS - Medication Adherence Reminders Route
// GET /api/v1/reminders (Authenticated patient)
// POST /api/v1/reminders (Authenticated patient)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { validateBody, createReminderSchema } from '@/lib/validators';
import { ReminderService } from '@/lib/services/reminder.service';

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const reminders = await ReminderService.listReminders(req.user.userId);
      return successResponse(reminders, 'Recordatorios obtenidos exitosamente');
    } catch (error: any) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener recordatorios', 500);
    }
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const validation = validateBody(createReminderSchema, body);
      if (!validation.success) return validation.error;

      const result = await ReminderService.createReminder(req.user.userId, {
        prescriptionLineId: validation.data.prescription_line_id,
        scheduledTime: validation.data.scheduled_time,
      });

      return successResponse(result, 'Recordatorio creado exitosamente', 201);
    } catch (error: any) {
      if (error.message === 'PRESCRIPTION_LINE_NOT_FOUND') {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Línea de receta no encontrada', 404);
      }
      if (error.message === 'UNAUTHORIZED') {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para esta receta', 403);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al crear recordatorio', 500);
    }
  }
);
