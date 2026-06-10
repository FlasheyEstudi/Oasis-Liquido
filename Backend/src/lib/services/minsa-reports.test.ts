import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';
import { verifyAccessToken } from '../auth/jwt';
import { GET as getPharmacyReport } from '../../app/api/v1/pharmacies/[id]/reports/route';
import { GET as getClinicReport } from '../../app/api/v1/clinics/[id]/reports/route';
import { NextRequest } from 'next/server';

vi.mock('../db', () => ({
  db: {
    clinic: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    pharmacy: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
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
    sale: {
      findMany: vi.fn(),
    },
    prescription: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../auth/jwt', () => ({
  verifyAccessToken: vi.fn(),
}));

describe('Oasis Líquida - MINSA Compliance Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pharmacy MINSA Compliance Report', () => {
    it('should query controlled substance sales and format them correctly', async () => {
      // Mock auth payload
      vi.mocked(verifyAccessToken).mockReturnValue({
        userId: 'mgr-1',
        email: 'mgr@pharmacy.com',
        role: 'pharmacy_manager',
      });

      // Mock facility access verification
      vi.mocked(db.pharmacyManagerProfile.findUnique).mockResolvedValue({
        userId: 'mgr-1',
        pharmacyId: 'pharmacy-123',
      } as any);

      // Mock database sales response
      const mockSales = [
        {
          id: 'sale-1',
          createdAt: new Date('2026-06-09T12:00:00Z'),
          prescriptionId: 'pres-1',
          patientId: 'patient-1',
          patient: {
            id: 'patient-1',
            name: 'Juan Perez',
            email: 'juan@test.com',
            phone: '+50588888888',
          },
          prescription: {
            id: 'pres-1',
            digitalSignature: 'hash-signature-123',
            qrCode: 'qr-123',
            doctor: {
              name: 'Dr. Hector Zelaya',
              doctorProfile: {
                licenseNumber: 'MINSA-12345',
              },
            },
            clinic: {
              name: 'Clinica Metropolitana',
            },
          },
          saleItems: [
            {
              medicineId: 'med-1',
              quantity: 2,
              unitPrice: 150,
              medicine: {
                id: 'med-1',
                name: 'Diazepam 10mg',
                genericName: 'Diazepam',
                controlType: 'CONTROLLED_PSYCHOTROPIC',
                concentration: '10mg',
              },
            },
          ],
        },
      ];

      vi.mocked(db.sale.findMany).mockResolvedValue(mockSales as any);

      // Call handler
      const req = new NextRequest(
        'http://localhost/api/v1/pharmacies/pharmacy-123/reports?type=minsa_compliance',
        {
          headers: {
            authorization: 'Bearer valid-token',
          },
        }
      );

      const response = await getPharmacyReport(req, {
        params: Promise.resolve({ id: 'pharmacy-123' }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data.totals.totalDispensations).toBe(1);
      expect(body.data.totals.psychotropicsCount).toBe(2);
      expect(body.data.totals.narcoticsCount).toBe(0);
      expect(body.data.totals.withoutPrescriptionViolations).toBe(0);

      expect(body.data.records[0]).toEqual(
        expect.objectContaining({
          id: 'sale-1',
          patientName: 'Juan Perez',
          hasPrescription: true,
          doctorName: 'Dr. Hector Zelaya',
          doctorLicense: 'MINSA-12345',
          clinicName: 'Clinica Metropolitana',
          digitalSignature: 'Firmada Digitalmente',
        })
      );
    });
  });

  describe('Clinic MINSA Compliance Report', () => {
    it('should query prescribed controlled substances and format them correctly', async () => {
      // Mock auth payload
      vi.mocked(verifyAccessToken).mockReturnValue({
        userId: 'admin-1',
        email: 'admin@clinic.com',
        role: 'clinic_admin',
      });

      // Mock facility access verification
      vi.mocked(db.clinic.findUnique).mockResolvedValue({
        id: 'clinic-123',
        ownerId: 'admin-1',
        name: 'Clinica Metropolitana',
      } as any);

      // Mock database prescriptions response
      const mockPrescriptions = [
        {
          id: 'pres-1',
          issuedAt: new Date('2026-06-09T10:00:00Z'),
          status: 'fulfilled',
          qrCode: 'qr-123',
          digitalSignature: 'sig-abc',
          patient: {
            id: 'patient-1',
            name: 'Juan Perez',
            email: 'juan@test.com',
            phone: '+50588888888',
          },
          doctor: {
            name: 'Dr. Hector Zelaya',
            doctorProfile: {
              licenseNumber: 'MINSA-12345',
            },
          },
          fulfilledPharmacy: {
            name: 'Farmacia La Vida',
          },
          prescriptionLines: [
            {
              medicineId: 'med-2',
              quantity: 1,
              quantityFulfilled: 1,
              dosageInstructions: '1 tableta cada noche',
              medicine: {
                id: 'med-2',
                name: 'Morfina 10mg',
                genericName: 'Morfina',
                controlType: 'CONTROLLED_NARCOTIC',
                concentration: '10mg',
              },
            },
          ],
        },
      ];

      vi.mocked(db.prescription.findMany).mockResolvedValue(mockPrescriptions as any);

      // Call handler
      const req = new NextRequest(
        'http://localhost/api/v1/clinics/clinic-123/reports?type=minsa_compliance',
        {
          headers: {
            authorization: 'Bearer valid-token',
          },
        }
      );

      const response = await getClinicReport(req, {
        params: Promise.resolve({ id: 'clinic-123' }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.totals.totalPrescriptionsIssued).toBe(1);
      expect(body.data.totals.psychotropicsCount).toBe(0);
      expect(body.data.totals.narcoticsCount).toBe(1);
      expect(body.data.totals.fulfilledCount).toBe(1);

      expect(body.data.records[0]).toEqual(
        expect.objectContaining({
          id: 'pres-1',
          patientName: 'Juan Perez',
          doctorName: 'Dr. Hector Zelaya',
          doctorLicense: 'MINSA-12345',
          digitalSignature: 'Firmada Digitalmente',
          status: 'fulfilled',
          fulfilledPharmacyName: 'Farmacia La Vida',
        })
      );
    });
  });
});
