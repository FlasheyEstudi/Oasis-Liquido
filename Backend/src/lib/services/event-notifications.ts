import { NotificationService } from './notification.service';
import { db } from '@/lib/db';

// Helpers to get all staff for multi-tenant notifications
async function getPharmacyStaff(pharmacyId: string): Promise<string[]> {
  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { ownerId: true }
    });
    
    const workers = (await db.user.findMany({
      where: {
        pharmacyManagerProfile: { pharmacyId }
      },
      select: { id: true }
    })) || [];

    const ids = new Set<string>();
    if (pharmacy?.ownerId) ids.add(pharmacy.ownerId);
    workers.forEach(w => ids.add(w.id));
    return Array.from(ids);
  } catch (error) {
    console.error('Error fetching pharmacy staff:', error);
    return [];
  }
}

async function getClinicStaff(clinicId: string): Promise<string[]> {
  try {
    const clinic = await db.clinic.findUnique({
      where: { id: clinicId },
      select: { ownerId: true }
    });
    
    const workers = (await db.user.findMany({
      where: {
        OR: [
          { receptionistProfile: { clinicId } },
          { doctorProfile: { clinicId } }
        ]
      },
      select: { id: true }
    })) || [];

    const ids = new Set<string>();
    if (clinic?.ownerId) ids.add(clinic.ownerId);
    workers.forEach(w => ids.add(w.id));
    return Array.from(ids);
  } catch (error) {
    console.error('Error fetching clinic staff:', error);
    return [];
  }
}

// ============================================
// SUPER ADMIN NOTIFICATIONS
// ============================================

export async function notifyDocumentUploaded(uploaderId: string, uploaderName: string, entityType: string) {
  try {
    const admins = await db.user.findMany({ where: { role: 'admin' } });
    for (const admin of admins) {
      await NotificationService.createNotification({
        userId: admin.id,
        title: '🔔 Documento pendiente de revisión',
        body: `Se ha subido un nuevo documento de ${entityType === 'doctor' ? 'Dr.' : entityType === 'clinic' ? 'Clínica' : 'Farmacia'} ${uploaderName} pendiente de verificación.`,
        type: 'document_pending',
        link: 'manage-documents',
      });
    }
  } catch (error) {
    console.error('Error in notifyDocumentUploaded:', error);
  }
}

// ============================================
// CLINIC ADMIN NOTIFICATIONS
// ============================================

export async function notifyInvitationAccepted(clinicId: string, workerName: string, role: string) {
  try {
    const staffIds = await getClinicStaff(clinicId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '✅ Invitación Aceptada',
        body: `El ${role === 'doctor' ? 'médico' : 'recepcionista'} ${workerName} ha aceptado tu invitación y se ha unido al personal.`,
        type: 'invitation_accepted',
        link: 'clinic-staff',
      });
    }
  } catch (error) {
    console.error('Error in notifyInvitationAccepted:', error);
  }
}

export async function notifyAppointmentCreatedForClinic(clinicId: string, patientName: string, doctorName: string, dateStr: string) {
  try {
    const staffIds = await getClinicStaff(clinicId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '📅 Nueva Cita Agendada',
        body: `El paciente ${patientName} ha agendado una cita con el Dr. ${doctorName} para el ${dateStr}.`,
        type: 'appointment_created',
        link: 'appointments',
      });
    }
  } catch (error) {
    console.error('Error in notifyAppointmentCreatedForClinic:', error);
  }
}

export async function notifyAppointmentCanceledForClinic(clinicId: string, patientName: string, doctorName: string, dateStr: string) {
  try {
    const staffIds = await getClinicStaff(clinicId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '❌ Cita Cancelada',
        body: `El paciente ${patientName} ha cancelado su cita con el Dr. ${doctorName} del ${dateStr}.`,
        type: 'appointment_canceled',
        link: 'appointments',
      });
    }
  } catch (error) {
    console.error('Error in notifyAppointmentCanceledForClinic:', error);
  }
}

// ============================================
// PHARMACY ADMIN NOTIFICATIONS
// ============================================

export async function notifyPharmacyInvitationAccepted(pharmacyId: string, workerName: string, role: string) {
  try {
    const staffIds = await getPharmacyStaff(pharmacyId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '✅ Invitación Aceptada',
        body: `El ${role === 'delivery_driver' ? 'repartidor' : 'cajero'} ${workerName} ha aceptado tu invitación y se ha unido al personal.`,
        type: 'invitation_accepted',
        link: 'pharmacy-staff',
      });
    }
  } catch (error) {
    console.error('Error in notifyPharmacyInvitationAccepted:', error);
  }
}

