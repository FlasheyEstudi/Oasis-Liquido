import { db } from '../db';
import { createAuditLog } from './audit.service';
import fs from 'fs';
import path from 'path';

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

    return {
      doctorDocuments: doctorDocs,
      clinicDocuments: clinicDocs,
      totalPending: doctorDocs.length + clinicDocs.length
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

    return {
      expiringDoctorDocuments: doctorDocs,
      expiringClinicDocuments: clinicDocs
    };
  }
}
