import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/services/audit.service';
import { sendPushNotification } from '@/lib/fcm';
import { sendWhatsAppMessage } from '@/lib/services/whatsapp.service';

/**
 * POST /api/v1/patient/emergency
 * Triggers an emergency alert for a patient
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { lat, lng, message: customMessage } = await req.json();

    if (userRole === 'delivery_driver') {
      // 1. Get driver profile
      const driver = await db.user.findUnique({
        where: { id: userId },
        include: {
          deliveryDriverProfile: {
            include: { pharmacy: true }
          }
        }
      });

      if (!driver || !driver.deliveryDriverProfile) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Perfil de repartidor no encontrado', 404);
      }

      // 2. Get any pending active order for this driver to include in the message!
      const activeOrder = await db.deliveryOrder.findFirst({
        where: { deliveryDriverId: userId, status: 'picked_up' },
        include: { patient: true }
      });

      // 3. Log the alert
      await createAuditLog({
        userId,
        action: 'emergency_alert',
        entityType: 'delivery_driver',
        entityId: userId,
        details: JSON.stringify({ lat, lng, pharmacy: driver.deliveryDriverProfile.pharmacy.name }),
      });

      // 4. Send WhatsApp/SMS alert to the pharmacy phone number
      const pharmacyPhone = driver.deliveryDriverProfile.pharmacy.phone;
      const orderInfo = activeOrder 
        ? `\nPedido Activo: #${activeOrder.id.slice(-6)}\nCliente: ${activeOrder.patient.name}\nDirección de Entrega: ${activeOrder.deliveryAddress}`
        : '\nSin pedido activo en tránsito.';

      const alertMessage = `🆘 AUXILIO / EMERGENCIA DE REPARTIDOR: OASIS AURA\n\nRepartidor: ${driver.name}\nVehículo: ${driver.deliveryDriverProfile.vehicleType.toUpperCase()} (Placa: ${driver.deliveryDriverProfile.licensePlate || 'N/A'})\nFarmacia Origen: ${driver.deliveryDriverProfile.pharmacy.name}\nUbicación en Vivo: https://www.google.com/maps?q=${lat},${lng}${orderInfo}\n\nEste es un mensaje automático de auxilio satelital de Oasis Líquida. Asistencia requerida de inmediato.`;

      if (pharmacyPhone) {
        try {
          await sendWhatsAppMessage(pharmacyPhone, alertMessage);
          console.log(`[WHATSAPP DRIVER EMERGENCY SENT] Alert dispatched to pharmacy +${pharmacyPhone}`);
        } catch (wsError) {
          console.error('Failed to send driver emergency WhatsApp/SMS alert:', wsError);
        }
      }

      // Also send push notification to driver confirming help is coming
      await sendPushNotification(userId, 'Alerta de Auxilio Satelital Enviada', 'Centro de soporte y farmacia notificados. Asistencia en camino.');

      return successResponse({ 
        success: true, 
        message: 'Alerta de auxilio enviada correctamente',
        debug: { alertMessage }
      });
    }

    // Otherwise, standard patient emergency logic
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

    // 4. Send WhatsApp/SMS alert to the emergency contact
    const alertMessage = `🆘 ALERTA DE EMERGENCIA: OASIS AURA\n\nPaciente: ${patient.name}\nUbicación: https://www.google.com/maps?q=${lat},${lng}\nMedicamentos actuales: ${medsList || 'Ninguno'}\n\nEste es un mensaje automático de emergencia enviado desde la plataforma Oasis Líquida.`;
    
    if (emergencyPhone) {
      try {
        await sendWhatsAppMessage(emergencyPhone, alertMessage);
        console.log(`[WHATSAPP EMERGENCY SENT] Alert dispatched to +${emergencyPhone}`);
      } catch (wsError) {
        console.error('Failed to send emergency WhatsApp/SMS alert:', wsError);
      }
    } else {
      console.log('[EMERGENCY ALERT] No emergency phone registered for patient');
    }

    // 5. Notify patient via FCM
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
}, { roles: ['patient', 'delivery_driver'] });
