import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/services/audit.service';
import { sendPushNotification } from '@/lib/fcm';

/**
 * POST /api/v1/patient/emergency
 * Triggers an emergency alert for a patient
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.userId;
    const { lat, lng, message: customMessage } = await req.json();

    // 1. Get patient profile and emergency contact
    const patient = await db.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
      }
    });

    if (!patient || !patient.patientProfile) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Perfil de paciente no encontrado', 404);
    }

    // 2. Get current medications for the alert
    const prescriptions = await db.prescription.findMany({
      where: { patientId: userId, status: 'active' },
      include: { prescriptionLines: { include: { medicine: true } } }
    });

    const medsList = prescriptions.flatMap(p => 
      p.prescriptionLines.map(l => l.medicine?.name)
    ).filter(Boolean).join(', ');

    const emergencyContact = (patient.patientProfile as any).emergencyContact || 'No especificado';
    const emergencyPhone = (patient.patientProfile as any).emergencyPhone;

    // 3. Log the alert
    await createAuditLog({
      userId,
      action: 'emergency_alert',
      entityType: 'patient',
      entityId: userId,
      details: JSON.stringify({ lat, lng, contact: emergencyContact }),
    });

    // 4. Simulate WhatsApp/SMS (In a real app, use Twilio or WhatsApp Business API)
    const alertMessage = `🆘 ALERTA DE EMERGENCIA: OASIS AURA\n\nPaciente: ${patient.name}\nUbicación: https://www.google.com/maps?q=${lat},${lng}\nMedicamentos actuales: ${medsList || 'Ninguno'}\n\nEste es un mensaje automático de emergencia.`;
    
    console.log(`[WHATSAPP/SMS to ${emergencyPhone}]: ${alertMessage}`);

    // 5. Notify nearby clinics or system admins via FCM
    // For demo purposes, we just notify the patient that help is on the way
    await sendPushNotification(userId, 'Alerta de Emergencia Enviada', 'Ayuda en camino. Hemos contactado a tu contacto de emergencia.');

    return successResponse({ 
      success: true, 
      message: 'Alerta enviada correctamente',
      debug: { alertMessage }
    });
  } catch (error: any) {
    console.error('Emergency alert error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al enviar alerta', 500);
  }
}, { roles: ['patient'] });
