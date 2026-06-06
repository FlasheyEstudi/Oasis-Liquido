import { db } from '../db';
import { createAuditLog } from './audit.service';
import { ReminderService } from './reminder.service';

export class CronService {
  /**
   * Run hourly check of medication adherence reminders and send push notifications.
   */
  static async checkMedicationReminders() {
    console.log('[CronService] Starting medication reminders check...');
    const count = await ReminderService.sendRemindersForCurrentHour();
    console.log(`[CronService] Medication reminders check completed. Sent ${count} notifications.`);
    return count;
  }
  /**
   * Run daily check of legal document expirations (MINSA, RUC, municipal license, degree, etc.)
   * and automatically suspend establishment visibility or user verification status.
   */
  static async checkExpirations() {
    console.log('[CronService] Starting daily document expiration check...');
    const now = new Date();

    // 1. Process Doctor/User Document Expirations
    const expiredDoctorDocs = await db.doctorDocument.findMany({
      where: {
        status: 'approved',
        expiryDate: { lt: now },
      },
    });

    for (const doc of expiredDoctorDocs) {
      await db.$transaction(async (tx) => {
        // Mark document as expired
        await tx.doctorDocument.update({
          where: { id: doc.id },
          data: { status: 'expired' },
        });

        // Check if doctor has any remaining approved license/degree
        const activeDocs = await tx.doctorDocument.count({
          where: {
            doctorId: doc.doctorId,
            status: 'approved',
            type: doc.type,
          },
        });

        if (activeDocs === 0) {
          // Suspend doctor's verification status
          await tx.user.update({
            where: { id: doc.doctorId },
            data: { verificationStatus: 'pending' },
          });

          await createAuditLog({
            userId: doc.doctorId,
            action: 'USER_SUSPENDED_BY_CRON',
            entityType: 'user',
            entityId: doc.doctorId,
            details: `Doctor document ${doc.type} expired. Verification status set to pending.`,
          }, tx);
        }
      });
    }

    // 2. Process Clinic Document Expirations
    const expiredClinicDocs = await db.clinicDocument.findMany({
      where: {
        status: 'approved',
        expiryDate: { lt: now },
      },
    });

    for (const doc of expiredClinicDocs) {
      await db.$transaction(async (tx) => {
        await tx.clinicDocument.update({
          where: { id: doc.id },
          data: { status: 'expired' },
        });

        // If it's a critical MINSA or RUC document, suspend visibility
        if (doc.type === 'ruc' || doc.type === 'minsa_certificate' || doc.type === 'sanitary_permit') {
          await tx.clinic.update({
            where: { id: doc.clinicId },
            data: { isActive: false },
          });

          await createAuditLog({
            userId: doc.uploadedBy,
            action: 'CLINIC_SUSPENDED_BY_CRON',
            entityType: 'clinic',
            entityId: doc.clinicId,
            details: `Clinic document ${doc.type} expired. Clinic visibility disabled.`,
          }, tx);
        }
      });
    }

    // 3. Process Pharmacy Document Expirations
    const expiredPharmacyDocs = await db.pharmacyDocument.findMany({
      where: {
        status: 'approved',
        expiryDate: { lt: now },
      },
    });

    for (const doc of expiredPharmacyDocs) {
      await db.$transaction(async (tx) => {
        await tx.pharmacyDocument.update({
          where: { id: doc.id },
          data: { status: 'expired' },
        });

        // If it's a critical MINSA or RUC document, suspend visibility
        if (doc.type === 'ruc' || doc.type === 'minsa_certificate' || doc.type === 'sanitary_permit') {
          await tx.pharmacy.update({
            where: { id: doc.pharmacyId },
            data: { isActive: false },
          });

          await createAuditLog({
            userId: doc.uploadedBy,
            action: 'PHARMACY_SUSPENDED_BY_CRON',
            entityType: 'pharmacy',
            entityId: doc.pharmacyId,
            details: `Pharmacy document ${doc.type} expired. Pharmacy visibility disabled.`,
          }, tx);
        }
      });
    }

    console.log('[CronService] Daily document expiration check completed.');
  }
}
