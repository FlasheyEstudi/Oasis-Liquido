import { db } from '../db';
import { createAuditLog } from './audit.service';
import { getStorageProvider } from '../storage/provider';
import fs from 'fs';
import path from 'path';
import { notifyDocumentUploaded, notifyDoctorDocumentStatus } from './event-notifications';

export interface DocumentUploadInput {
  type: string;
  documentUrl: string;
  expiryDate?: Date;
  notes?: string;
}

export class DocumentService {
  /**
   * Upload and register a doctor document
   */
  static async uploadDoctorDocument(doctorId: string, input: DocumentUploadInput, ipAddress?: string, userAgent?: string) {
    // Verify doctor exists
    const doctor = await db.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true }
    });

    if (!doctor || doctor.role !== 'doctor') {
      throw new Error('DOCTOR_NOT_FOUND');
    }

    const document = await db.doctorDocument.create({
      data: {
        doctorId,
        type: input.type,
        documentUrl: input.documentUrl,
        expiryDate: input.expiryDate,
        status: 'pending',
        notes: input.notes,
      }
    });

    // Update overall verification status to submitted
    await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: 'submitted' }
    });

    await createAuditLog({
      userId: doctorId,
      action: 'create',
      entityType: 'doctor_document',
      entityId: document.id,
      details: JSON.stringify({ action: 'upload_document', type: input.type }),
      ipAddress,
      userAgent
    });

    // Notify super admins
    notifyDocumentUploaded(doctorId, doctor.name || 'Médico', 'doctor').catch(err => console.error(err));

    return document;
  }

  /**
   * Upload and register a clinic document
   */
  static async uploadClinicDocument(clinicId: string, uploadedBy: string, input: DocumentUploadInput, ipAddress?: string, userAgent?: string) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      throw new Error('CLINIC_NOT_FOUND');
    }

    const document = await db.clinicDocument.create({
      data: {
        clinicId,
        uploadedBy,
        type: input.type,
        documentUrl: input.documentUrl,
        expiryDate: input.expiryDate,
        status: 'pending',
        notes: input.notes,
      }
    });

    // Mark clinic owner/admin verification deadline and status if needed
    const owner = await db.user.findFirst({
      where: { id: clinic.ownerId || '' }
    });

    if (owner) {
      await db.user.update({
        where: { id: owner.id },
        data: { verificationStatus: 'submitted' }
      });
    }

    await createAuditLog({
      userId: uploadedBy,
      action: 'create',
      entityType: 'clinic_document',
      entityId: document.id,
      details: JSON.stringify({ action: 'upload_document', clinicId, type: input.type }),
      ipAddress,
      userAgent
    });

    // Notify super admins
    notifyDocumentUploaded(uploadedBy, clinic.name || 'Clínica', 'clinic').catch(err => console.error(err));

    return document;
  }

  /**
   * Upload and register a pharmacy document
   */
  static async uploadPharmacyDocument(pharmacyId: string, uploadedBy: string, input: DocumentUploadInput, ipAddress?: string, userAgent?: string) {
    const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) {
      throw new Error('PHARMACY_NOT_FOUND');
    }

    const document = await db.pharmacyDocument.create({
      data: {
        pharmacyId,
        uploadedBy,
        type: input.type,
        documentUrl: input.documentUrl,
        expiryDate: input.expiryDate,
        status: 'pending',
        notes: input.notes,
      }
    });

    // Mark pharmacy owner/admin verification deadline and status if needed
    const owner = await db.user.findFirst({
      where: { id: pharmacy.ownerId || '' }
    });

    if (owner) {
      await db.user.update({
        where: { id: owner.id },
        data: { verificationStatus: 'submitted' }
      });
    }

    await createAuditLog({
      userId: uploadedBy,
      action: 'create',
      entityType: 'pharmacy_document',
      entityId: document.id,
      details: JSON.stringify({ action: 'upload_document', pharmacyId, type: input.type }),
      ipAddress,
      userAgent
    });

    // Notify super admins
    notifyDocumentUploaded(uploadedBy, pharmacy.name || 'Farmacia', 'pharmacy').catch(err => console.error(err));

    return document;
  }

  /**
   * Get all pending documents for superadmin dashboard
   */
  static async getPendingDocuments() {
    const doctorDocs = await db.doctorDocument.findMany({
      where: { status: 'pending' },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            doctorProfile: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const clinicDocs = await db.clinicDocument.findMany({
      where: { status: 'pending' },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pharmacyDocs = await db.pharmacyDocument.findMany({
      where: { status: 'pending' },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const storage = getStorageProvider();

    // Map and generate presigned URLs for each document to protect backend access
    const doctorDocsWithUrls = await Promise.all(
      doctorDocs.map(async (doc) => ({
        ...doc,
        documentUrl: await storage.getPresignedUrl(doc.documentUrl, 900),
      }))
    );

    const clinicDocsWithUrls = await Promise.all(
      clinicDocs.map(async (doc) => ({
        ...doc,
        documentUrl: await storage.getPresignedUrl(doc.documentUrl, 900),
      }))
    );

    const pharmacyDocsWithUrls = await Promise.all(
      pharmacyDocs.map(async (doc) => ({
        ...doc,
        documentUrl: await storage.getPresignedUrl(doc.documentUrl, 900),
      }))
    );

    return {
      doctorDocuments: doctorDocsWithUrls,
      clinicDocuments: clinicDocsWithUrls,
      pharmacyDocuments: pharmacyDocsWithUrls,
      totalPending: doctorDocs.length + clinicDocs.length + pharmacyDocs.length
    };
  }

  /**
   * Verify (approve or reject) a doctor document
   */
  static async verifyDoctorDocument(
    documentId: string,
    verifierId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const doc = await db.doctorDocument.findUnique({
      where: { id: documentId }
    });

    if (!doc) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const updatedDoc = await db.doctorDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
      }
    });

    // Check all doctor documents status
    const allDocs = await db.doctorDocument.findMany({
      where: { doctorId: doc.doctorId }
    });

    const pendingCount = allDocs.filter(d => d.status === 'pending').length;
    const rejectedCount = allDocs.filter(d => d.status === 'rejected').length;

    let userVerificationStatus = 'submitted';
    if (rejectedCount > 0) {
      userVerificationStatus = 'rejected';
    } else if (pendingCount === 0 && allDocs.length >= 3) {
      // Assuming minimum 3 essential documents are approved
      userVerificationStatus = 'approved';
    }

    await db.user.update({
      where: { id: doc.doctorId },
      data: { verificationStatus: userVerificationStatus }
    });

    await createAuditLog({
      userId: verifierId,
      action: 'update',
      entityType: 'doctor_document',
      entityId: documentId,
      details: JSON.stringify({ action: 'verify_document', status, rejectionReason }),
      ipAddress,
      userAgent
    });

    // Notify doctor
    notifyDoctorDocumentStatus(doc.doctorId, doc.type, status, rejectionReason || undefined).catch(err => console.error(err));

    return updatedDoc;
  }

  /**
   * Verify (approve or reject) a clinic document
   */
  static async verifyClinicDocument(
    documentId: string,
    verifierId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const doc = await db.clinicDocument.findUnique({
      where: { id: documentId },
      include: { clinic: true }
    });

    if (!doc) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const updatedDoc = await db.clinicDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
      }
    });

    // If clinic owner/admin exists, update overall user verification
    if (doc.clinic.ownerId) {
      const allDocs = await db.clinicDocument.findMany({
        where: { clinicId: doc.clinicId }
      });

      const pendingCount = allDocs.filter(d => d.status === 'pending').length;
      const rejectedCount = allDocs.filter(d => d.status === 'rejected').length;

      let userVerificationStatus = 'submitted';
      if (rejectedCount > 0) {
        userVerificationStatus = 'rejected';
      } else if (pendingCount === 0 && allDocs.length >= 2) {
        userVerificationStatus = 'approved';
      }

      await db.user.update({
        where: { id: doc.clinic.ownerId },
        data: { verificationStatus: userVerificationStatus }
      });
    }

    await createAuditLog({
      userId: verifierId,
      action: 'update',
      entityType: 'clinic_document',
      entityId: documentId,
      details: JSON.stringify({ action: 'verify_document', status, rejectionReason }),
      ipAddress,
      userAgent
    });

    // Notify clinic owner
    if (doc.clinic.ownerId) {
      const { NotificationService } = require('./notification.service');
      NotificationService.createNotification({
        userId: doc.clinic.ownerId,
        title: status === 'approved' ? '✅ Documento de Clínica Aprobado' : '❌ Documento de Clínica Rechazado',
        body: status === 'approved'
          ? `El documento de tu clínica "${doc.type}" ha sido verificado y aprobado.`
          : `El documento de tu clínica "${doc.type}" ha sido rechazado. Motivo: ${rejectionReason || 'No especificado'}.`,
        type: 'document_verification',
        link: 'manage-clinics',
      }).catch((err: any) => console.error(err));
    }

    return updatedDoc;
  }

  /**
   * Verify (approve or reject) a pharmacy document
   */
  static async verifyPharmacyDocument(
    documentId: string,
    verifierId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const doc = await db.pharmacyDocument.findUnique({
      where: { id: documentId },
      include: { pharmacy: true }
    });

    if (!doc) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const updatedDoc = await db.pharmacyDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
      }
    });

    // If pharmacy owner/admin exists, update overall user verification
    if (doc.pharmacy.ownerId) {
      const allDocs = await db.pharmacyDocument.findMany({
        where: { pharmacyId: doc.pharmacyId }
      });

      const pendingCount = allDocs.filter(d => d.status === 'pending').length;
      const rejectedCount = allDocs.filter(d => d.status === 'rejected').length;

      let userVerificationStatus = 'submitted';
      if (rejectedCount > 0) {
        userVerificationStatus = 'rejected';
      } else if (pendingCount === 0 && allDocs.length >= 2) {
        userVerificationStatus = 'approved';
      }

      await db.user.update({
        where: { id: doc.pharmacy.ownerId },
        data: { verificationStatus: userVerificationStatus }
      });
    }

    await createAuditLog({
      userId: verifierId,
      action: 'update',
      entityType: 'pharmacy_document',
      entityId: documentId,
      details: JSON.stringify({ action: 'verify_document', status, rejectionReason }),
      ipAddress,
      userAgent
    });

    // Notify pharmacy owner
    if (doc.pharmacy.ownerId) {
      const { NotificationService } = require('./notification.service');
      NotificationService.createNotification({
        userId: doc.pharmacy.ownerId,
        title: status === 'approved' ? '✅ Documento de Farmacia Aprobado' : '❌ Documento de Farmacia Rechazado',
        body: status === 'approved'
          ? `El documento de tu farmacia "${doc.type}" ha sido verificado y aprobado.`
          : `El documento de tu farmacia "${doc.type}" ha sido rechazado. Motivo: ${rejectionReason || 'No especificado'}.`,
        type: 'document_verification',
        link: 'manage-pharmacies',
      }).catch((err: any) => console.error(err));
    }

    return updatedDoc;
  }

  /**
   * Track upcoming expirations (notifying 30 days before)
   */
  static async getExpiringDocuments() {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const today = new Date();

    const doctorDocs = await db.doctorDocument.findMany({
      where: {
        status: 'approved',
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const clinicDocs = await db.clinicDocument.findMany({
      where: {
        status: 'approved',
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const pharmacyDocs = await db.pharmacyDocument.findMany({
      where: {
        status: 'approved',
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return {
      expiringDoctorDocuments: doctorDocs,
      expiringClinicDocuments: clinicDocs,
      expiringPharmacyDocuments: pharmacyDocs
    };
  }
}
