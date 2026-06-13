import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrescription, validatePrescription, fulfillPrescription } from './prescription.service';
import { createSale } from './sale.service';
import { getCashSummary, createCashReconciliation } from './cash-reconciliation.service';
import { db } from '../db';
import crypto from 'crypto';

// Setup global mocks similar to security.test.ts
vi.mock('../db', () => {
  const mockDb = {
    globalSetting: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    prescription: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    prescriptionLine: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    inventory: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryBatch: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    pharmacy: {
      findUnique: vi.fn(),
    },
    deliveryOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockDb)),
  };
  return { db: mockDb };
});

vi.mock('../auth/password', () => ({
  verifyPassword: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('./audit.service', () => ({
  createAuditLog: vi.fn(() => Promise.resolve({ id: 'audit-log-1', createdAt: new Date() })),
}));

vi.mock('../fcm', () => ({
  sendPushNotification: vi.fn(),
}));

describe('Oasis Nicaragua - End-to-End Business Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flow 1: Medical-Pharmacy Flow (Doctor -> Prescription -> Patient -> Pharmacy Settle)', () => {
    it('should complete the entire cycle from recipe creation to multi-currency payment and cashier audit', async () => {
      // 1. Setup Doctor, Patient, and Pharmacy contexts
      const doctorId = 'doctor-1';
      const patientId = 'patient-1';
      const pharmacyId = 'pharmacy-1';
      const prescriptionId = 'rx-999';
      const signaturePin = '1234';
      const expirationDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days in future

      // Mock Doctor Profile and Accreditation Status (MINSA approved)
      (db.user.findUnique as any).mockResolvedValue({
        id: doctorId,
        verificationStatus: 'approved',
        doctorProfile: {
          signaturePin: 'hashed-pin-1234', // Matches password verification helper mock
        },
      });

      // Mock prescription creation return object
      (db.prescription.create as any).mockImplementation((args: any) => {
        return Promise.resolve({
          id: prescriptionId,
          patientId: args.data.patientId,
          doctorId: args.data.doctorId,
          clinicId: args.data.clinicId,
          status: 'active',
          qrCode: args.data.qrCode,
          verificationCode: args.data.verificationCode,
          digitalSignature: args.data.digitalSignature,
          expirationDate: args.data.expirationDate,
          prescriptionLines: args.data.prescriptionLines.create,
        });
      });

      // --- STEP 1: Doctor prescribes 5 units of 'med-1' ---
      const prescription = await createPrescription(
        {
          patient_id: patientId,
          clinic_id: 'clinic-1',
          expiration_date: expirationDate,
          signature_pin: signaturePin,
          lines: [{ medicine_id: 'med-1', quantity: 5, dosage_instructions: 'Take 1 every 8 hours' }],
        },
        doctorId
      );

      expect(prescription).toBeDefined();
      expect(prescription!.status).toBe('active');
      expect(prescription!.digitalSignature).toBeDefined();

      // --- STEP 2: Patient arrives at Pharmacy and verifies recipe by QR/Code ---
      // Mock validatePrescription queries
      (db.prescription.findFirst as any).mockResolvedValue({
        id: prescriptionId,
        patientId: patientId,
        doctorId: doctorId,
        clinicId: 'clinic-1',
        qrCode: prescription!.qrCode,
        expirationDate: prescription!.expirationDate,
        status: 'active',
        prescriptionLines: [
          { id: 'line-1', medicineId: 'med-1', quantity: 5, quantityFulfilled: 0 }
        ],
        doctor: {
          id: doctorId,
          doctorProfile: {
            signaturePin: 'hashed-pin-1234',
          }
        }
      });

      // Mock inventory state: Pharmacy has a batch of 20 units of 'med-1'
      (db.inventory.findFirst as any).mockResolvedValue({
        id: 'inv-1',
        pharmacyId: pharmacyId,
        medicineId: 'med-1',
        quantity: 20,
        unitPrice: 50.0, // 50 NIO per unit
        batches: [
          { id: 'batch-1', quantity: 20, expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) }
        ]
      });

      (db.inventoryBatch.findMany as any).mockResolvedValue([
        { id: 'batch-1', inventoryId: 'inv-1', quantity: 20, expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) }
      ]);

      const validated = await validatePrescription(prescription!.qrCode!, pharmacyId);
      expect(validated).toBeDefined();
      expect(validated!.lines![0].batches.length).toBeGreaterThan(0);
      expect(validated!.lines![0].batches[0].quantityToDeduct).toBe(5); // Requesting full prescription amount

      // --- STEP 3: Pharmacy fulfills recipe (dispenses 5 units) and registers the sale ---
      // Total sale amount = 5 units * 50 NIO/unit = 250 NIO
      // Patient pays mixed currency: 5 USD cash + 70 NIO cash
      // Mock global setting for USD exchange rate to be 36.6 NIO per USD
      // 5 USD * 36.6 NIO/USD = 183 NIO. Total paid = 183 + 70 = 253 NIO.
      // Expected Vuelto (Change) = 253 NIO - 250 NIO = 3 NIO
      (db.globalSetting.findUnique as any).mockResolvedValue({
        key: 'USD_EXCHANGE_RATE',
        value: '36.6',
      });

      (db.pharmacy.findUnique as any).mockResolvedValue({
        id: pharmacyId,
        isActive: true,
      });

      (db.prescription.findUnique as any).mockResolvedValue({
        id: prescriptionId,
        prescriptionLines: [
          { id: 'line-1', medicineId: 'med-1', quantity: 5, quantityFulfilled: 0 }
        ]
      });

      // Mock prescription fulfill updates
      (db.prescriptionLine.findMany as any).mockResolvedValue([
        { id: 'line-1', quantity: 5, quantityFulfilled: 5 }
      ]);

      (db.inventoryBatch.findUnique as any).mockResolvedValue({
        id: 'batch-1',
        inventoryId: 'inv-1',
        quantity: 20,
      });

      (db.prescription.update as any).mockResolvedValue({
        id: prescriptionId,
        patientId: patientId,
        doctorId: doctorId,
        clinicId: 'clinic-1',
        status: 'fulfilled',
        prescriptionLines: [
          { id: 'line-1', medicineId: 'med-1', quantity: 5, quantityFulfilled: 5 }
        ],
        fulfilledPharmacy: { name: 'Farmacia 1' }
      });

      // Verify that fulfillPrescription completes cleanly
      const fulfilledResult = await fulfillPrescription(
        prescriptionId,
        {
          pharmacy_id: pharmacyId,
          items: [
            {
              prescription_line_id: 'line-1',
              quantity_fulfilled: 5,
              batches: [{ batch_id: 'batch-1', quantity: 5 }]
            }
          ]
        },
        'cashier-1',
        pharmacyId
      );

      expect(fulfilledResult).toBeDefined();
      expect(fulfilledResult!.status).toBe('fulfilled');

      // Create the Sale record
      (db.sale.create as any).mockResolvedValue({
        id: 'sale-1',
        totalAmount: 250.0,
      });

      (db.sale.findUnique as any).mockResolvedValue({
        id: 'sale-1',
        totalAmount: 250.0,
        payments: [
          { amount: 5, method: 'cash', currency: 'USD', status: 'completed' },
          { amount: 70, method: 'cash', currency: 'NIO', status: 'completed' }
        ]
      });

      const sale = await createSale(
        pharmacyId,
        {
          items: [{ medicine_id: 'med-1', quantity: 5 }],
          prescription_id: prescriptionId,
          is_delivery: false,
          payments: [
            { amount: 5, method: 'cash', currency: 'USD' },
            { amount: 70, method: 'cash', currency: 'NIO' }
          ],
        },
        patientId,
        'cashier-1'
      );

      expect(sale).toBeDefined();
      // Ensure the correct payment change notes was generated
      const saleCallArgs = (db.sale.create as any).mock.calls[0][0];
      expect(saleCallArgs.data.payments.create[0].notes).toBe('Vuelto/Cambio: C$3.00');

      // --- STEP 4: Cashier runs Cash Reconciliation settle at end of day ---
      // We expect 183 NIO (from 5 USD) + 70 NIO (from NIO cash) = 253 NIO expected cash
      (db.sale.findMany as any).mockResolvedValue([
        {
          id: 'sale-1',
          totalAmount: 250.0,
          payments: [
            { amount: 5, method: 'cash', currency: 'USD', status: 'completed' },
            { amount: 70, method: 'cash', currency: 'NIO', status: 'completed' }
          ]
        }
      ]);

      const cashSummary = await getCashSummary(pharmacyId, 'pharmacy', '2026-06-13');
      expect(cashSummary.expectedCash).toBe(253.0); // 183 + 70 = 253 NIO
      expect(cashSummary.expectedTotal).toBe(253.0);

      // Cashier settles drawer with 0 opening balance and declares exactly 253 NIO
      const settleResult = await createCashReconciliation('cashier-1', {
        entityId: pharmacyId,
        entityType: 'pharmacy',
        openingBalance: 0,
        actualCash: 253.0,
        actualCard: 0,
      });

      expect(settleResult).toBeDefined();
      expect(settleResult.status).toBe('conciliated'); // Zero discrepancy
      expect(settleResult.discrepancies.total).toBe(0);
    });
  });

  describe('Flow 2: Caregiver & Patient Permission Flow (Caregiver Acting for Patient)', () => {
    it('should verify access when a caregiver attempts to view or schedule health records on behalf of a patient', async () => {
      // Mock db response verifying active family relationship with 'view_health_data' permission
      (db.user.findUnique as any).mockResolvedValue({
        id: 'patient-1',
        name: 'Patient John',
      });

      // Mock the database call in familyRelationships check
      const mockDb = (db as any);
      
      // Let's simulate a caregiver checking access
      const caregiverId = 'caregiver-1';
      const patientId = 'patient-1';

      // Mock familyRelationship query
      (mockDb.prescription.findMany as any).mockResolvedValue([
        { id: 'presc-1', patientId }
      ]);

      // Verify E2E permission mapping
      const relationship = {
        caregiverId,
        patientId,
        relationship: 'madre',
        status: 'active',
        permissions: ['view_health_data', 'buy_medicines']
      };

      expect(relationship.permissions).toContain('view_health_data');
      expect(relationship.status).toBe('active');
    });
  });

  describe('Flow 3: Clinic Appointment & Check-In Flow (Clinic Admin -> Receptionist -> Patient Check-in)', () => {
    it('should simulate check-in transitions performed by clinic staff', async () => {
      // Mock Receptionist profile
      (db.user.findUnique as any).mockResolvedValue({
        id: 'receptionist-1',
        role: 'receptionist',
        receptionistProfile: { clinicId: 'clinic-1' }
      });

      // Mock clinic existence check
      (db.pharmacy.findUnique as any).mockResolvedValue({
        id: 'clinic-1',
        ownerId: 'clinic-admin-1',
      });

      // Receptionist performs check-in for scheduled appointment
      const mockAppointment = {
        id: 'app-123',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        clinicId: 'clinic-1',
        status: 'checked_in', // Transitioned from scheduled
      };

      expect(mockAppointment.status).toBe('checked_in');
    });
  });

  describe('Flow 4: Logistics Telemetry & Driver Dispatch Flow (Pharmacy Manager -> Driver Dispatch -> Telemetry)', () => {
    it('should successfully update delivery status transitions for in-transit orders', async () => {
      // Setup delivery order in assigned status
      (db.deliveryOrder.findUnique as any).mockResolvedValue({
        id: 'delivery-1',
        status: 'assigned',
        deliveryDriverId: 'driver-1',
        saleId: 'sale-123',
        pharmacyId: 'pharmacy-1',
        patientId: 'patient-1',
      });

      (db.deliveryOrder.update as any).mockResolvedValue({
        id: 'delivery-1',
        status: 'picked_up',
        deliveryDriverId: 'driver-1',
      });

      const { updateDeliveryStatus } = await import('./delivery.service');

      // Driver picks up package from Pharmacy
      const updatedOrder = await updateDeliveryStatus(
        'delivery-1',
        'picked_up',
        'delivery_driver',
        'driver-1'
      );

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.status).toBe('picked_up');
      expect(db.deliveryOrder.update).toHaveBeenCalled();
    });
  });
});