export async function notifyNewOrderReceived(pharmacyId: string, orderNumber: string, amount: number) {
  try {
    const staffIds = await getPharmacyStaff(pharmacyId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '🛍️ Nuevo Pedido Recibido',
        body: `Has recibido el pedido #${orderNumber} por un monto de C$${amount.toFixed(2)}.`,
        type: 'new_order',
        link: 'order-management',
      });
    }
  } catch (error) {
    console.error('Error in notifyNewOrderReceived:', error);
  }
}

export async function notifyLowStockAlert(pharmacyId: string, medicineName: string, currentStock: number) {
  try {
    const staffIds = await getPharmacyStaff(pharmacyId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '⚠️ Alerta de Inventario Bajo',
        body: `El medicamento ${medicineName} tiene un nivel crítico de stock (${currentStock} unidades).`,
        type: 'low_stock',
        link: 'inventory',
      });
    }
  } catch (error) {
    console.error('Error in notifyLowStockAlert:', error);
  }
}

export async function notifyExpiryAlert(pharmacyId: string, medicineName: string, batchNumber: string, expiryDateStr: string) {
  try {
    const staffIds = await getPharmacyStaff(pharmacyId);
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '⏳ Medicamento Próximo a Vencer',
        body: `El lote ${batchNumber} de ${medicineName} vence el ${expiryDateStr}.`,
        type: 'expiry_alert',
        link: 'inventory',
      });
    }
  } catch (error) {
    console.error('Error in notifyExpiryAlert:', error);
  }
}

// ============================================
// DOCTOR NOTIFICATIONS
// ============================================

export async function notifyAppointmentBookedForDoctor(doctorId: string, patientName: string, dateStr: string) {
  try {
    await NotificationService.createNotification({
      userId: doctorId,
      title: '📅 Nueva Cita Reservada',
      body: `El paciente ${patientName} ha reservado una cita contigo para el ${dateStr}.`,
      type: 'appointment_booked',
      link: 'consultation',
    });
  } catch (error) {
    console.error('Error in notifyAppointmentBookedForDoctor:', error);
  }
}

export async function notifyAppointmentCanceledForDoctor(doctorId: string, patientName: string, dateStr: string) {
  try {
    await NotificationService.createNotification({
      userId: doctorId,
      title: '❌ Cita Cancelada por Paciente',
      body: `El paciente ${patientName} ha cancelado su cita del ${dateStr}.`,
      type: 'appointment_canceled',
      link: 'consultation',
    });
  } catch (error) {
    console.error('Error in notifyAppointmentCanceledForDoctor:', error);
  }
}

export async function notifyDoctorDocumentStatus(doctorId: string, type: string, status: string, reason?: string) {
  try {
    await NotificationService.createNotification({
      userId: doctorId,
      title: status === 'approved' ? '✅ Documento Aprobado' : '❌ Documento Rechazado',
      body: status === 'approved'
        ? `Tu documento legal "${type}" ha sido verificado y aprobado por un administrador.`
        : `Tu documento legal "${type}" ha sido rechazado. Motivo: ${reason || 'No especificado'}.`,
      type: 'document_verification',
      link: 'profile',
    });
  } catch (error) {
    console.error('Error in notifyDoctorDocumentStatus:', error);
  }
}

// ============================================
// RECEPTIONIST NOTIFICATIONS
// ============================================

export async function notifyPatientCheckIn(receptionistId: string, patientName: string, doctorName: string) {
  try {
    await NotificationService.createNotification({
      userId: receptionistId,
      title: '🙋‍♂️ Paciente en Sala de Espera',
      body: `El paciente ${patientName} ha confirmado su check-in para su cita con el Dr. ${doctorName}.`,
      type: 'patient_checkin',
      link: 'appointments',
    });
  } catch (error) {
    console.error('Error in notifyPatientCheckIn:', error);
  }
}

export async function notifyReceptionistsOfCheckIn(clinicId: string, patientName: string, doctorName: string) {
  try {
    const receptionists = await db.user.findMany({
      where: {
        role: 'receptionist',
        receptionistProfile: { clinicId },
      },
    });
    for (const receptionist of receptionists) {
      await notifyPatientCheckIn(receptionist.id, patientName, doctorName).catch(err => console.error(err));
    }
  } catch (error) {
    console.error('Error in notifyReceptionistsOfCheckIn:', error);
  }
}

