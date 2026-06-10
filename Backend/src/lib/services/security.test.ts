import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyFacilityAccess } from '../auth/access';
import { getAppointments, updateAppointmentStatus } from './appointment.service';
import { db } from '../db';

vi.mock('../db', () => ({
  db: {
    user: {
      findMany: vi.fn(),
    },
    clinic: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    pharmacy: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    doctorProfile: {
      findUnique: vi.fn(),
    },
    receptionistProfile: {
      findUnique: vi.fn(),
    },
    pharmacyManagerProfile: {
      findUnique: vi.fn(),
    },
    deliveryDriverProfile: {
      findUnique: vi.fn(),
    },
    familyRelationship: {
      findFirst: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    pushToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    createAuditLog: vi.fn(),
  },
}));

describe('Oasis Líquida - Access Control and Safety Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyFacilityAccess', () => {
    it('should grant full access to super admin', async () => {
      const hasAccess = await verifyFacilityAccess('admin-1', 'admin', 'clinic-123', 'clinic');
      expect(hasAccess).toBe(true);
    });

    it('should verify clinic_admin access to their clinic', async () => {
      vi.mocked(db.clinic.findUnique).mockResolvedValue({ id: 'clinic-123', ownerId: 'owner-1', name: 'Clinica' } as any);
      
      const hasAccess = await verifyFacilityAccess('owner-1', 'clinic_admin', 'clinic-123', 'clinic');
      expect(hasAccess).toBe(true);
      expect(db.clinic.findUnique).toHaveBeenCalledWith({ where: { id: 'clinic-123' } });
    });

    it('should deny clinic_admin access to clinics they do not own', async () => {
      vi.mocked(db.clinic.findUnique).mockResolvedValue({ id: 'clinic-123', ownerId: 'other-owner', name: 'Clinica' } as any);
      
      const hasAccess = await verifyFacilityAccess('owner-1', 'clinic_admin', 'clinic-123', 'clinic');
      expect(hasAccess).toBe(false);
    });

    it('should grant access to doctor in the same clinic', async () => {
      vi.mocked(db.doctorProfile.findUnique).mockResolvedValue({ userId: 'doc-1', clinicId: 'clinic-123' } as any);

      const hasAccess = await verifyFacilityAccess('doc-1', 'doctor', 'clinic-123', 'clinic');
      expect(hasAccess).toBe(true);
    });

    it('should deny access to doctor in a different clinic', async () => {
      vi.mocked(db.doctorProfile.findUnique).mockResolvedValue({ userId: 'doc-1', clinicId: 'clinic-different' } as any);

      const hasAccess = await verifyFacilityAccess('doc-1', 'doctor', 'clinic-123', 'clinic');
      expect(hasAccess).toBe(false);
    });
  });

  describe('getAppointments - Role filtering and containment', () => {
    it('should filter appointments by patientId when role is patient', async () => {
      vi.mocked(db.appointment.findMany).mockResolvedValue([]);
      vi.mocked(db.appointment.count).mockResolvedValue(0);

      await getAppointments({
        userId: 'patient-123',
        userRole: 'patient',
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(db.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: 'patient-123' }),
        })
      );
    });

    it('should filter appointments by clinicId when clinic_admin requests them', async () => {
      vi.mocked(db.clinic.findFirst).mockResolvedValue({ id: 'clinic-abc', ownerId: 'cadmin-1' } as any);
      vi.mocked(db.appointment.findMany).mockResolvedValue([]);
      vi.mocked(db.appointment.count).mockResolvedValue(0);

      await getAppointments({
        userId: 'cadmin-1',
        userRole: 'clinic_admin',
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(db.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clinicId: 'clinic-abc' }),
        })
      );
    });
  });

  describe('updateAppointmentStatus - IDOR and ownership checks', () => {
    it('should throw NOT_FOUND error if appointment does not exist', async () => {
      vi.mocked(db.appointment.findUnique).mockResolvedValue(null);

      await expect(
        updateAppointmentStatus('apt-123', 'confirmed', 'doctor', 'doc-1')
      ).rejects.toThrow('NOT_FOUND');
    });

    it('should allow patient to cancel their own appointment', async () => {
      vi.mocked(db.appointment.findUnique).mockResolvedValue({
        id: 'apt-1',
        patientId: 'patient-1',
        doctorId: 'doc-1',
        clinicId: 'clinic-1',
        status: 'scheduled',
      } as any);

      vi.mocked(db.appointment.update).mockResolvedValue({ id: 'apt-1', status: 'cancelled', dateTime: new Date() } as any);

      const result = await updateAppointmentStatus('apt-1', 'cancelled', 'patient', 'patient-1');
      expect(result.status).toBe('cancelled');
    });

    it('should deny patient from cancelling another patient\'s appointment', async () => {
      vi.mocked(db.appointment.findUnique).mockResolvedValue({
        id: 'apt-1',
        patientId: 'patient-someone-else',
        doctorId: 'doc-1',
        clinicId: 'clinic-1',
        status: 'scheduled',
      } as any);

      vi.mocked(db.familyRelationship.findFirst).mockResolvedValue(null);

      await expect(
        updateAppointmentStatus('apt-1', 'cancelled', 'patient', 'patient-attacker')
      ).rejects.toThrow('UNAUTHORIZED');
    });

    it('should allow caregiver to cancel patient\'s appointment', async () => {
      vi.mocked(db.appointment.findUnique).mockResolvedValue({
        id: 'apt-1',
        patientId: 'patient-child',
        doctorId: 'doc-1',
        clinicId: 'clinic-1',
        status: 'scheduled',
      } as any);

      vi.mocked(db.familyRelationship.findFirst).mockResolvedValue({ id: 'rel-1', status: 'active', isActive: true } as any);
      vi.mocked(db.appointment.update).mockResolvedValue({ id: 'apt-1', status: 'cancelled', dateTime: new Date() } as any);

      const result = await updateAppointmentStatus('apt-1', 'cancelled', 'patient', 'caregiver-parent');
      expect(result.status).toBe('cancelled');
      expect(db.familyRelationship.findFirst).toHaveBeenCalledWith({
        where: {
          caregiverId: 'caregiver-parent',
          patientId: 'patient-child',
          isActive: true,
          status: 'active',
        }
      });
    });
  });
});
