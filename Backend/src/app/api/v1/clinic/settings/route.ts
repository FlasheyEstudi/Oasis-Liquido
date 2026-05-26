import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    let clinicId = req.user.clinicId;

    // Super admin can request for a specific clinic
    if (req.user.role === 'admin') {
      clinicId = searchParams.get('clinicId') || clinicId;
    }

    if (!clinicId) {
      // Find clinic by owner
      const clinic = await db.clinic.findFirst({
        where: { ownerId: req.user.userId },
      });
      clinicId = clinic?.id;
    }

    if (!clinicId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'No se encontró clínica asociada para este usuario', 400);
    }

    let settings = await db.clinicSettings.findUnique({
      where: { clinicId },
    });

    if (!settings) {
      settings = await db.clinicSettings.create({
        data: {
          clinicId,
          baseConsultationFee: 0.0,
          taxRate: 0.15,
          defaultPermissions: ['view_health_data', 'buy_medicines', 'schedule_appointments'],
          notificationPrefs: {
            allowOnlineBooking: true,
            preBookingDaysLimit: 30,
            cancellationHoursLimit: 24,
            sendAutomaticReminders: true,
            reminderChannel: 'email',
            doctorBreakTimeMinutes: 15,
          },
          insurancePartners: [],
          hoursOfOperation: {},
        },
      });
    }

    const prefs = (settings.notificationPrefs as Record<string, any>) || {};

    return successResponse({
      id: settings.id,
      clinicId: settings.clinicId,
      // Map baseConsultationFee to consultationFeeDefault
      consultationFeeDefault: settings.baseConsultationFee,
      // Map custom settings stored in notificationPrefs
      allowOnlineBooking: prefs.allowOnlineBooking ?? true,
      preBookingDaysLimit: prefs.preBookingDaysLimit ?? 30,
      cancellationHoursLimit: prefs.cancellationHoursLimit ?? 24,
      sendAutomaticReminders: prefs.sendAutomaticReminders ?? true,
      reminderChannel: prefs.reminderChannel || 'email',
      doctorBreakTimeMinutes: prefs.doctorBreakTimeMinutes ?? 15,
      // original fields for backward compatibility
      baseConsultationFee: settings.baseConsultationFee,
      taxRate: settings.taxRate,
      defaultPermissions: settings.defaultPermissions,
      notificationPrefs: settings.notificationPrefs,
      insurancePartners: settings.insurancePartners,
      hoursOfOperation: settings.hoursOfOperation,
    });
  } catch (error: any) {
    console.error('Error fetching clinic settings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener la configuración de la clínica', 500);
  }
}, { roles: ['clinic_admin', 'admin'] });

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    let clinicId = req.user.clinicId;

    if (req.user.role === 'admin') {
      clinicId = searchParams.get('clinicId') || clinicId;
    }

    if (!clinicId) {
      const clinic = await db.clinic.findFirst({
        where: { ownerId: req.user.userId },
      });
      clinicId = clinic?.id;
    }

    if (!clinicId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'No se encontró clínica asociada', 400);
    }

    const body = await req.json();
    const {
      baseConsultationFee,
      consultationFeeDefault,
      allowOnlineBooking,
      preBookingDaysLimit,
      cancellationHoursLimit,
      sendAutomaticReminders,
      reminderChannel,
      doctorBreakTimeMinutes,
      taxRate,
      defaultPermissions,
      notificationPrefs,
      insurancePartners,
      hoursOfOperation,
    } = body;

    // Load existing settings first to preserve other JSON properties
    let currentSettings = await db.clinicSettings.findUnique({
      where: { clinicId },
    });

    const currentPrefs = (currentSettings?.notificationPrefs as Record<string, any>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      ...(notificationPrefs || {}),
    };

    if (allowOnlineBooking !== undefined) updatedPrefs.allowOnlineBooking = allowOnlineBooking;
    if (preBookingDaysLimit !== undefined) updatedPrefs.preBookingDaysLimit = parseInt(preBookingDaysLimit, 10);
    if (cancellationHoursLimit !== undefined) updatedPrefs.cancellationHoursLimit = parseInt(cancellationHoursLimit, 10);
    if (sendAutomaticReminders !== undefined) updatedPrefs.sendAutomaticReminders = sendAutomaticReminders;
    if (reminderChannel !== undefined) updatedPrefs.reminderChannel = reminderChannel;
    if (doctorBreakTimeMinutes !== undefined) updatedPrefs.doctorBreakTimeMinutes = parseInt(doctorBreakTimeMinutes, 10);

    // Map consultationFeeDefault or baseConsultationFee
    const fee = baseConsultationFee !== undefined 
      ? parseFloat(baseConsultationFee) 
      : (consultationFeeDefault !== undefined ? parseFloat(consultationFeeDefault) : undefined);

    const settings = await db.clinicSettings.upsert({
      where: { clinicId },
      update: {
        baseConsultationFee: fee,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : undefined,
        defaultPermissions: defaultPermissions !== undefined ? defaultPermissions : undefined,
        notificationPrefs: updatedPrefs,
        insurancePartners: insurancePartners !== undefined ? insurancePartners : undefined,
        hoursOfOperation: hoursOfOperation !== undefined ? hoursOfOperation : undefined,
      },
      create: {
        clinicId,
        baseConsultationFee: fee || 0.0,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0.15,
        defaultPermissions: defaultPermissions || ['view_health_data', 'buy_medicines', 'schedule_appointments'],
        notificationPrefs: updatedPrefs,
        insurancePartners: insurancePartners || [],
        hoursOfOperation: hoursOfOperation || {},
      },
    });

    return successResponse({
      id: settings.id,
      clinicId: settings.clinicId,
      consultationFeeDefault: settings.baseConsultationFee,
      allowOnlineBooking: updatedPrefs.allowOnlineBooking ?? true,
      preBookingDaysLimit: updatedPrefs.preBookingDaysLimit ?? 30,
      cancellationHoursLimit: updatedPrefs.cancellationHoursLimit ?? 24,
      sendAutomaticReminders: updatedPrefs.sendAutomaticReminders ?? true,
      reminderChannel: updatedPrefs.reminderChannel || 'email',
      doctorBreakTimeMinutes: updatedPrefs.doctorBreakTimeMinutes ?? 15,
      baseConsultationFee: settings.baseConsultationFee,
      taxRate: settings.taxRate,
      defaultPermissions: settings.defaultPermissions,
      notificationPrefs: settings.notificationPrefs,
      insurancePartners: settings.insurancePartners,
      hoursOfOperation: settings.hoursOfOperation,
    });
  } catch (error: any) {
    console.error('Error updating clinic settings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar la configuración de la clínica', 500);
  }
}, { roles: ['clinic_admin', 'admin'] });