// ============================================
// PATIENT NOTIFICATIONS
// ============================================

export async function notifyPrescriptionCreated(patientId: string, doctorName: string) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '📋 Nueva Receta Médica',
      body: `El Dr. ${doctorName} ha emitido una receta para ti.`,
      type: 'prescription',
      link: 'prescriptions',
    });
  } catch (error) {
    console.error('Error in notifyPrescriptionCreated:', error);
  }
}

export async function notifyOrderAccepted(patientId: string, driverName: string) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '✅ Pedido Aceptado',
      body: `${driverName} ha aceptado tu pedido y va en camino.`,
      type: 'delivery',
      link: 'order-tracking',
    });
  } catch (error) {
    console.error('Error in notifyOrderAccepted:', error);
  }
}

export async function notifyDriverNearby(patientId: string, minutesAway: number) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '🚗 Tu repartidor está cerca',
      body: `Tu pedido estará contigo en aproximadamente ${minutesAway} minutos.`,
      type: 'delivery',
      link: 'order-tracking',
    });
  } catch (error) {
    console.error('Error in notifyDriverNearby:', error);
  }
}

export async function notifyOrderDelivered(patientId: string) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '📦 Pedido Entregado',
      body: 'Tu pedido ha sido entregado. ¡Gracias por confiar en Oasis!',
      type: 'delivery',
      link: 'order-tracking',
    });
  } catch (error) {
    console.error('Error in notifyOrderDelivered:', error);
  }
}

export async function notifyMedicationReminder(patientId: string, medicineName: string) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '💊 Recordatorio de Medicación',
      body: `Es hora de tomar tu ${medicineName}`,
      type: 'medication',
      link: 'prescriptions',
    });
  } catch (error) {
    console.error('Error in notifyMedicationReminder:', error);
  }
}

export async function notifyAppointmentRescheduled(patientId: string, doctorName: string, newDateStr: string) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '📅 Cita Reagendada',
      body: `Tu cita con el Dr. ${doctorName} ha sido reagendada para el ${newDateStr}.`,
      type: 'appointment_rescheduled',
      link: 'appointments',
    });
  } catch (error) {
    console.error('Error in notifyAppointmentRescheduled:', error);
  }
}

export async function notifyPrescriptionFulfilled(patientId: string, pharmacyName: string) {
  try {
    await NotificationService.createNotification({
      userId: patientId,
      title: '💊 Receta Surtida',
      body: `Tu receta médica ha sido surtida exitosamente por la farmacia ${pharmacyName}.`,
      type: 'prescription_fulfilled',
      link: 'prescriptions',
    });
  } catch (error) {
    console.error('Error in notifyPrescriptionFulfilled:', error);
  }
}

export async function notifyDeliveryStatusChanged(patientId: string, orderNumber: string, newStatus: string) {
  try {
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      preparing: 'En preparación',
      in_transit: 'En camino / En tránsito',
      delivered: 'Entregado',
      canceled: 'Cancelado',
      failed: 'No entregado',
    };
    const label = statusLabels[newStatus] || newStatus;
    await NotificationService.createNotification({
      userId: patientId,
      title: '🚚 Estado de Entrega Actualizado',
      body: `Tu pedido #${orderNumber} ha cambiado al estado: ${label}.`,
      type: 'delivery_status',
      link: 'order-tracking',
    });
  } catch (error) {
    console.error('Error in notifyDeliveryStatusChanged:', error);
  }
}

export async function notifyPharmacyDeliveryStatus(pharmacyId: string, orderNumber: string, newStatus: string, driverName: string) {
  try {
    const statusLabels: Record<string, string> = {
      assigned: 'ha sido asignado al repartidor',
      picked_up: 'ha sido recolectado de la farmacia por',
      in_transit: 'ha iniciado ruta de entrega con',
      delivered: 'ha sido entregado exitosamente por',
      cancelled: 'ha sido cancelado con el repartidor',
      failed: 'ha reportado entrega fallida con',
    };
    const label = statusLabels[newStatus] || newStatus;
    const staffIds = await getPharmacyStaff(pharmacyId);
    
    for (const userId of staffIds) {
      await NotificationService.createNotification({
        userId,
        title: '🚚 Actualización de Reparto',
        body: `El pedido #${orderNumber} ${label} ${driverName}.`,
        type: 'pharmacy_delivery_status',
        link: 'order-management',
      });
    }
  } catch (error) {
    console.error('Error in notifyPharmacyDeliveryStatus:', error);
  }
}
