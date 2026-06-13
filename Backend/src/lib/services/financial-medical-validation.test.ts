import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCashSummary, createCashReconciliation } from './cash-reconciliation.service';
import { createSale } from './sale.service';
import { updateGlobalSetting } from './settings.service';
import { createBatch, updateBatch } from './inventory.service';
import { createPrescription, validatePrescription } from './prescription.service';
import { db } from '@/lib/db';

// Mock the database client matching security.test.ts style
vi.mock('@/lib/db', () => {
  const mockDb = {
    globalSetting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    inventory: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inventoryBatch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    prescription: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    prescriptionLine: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    pharmacy: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockDb)),
  };
  return { db: mockDb };
});

// Mock the password validation helper
vi.mock('../auth/password', () => ({
  verifyPassword: vi.fn(() => Promise.resolve(true)),
}));

// Mock the audit system
vi.mock('./audit.service', () => ({
  createAuditLog: vi.fn(() => Promise.resolve({ id: 'mock-audit-id', createdAt: new Date() })),
}));

// Mock FCM
vi.mock('../fcm', () => ({
  sendPushNotification: vi.fn(),
}));

describe('Financial & Medical Rules Validation Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cash Reconciliation Service', () => {
    it('should aggregate expectedCash converting USD to NIO using database rate', async () => {
      // Mock global setting for exchange rate to be 36.5
      (db.globalSetting.findUnique as any).mockResolvedValue({
        key: 'USD_EXCHANGE_RATE',
        value: '36.5',
      });

      // Mock sales with mixed payments: one NIO, one USD
      (db.sale.findMany as any).mockResolvedValue([
        {
          id: 'sale-1',
          totalAmount: 100,
          payments: [
            { method: 'cash', amount: 100, currency: 'NIO', status: 'completed' },
          ],
        },
        {
          id: 'sale-2',
          totalAmount: 365,
          payments: [
            { method: 'cash', amount: 10, currency: 'USD', status: 'completed' },
          ],
        },
      ]);

      const summary = await getCashSummary('pharmacy-1', 'pharmacy', '2026-06-13');

      // expectedCash = 100 NIO + (10 USD * 36.5 NIO/USD) = 100 + 365 = 465 NIO
      expect(summary.expectedCash).toBe(465);
      expect(summary.expectedTotal).toBe(465);
    });

    it('should reject cash reconciliations with negative or NaN opening balance, actualCash or actualCard', async () => {
      await expect(
        createCashReconciliation('user-1', {
          entityId: 'pharmacy-1',
          entityType: 'pharmacy',
          openingBalance: -10, // Invalid negative opening balance
          actualCash: 100,
          actualCard: 50,
        })
      ).rejects.toThrow('INVALID_AMOUNTS');

      await expect(
        createCashReconciliation('user-1', {
          entityId: 'pharmacy-1',
          entityType: 'pharmacy',
          openingBalance: 10,
          actualCash: -100, // Invalid negative actual cash
          actualCard: 50,
        })
      ).rejects.toThrow('INVALID_AMOUNTS');

      await expect(
        createCashReconciliation('user-1', {
          entityId: 'pharmacy-1',
          entityType: 'pharmacy',
          openingBalance: NaN, // Invalid NaN opening balance
          actualCash: 100,
          actualCard: 50,
        })
      ).rejects.toThrow('INVALID_AMOUNTS');
    });
  });

  describe('Sale Service', () => {
    it('should convert USD payments to NIO and compute change correctly in createSale', async () => {
      // Mock global setting for exchange rate to be 36.6
      (db.globalSetting.findUnique as any).mockResolvedValue({
        key: 'USD_EXCHANGE_RATE',
        value: '36.6',
      });

      // Mock inventory query (returning unit price 100 with batches for FEFO)
      (db.inventory.findFirst as any).mockResolvedValue({
        id: 'inv-1',
        quantity: 10,
        unitPrice: 100,
        batches: [
          { id: 'batch-1', quantity: 10, expirationDate: new Date(Date.now() + 100000) }
        ],
      });

      // Mock sale creation to return success
      (db.sale.create as any).mockResolvedValue({
        id: 'sale-success',
        totalAmount: 100,
      });

      (db.sale.findUnique as any).mockResolvedValue({
        id: 'sale-success',
        totalAmount: 100,
        payments: [
          { amount: 3, method: 'cash', currency: 'USD', notes: 'Vuelto/Cambio: C$9.80' }
        ]
      });

      // Patient buys 1 unit of medicine (Total: 100 NIO) and pays 3 USD (equivalent to 109.8 NIO)
      // Vuelto/Change = 109.8 - 100 = 9.8 NIO
      await createSale(
        'pharmacy-1',
        {
          items: [{ medicine_id: 'med-1', quantity: 1 }],
          is_delivery: false,
          payments: [{ amount: 3, method: 'cash', currency: 'USD' }],
        },
        'patient-1',
        'creator-1'
      );

      expect(db.sale.create).toHaveBeenCalled();
      const mockCallArgs = (db.sale.create as any).mock.calls[0][0];
      const createdPayments = mockCallArgs.data.payments.create;
      expect(createdPayments[0].notes).toBe('Vuelto/Cambio: C$9.80');
    });

    it('should reject payments with negative amounts in createSale', async () => {
      (db.inventory.findFirst as any).mockResolvedValue({
        id: 'inv-1',
        quantity: 10,
        unitPrice: 100,
      });

      await expect(
        createSale(
          'pharmacy-1',
          {
            items: [{ medicine_id: 'med-1', quantity: 1 }],
            is_delivery: false,
            payments: [{ amount: -5, method: 'cash', currency: 'NIO' }],
          },
          'patient-1',
          'creator-1'
        )
      ).rejects.toThrow('INVALID_PAYMENT_AMOUNT');
    });
  });

  describe('Settings Service', () => {
    it('should validate numeric global settings and reject negative or NaN values', async () => {
      (db.globalSetting.findUnique as any).mockResolvedValue({
        key: 'USD_EXCHANGE_RATE',
        value: '36.6',
      });

      await expect(
        updateGlobalSetting('USD_EXCHANGE_RATE', '-35.5', 'user-admin')
      ).rejects.toThrow('INVALID_VALUE');

      await expect(
        updateGlobalSetting('USD_EXCHANGE_RATE', 'invalid-number', 'user-admin')
      ).rejects.toThrow('INVALID_VALUE');
    });
  });

  describe('Inventory Service', () => {
    it('should reject negative quantities or prices when creating batches', async () => {
      await expect(
        createBatch({
          inventoryId: 'inv-1',
          batchNumber: 'LOTE-001',
          quantity: -5, // Invalid negative quantity
        })
      ).rejects.toThrow('INVALID_QUANTITY');

      await expect(
        createBatch({
          inventoryId: 'inv-1',
          batchNumber: 'LOTE-001',
          quantity: 10,
          costPrice: -10, // Invalid negative cost price
        })
      ).rejects.toThrow('INVALID_PRICE');
    });

    it('should reject batch updates that result in a negative consolidated inventory quantity', async () => {
      (db.inventoryBatch.findUnique as any).mockResolvedValue({
        id: 'batch-1',
        inventoryId: 'inv-1',
        quantity: 50,
      });

      // The consolidated inventory has 30 units total.
      // If we attempt to decrease this batch quantity to 10 (change of -40),
      // the consolidated inventory would drop to 30 - 40 = -10, which should be rejected.
      (db.inventory.findUnique as any).mockResolvedValue({
        id: 'inv-1',
        quantity: 30,
      });

      await expect(
        updateBatch('batch-1', {
          quantity: 10, // Attempting to reduce batch stock by 40 units
        })
      ).rejects.toThrow('INSUFFICIENT_STOCK');
    });
  });

  describe('Prescription Service', () => {
    it('should reject prescriptions with expiration dates in the past or invalid formats', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        createPrescription(
          {
            patient_id: 'patient-1',
            clinic_id: 'clinic-1',
            expiration_date: yesterday.toISOString(), // Expired
            signature_pin: '1234',
            lines: [{ medicine_id: 'med-1', quantity: 5, dosage_instructions: 'Take daily' }],
          },
          'doctor-1'
        )
      ).rejects.toThrow('PRESCRIPTION_EXPIRED_DATE_IN_PAST');

      await expect(
        createPrescription(
          {
            patient_id: 'patient-1',
            clinic_id: 'clinic-1',
            expiration_date: 'corrupt-date-format', // Invalid date format
            signature_pin: '1234',
            lines: [{ medicine_id: 'med-1', quantity: 5, dosage_instructions: 'Take daily' }],
          },
          'doctor-1'
        )
      ).rejects.toThrow('INVALID_EXPIRATION_DATE');
    });

    it('should reject prescriptions with zero or negative quantities on lines', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await expect(
        createPrescription(
          {
            patient_id: 'patient-1',
            clinic_id: 'clinic-1',
            expiration_date: futureDate.toISOString(),
            signature_pin: '1234',
            lines: [{ medicine_id: 'med-1', quantity: 0, dosage_instructions: 'Take daily' }], // Zero quantity
          },
          'doctor-1'
        )
      ).rejects.toThrow('INVALID_LINE_QUANTITY');

      await expect(
        createPrescription(
          {
            patient_id: 'patient-1',
            clinic_id: 'clinic-1',
            expiration_date: futureDate.toISOString(),
            signature_pin: '1234',
            lines: [{ medicine_id: 'med-1', quantity: -5, dosage_instructions: 'Take daily' }], // Negative quantity
          },
          'doctor-1'
        )
      ).rejects.toThrow('INVALID_LINE_QUANTITY');
    });

    it('should fail validation in validatePrescription if the prescription expirationDate is corrupt', async () => {
      (db.prescription.findFirst as any).mockResolvedValue({
        id: 'presc-corrupt',
        expirationDate: 'corrupt-date-format',
        status: 'active',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        clinicId: 'clinic-1',
        prescriptionLines: [],
      });

      await expect(
        validatePrescription('RX-123456')
      ).rejects.toThrow('PRESCRIPTION_EXPIRED');
    });

    it('should fail validation in validatePrescription if the signature has been tampered with', async () => {
      (db.prescription.findFirst as any).mockResolvedValue({
        id: 'presc-tampered',
        expirationDate: new Date(Date.now() + 100000).toISOString(),
        status: 'active',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        clinicId: 'clinic-1',
        digitalSignature: 'some-invalid-or-forged-signature',
        doctor: {
          id: 'doctor-1',
          name: 'Dr. House',
          doctorProfile: {
            signaturePin: 'hashed-pin-secret',
          },
        },
        prescriptionLines: [
          { medicineId: 'med-1', quantity: 10, medicine: { name: 'Ibuprofen' } }
        ],
      });

      await expect(
        validatePrescription('RX-123456')
      ).rejects.toThrow('PRESCRIPTION_SIGNATURE_TAMPERED');
    });
  });
});
