import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { registerUser } from './user-registration.service';
import { createEmployeeDirectly } from './invitation.service';
import { createAppointment, updateAppointmentStatus } from './appointment.service';
import { createPrescription, validatePrescription, fulfillPrescription } from './prescription.service';
import { createSale } from './sale.service';
import { updateDeliveryStatus } from './delivery.service';
import { getCashSummary, createCashReconciliation } from './cash-reconciliation.service';
import { getAdminStats } from './admin.service';
import { updateGlobalSetting } from './settings.service';
import { DocumentService } from './document.service';

// Mock state arrays
let mockUsers: any[] = [];
let mockClinics: any[] = [];
let mockPharmacies: any[] = [];
let mockDoctorProfiles: any[] = [];
let mockPatientProfiles: any[] = [];
let mockPharmacyManagerProfiles: any[] = [];
let mockDeliveryDriverProfiles: any[] = [];
let mockReceptionistProfiles: any[] = [];
let mockInvitations: any[] = [];
let mockDoctorDocuments: any[] = [];
let mockClinicDocuments: any[] = [];
let mockPharmacyDocuments: any[] = [];
let mockAppointments: any[] = [];
let mockPrescriptions: any[] = [];
let mockPrescriptionLines: any[] = [];
let mockSales: any[] = [];
let mockPayments: any[] = [];
let mockSaleItems: any[] = [];
let mockDeliveryOrders: any[] = [];
let mockDeliveryRoutes: any[] = [];
let mockGlobalSettings: any[] = [
  { key: 'USD_EXCHANGE_RATE', value: '36.6' }
];
let mockFamilyRelationships: any[] = [];
let mockInventory: any[] = [];
let mockInventoryBatches: any[] = [];
let mockAuditLogs: any[] = [];
let mockChatSessions: any[] = [];

// Helper functions to resolve entity links
const resolveUser = (user: any) => {
  if (!user) return null;
  return {
    ...user,
    patientProfile: mockPatientProfiles.find(p => p.userId === user.id) || null,
    doctorProfile: mockDoctorProfiles.find(d => d.userId === user.id) || null,
    pharmacyManagerProfile: mockPharmacyManagerProfiles.find(pm => pm.userId === user.id) || null,
    deliveryDriverProfile: mockDeliveryDriverProfiles.find(dd => dd.userId === user.id) || null,
    receptionistProfile: mockReceptionistProfiles.find(r => r.userId === user.id) || null,
  };
};

const resolveClinicDoc = (doc: any) => {
  if (!doc) return null;
  return {
    ...doc,
    clinic: mockClinics.find(c => c.id === doc.clinicId) || null,
    uploader: resolveUser(mockUsers.find(u => u.id === doc.uploadedBy)) || null,
  };
};

const resolvePharmacyDoc = (doc: any) => {
  if (!doc) return null;
  return {
    ...doc,
    pharmacy: mockPharmacies.find(p => p.id === doc.pharmacyId) || null,
    uploader: resolveUser(mockUsers.find(u => u.id === doc.uploadedBy)) || null,
  };
};

const resolveDoctorDoc = (doc: any) => {
  if (!doc) return null;
  return {
    ...doc,
    doctor: resolveUser(mockUsers.find(u => u.id === doc.doctorId)) || null,
  };
};

const resolveAppointment = (app: any) => {
  if (!app) return null;
  return {
    ...app,
    patient: resolveUser(mockUsers.find(u => u.id === app.patientId)),
    doctor: resolveUser(mockUsers.find(u => u.id === app.doctorId)),
    clinic: mockClinics.find(c => c.id === app.clinicId),
  };
};

const resolvePrescription = (rx: any) => {
  if (!rx) return null;
  const lines = mockPrescriptionLines.filter(l => l.prescriptionId === rx.id).map(l => ({
    ...l,
    medicine: { id: l.medicineId, name: 'Medicina ' + l.medicineId }
  }));
  return {
    ...rx,
    prescriptionLines: lines,
    doctor: resolveUser(mockUsers.find(u => u.id === rx.doctorId)),
    patient: resolveUser(mockUsers.find(u => u.id === rx.patientId)),
    clinic: mockClinics.find(c => c.id === rx.clinicId),
    fulfilledPharmacy: mockPharmacies.find(p => p.id === rx.fulfilledPharmacyId) || null,
  };
};

const resolveSale = (sale: any) => {
  if (!sale) return null;
  return {
    ...sale,
    payments: mockPayments.filter(p => p.saleId === sale.id),
    saleItems: mockSaleItems.filter(si => si.saleId === sale.id),
    prescription: resolvePrescription(mockPrescriptions.find(p => p.id === sale.prescriptionId)),
    patient: resolveUser(mockUsers.find(u => u.id === sale.patientId)),
    pharmacy: mockPharmacies.find(p => p.id === sale.pharmacyId),
    clinic: mockClinics.find(c => c.id === sale.clinicId),
    appointment: resolveAppointment(mockAppointments.find(a => a.id === sale.appointmentId)),
  };
};

const resolveDelivery = (order: any) => {
  if (!order) return null;
  return {
    ...order,
    sale: resolveSale(mockSales.find(s => s.id === order.saleId)),
    pharmacy: mockPharmacies.find(p => p.id === order.pharmacyId),
    deliveryDriver: resolveUser(mockUsers.find(u => u.id === order.deliveryDriverId)),
    patient: resolveUser(mockUsers.find(u => u.id === order.patientId)),
  };
};

const resolveInventory = (inv: any) => {
  if (!inv) return null;
  return {
    ...inv,
    medicine: { id: inv.medicineId, name: 'Medicina ' + inv.medicineId },
    pharmacy: mockPharmacies.find(p => p.id === inv.pharmacyId),
    batches: mockInventoryBatches.filter(b => b.inventoryId === inv.id),
  };
};

// Helper function to handle Prisma increment/decrement updates
const parseNumberVal = (oldVal: number, updateVal: any): number => {
  if (updateVal === undefined) return oldVal;
  if (typeof updateVal === 'object' && updateVal !== null) {
    if ('decrement' in updateVal) {
      return oldVal - updateVal.decrement;
    }
    if ('increment' in updateVal) {
      return oldVal + updateVal.increment;
    }
  }
  return Number(updateVal);
};

// Mock the DB layer
vi.mock('@/lib/db', () => {
  const mockDb = {
    user: {
      findUnique: vi.fn(({ where }) => {
        const key = Object.keys(where)[0];
        const val = where[key];
        const user = mockUsers.find(u => u[key] === val);
        return Promise.resolve(resolveUser(user));
      }),
      findFirst: vi.fn(({ where }) => {
        // Simple filter matching
        const user = mockUsers.find(u => {
          return Object.keys(where).every(k => u[k] === where[k]);
        });
        return Promise.resolve(resolveUser(user));
      }),
      findMany: vi.fn(({ where } = {}) => {
        let list = [...mockUsers];
        if (where) {
          list = list.filter(u => Object.keys(where).every(k => u[k] === where[k]));
        }
        return Promise.resolve(list.map(resolveUser));
      }),
      create: vi.fn(({ data }) => {
        const user = { id: 'user-' + (mockUsers.length + 1), isActive: true, createdAt: new Date(), ...data };
        mockUsers.push(user);
        return Promise.resolve(resolveUser(user));
      }),
      update: vi.fn(({ where, data }) => {
        const key = Object.keys(where)[0];
        const val = where[key];
        const idx = mockUsers.findIndex(u => u[key] === val);
        if (idx !== -1) {
          mockUsers[idx] = { ...mockUsers[idx], ...data };
          return Promise.resolve(resolveUser(mockUsers[idx]));
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(({ where } = {}) => {
        if (!where) return Promise.resolve(mockUsers.length);
        const filtered = mockUsers.filter(u => Object.keys(where).every(k => u[k] === where[k]));
        return Promise.resolve(filtered.length);
      })
    },
    clinic: {
      create: vi.fn(({ data }) => {
        const clinic = { id: 'clinic-' + (mockClinics.length + 1), isActive: true, createdAt: new Date(), ...data };
        mockClinics.push(clinic);
        return Promise.resolve(clinic);
      }),
      findUnique: vi.fn(({ where }) => {
        const clinic = mockClinics.find(c => c.id === where.id);
        return Promise.resolve(clinic || null);
      }),
      findFirst: vi.fn(({ where }) => {
        const clinic = mockClinics.find(c => Object.keys(where).every(k => c[k] === where[k]));
        return Promise.resolve(clinic || null);
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockClinics.findIndex(c => c.id === where.id);
        if (idx !== -1) {
          mockClinics[idx] = { ...mockClinics[idx], ...data };
          return Promise.resolve(mockClinics[idx]);
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(() => Promise.resolve(mockClinics.length))
    },
    pharmacy: {
      create: vi.fn(({ data }) => {
        const pharmacy = { id: 'pharmacy-' + (mockPharmacies.length + 1), isActive: true, deliveryFee: 0, createdAt: new Date(), ...data };
        mockPharmacies.push(pharmacy);
        return Promise.resolve(pharmacy);
      }),
      findUnique: vi.fn(({ where }) => {
        const pharmacy = mockPharmacies.find(p => p.id === where.id);
        return Promise.resolve(pharmacy || null);
      }),
      findFirst: vi.fn(({ where }) => {
        const pharmacy = mockPharmacies.find(p => Object.keys(where).every(k => p[k] === where[k]));
        return Promise.resolve(pharmacy || null);
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockPharmacies.findIndex(p => p.id === where.id);
        if (idx !== -1) {
          mockPharmacies[idx] = { ...mockPharmacies[idx], ...data };
          return Promise.resolve(mockPharmacies[idx]);
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(() => Promise.resolve(mockPharmacies.length))
    },
    patientProfile: {
      create: vi.fn(({ data }) => {
        const profile = { ...data, createdAt: new Date() };
        mockPatientProfiles.push(profile);
        return Promise.resolve(profile);
      })
    },
    doctorProfile: {
      create: vi.fn(({ data }) => {
        const profile = { ...data, createdAt: new Date() };
        mockDoctorProfiles.push(profile);
        return Promise.resolve(profile);
      }),
      findUnique: vi.fn(({ where }) => {
        const profile = mockDoctorProfiles.find(d => d.userId === where.userId);
        return Promise.resolve(profile || null);
      })
    },
    pharmacyManagerProfile: {
      create: vi.fn(({ data }) => {
        const profile = { ...data, createdAt: new Date() };
        mockPharmacyManagerProfiles.push(profile);
        return Promise.resolve(profile);
      }),
      findUnique: vi.fn(({ where }) => {
        const profile = mockPharmacyManagerProfiles.find(pm => pm.userId === where.userId);
        return Promise.resolve(profile || null);
      })
    },
    deliveryDriverProfile: {
      create: vi.fn(({ data }) => {
        const profile = { ...data, createdAt: new Date() };
        mockDeliveryDriverProfiles.push(profile);
        return Promise.resolve(profile);
      }),
      findUnique: vi.fn(({ where }) => {
        const profile = mockDeliveryDriverProfiles.find(dd => dd.userId === where.userId);
        return Promise.resolve(profile || null);
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockDeliveryDriverProfiles.findIndex(dd => dd.userId === where.userId);
        if (idx !== -1) {
          mockDeliveryDriverProfiles[idx] = { ...mockDeliveryDriverProfiles[idx], ...data };
          return Promise.resolve(mockDeliveryDriverProfiles[idx]);
        }
        return Promise.resolve(null);
      })
    },
    receptionistProfile: {
      create: vi.fn(({ data }) => {
        const profile = { ...data, createdAt: new Date() };
        mockReceptionistProfiles.push(profile);
        return Promise.resolve(profile);
      }),
      findUnique: vi.fn(({ where }) => {
        const profile = mockReceptionistProfiles.find(r => r.userId === where.userId);
        return Promise.resolve(profile || null);
      })
    },
    invitation: {
      create: vi.fn(({ data }) => {
        const token = data.token || 'token-' + Math.random().toString(36).substring(7);
        const invitation = { id: 'inv-' + (mockInvitations.length + 1), token, ...data, isAccepted: false, createdAt: new Date() };
        mockInvitations.push(invitation);
        return Promise.resolve(invitation);
      }),
      findUnique: vi.fn(({ where }) => {
        const invitation = mockInvitations.find(i => i.token === where.token);
        return Promise.resolve(invitation || null);
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockInvitations.findIndex(i => i.token === where.token);
        if (idx !== -1) {
          mockInvitations[idx] = { ...mockInvitations[idx], ...data };
          return Promise.resolve(mockInvitations[idx]);
        }
        return Promise.resolve(null);
      })
    },
    doctorDocument: {
      create: vi.fn(({ data }) => {
        const document = { id: 'doc-doc-' + (mockDoctorDocuments.length + 1), createdAt: new Date(), status: 'pending', ...data };
        mockDoctorDocuments.push(document);
        return Promise.resolve(resolveDoctorDoc(document));
      }),
      findUnique: vi.fn(({ where }) => {
        const document = mockDoctorDocuments.find(d => d.id === where.id);
        return Promise.resolve(resolveDoctorDoc(document));
      }),
      findMany: vi.fn(({ where }) => {
        const filtered = mockDoctorDocuments.filter(d => Object.keys(where).every(k => d[k] === where[k]));
        return Promise.resolve(filtered.map(resolveDoctorDoc));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockDoctorDocuments.findIndex(d => d.id === where.id);
        if (idx !== -1) {
          mockDoctorDocuments[idx] = { ...mockDoctorDocuments[idx], ...data };
          return Promise.resolve(resolveDoctorDoc(mockDoctorDocuments[idx]));
        }
        return Promise.resolve(null);
      })
    },
    clinicDocument: {
      create: vi.fn(({ data }) => {
        const document = { id: 'clinic-doc-' + (mockClinicDocuments.length + 1), createdAt: new Date(), status: 'pending', ...data };
        mockClinicDocuments.push(document);
        return Promise.resolve(resolveClinicDoc(document));
      }),
      findUnique: vi.fn(({ where }) => {
        const document = mockClinicDocuments.find(d => d.id === where.id);
        return Promise.resolve(resolveClinicDoc(document));
      }),
      findMany: vi.fn(({ where }) => {
        const filtered = mockClinicDocuments.filter(d => Object.keys(where).every(k => d[k] === where[k]));
        return Promise.resolve(filtered.map(resolveClinicDoc));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockClinicDocuments.findIndex(d => d.id === where.id);
        if (idx !== -1) {
          mockClinicDocuments[idx] = { ...mockClinicDocuments[idx], ...data };
          return Promise.resolve(resolveClinicDoc(mockClinicDocuments[idx]));
        }
        return Promise.resolve(null);
      })
    },
    pharmacyDocument: {
      create: vi.fn(({ data }) => {
        const document = { id: 'pharmacy-doc-' + (mockPharmacyDocuments.length + 1), createdAt: new Date(), status: 'pending', ...data };
        mockPharmacyDocuments.push(document);
        return Promise.resolve(resolvePharmacyDoc(document));
      }),
      findUnique: vi.fn(({ where }) => {
        const document = mockPharmacyDocuments.find(d => d.id === where.id);
        return Promise.resolve(resolvePharmacyDoc(document));
      }),
      findMany: vi.fn(({ where }) => {
        const filtered = mockPharmacyDocuments.filter(d => Object.keys(where).every(k => d[k] === where[k]));
        return Promise.resolve(filtered.map(resolvePharmacyDoc));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockPharmacyDocuments.findIndex(d => d.id === where.id);
        if (idx !== -1) {
          mockPharmacyDocuments[idx] = { ...mockPharmacyDocuments[idx], ...data };
          return Promise.resolve(resolvePharmacyDoc(mockPharmacyDocuments[idx]));
        }
        return Promise.resolve(null);
      })
    },
    appointment: {
      create: vi.fn(({ data }) => {
        const appointment = { id: 'app-' + (mockAppointments.length + 1), status: 'scheduled', createdAt: new Date(), ...data };
        mockAppointments.push(appointment);
        return Promise.resolve(resolveAppointment(appointment));
      }),
      findUnique: vi.fn(({ where }) => {
        const app = mockAppointments.find(a => a.id === where.id);
        return Promise.resolve(resolveAppointment(app));
      }),
      findFirst: vi.fn(({ where }) => {
        let list = [...mockAppointments];
        if (where) {
          if (where.doctorId) list = list.filter(a => a.doctorId === where.doctorId);
          if (where.status && where.status.notIn) {
            list = list.filter(a => !where.status.notIn.includes(a.status));
          }
        }
        return Promise.resolve(list.length > 0 ? resolveAppointment(list[0]) : null);
      }),
      findMany: vi.fn(({ where }) => {
        let list = [...mockAppointments];
        if (where) {
          if (where.doctorId) list = list.filter(a => a.doctorId === where.doctorId);
          if (where.patientId) list = list.filter(a => a.patientId === where.patientId);
          if (where.clinicId) list = list.filter(a => a.clinicId === where.clinicId);
          if (where.status) {
            if (where.status.notIn) {
              list = list.filter(a => !where.status.notIn.includes(a.status));
            } else {
              list = list.filter(a => a.status === where.status);
            }
          }
        }
        return Promise.resolve(list.map(resolveAppointment));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockAppointments.findIndex(a => a.id === where.id);
        if (idx !== -1) {
          mockAppointments[idx] = { ...mockAppointments[idx], ...data };
          return Promise.resolve(resolveAppointment(mockAppointments[idx]));
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(() => Promise.resolve(mockAppointments.length)),
      groupBy: vi.fn(({ by }) => {
        const counts: Record<string, number> = {};
        mockAppointments.forEach(a => {
          counts[a.status] = (counts[a.status] || 0) + 1;
        });
        return Promise.resolve(Object.entries(counts).map(([status, count]) => ({
          status,
          _count: count
        })));
      })
    },
    prescription: {
      create: vi.fn(({ data }) => {
        const lines = data.prescriptionLines?.create || [];
        const rx = {
          id: 'rx-' + (mockPrescriptions.length + 1),
          status: 'active',
          qrCode: data.qrCode || 'qr-' + Math.random().toString(36).substring(7),
          verificationCode: data.verificationCode || 'code-' + Math.random().toString(36).substring(7),
          digitalSignature: data.digitalSignature,
          patientId: data.patientId,
          doctorId: data.doctorId,
          clinicId: data.clinicId,
          expirationDate: data.expirationDate,
          notes: data.notes,
          createdAt: new Date(),
        };
        mockPrescriptions.push(rx);

        lines.forEach((l: any) => {
          mockPrescriptionLines.push({
            id: 'line-' + (mockPrescriptionLines.length + 1),
            prescriptionId: rx.id,
            medicineId: l.medicineId,
            quantity: l.quantity,
            dosageInstructions: l.dosageInstructions,
            quantityFulfilled: 0,
            createdAt: new Date(),
          });
        });

        return Promise.resolve(resolvePrescription(rx));
      }),
      findUnique: vi.fn(({ where }) => {
        const rx = mockPrescriptions.find(r => r.id === where.id);
        return Promise.resolve(resolvePrescription(rx));
      }),
      findFirst: vi.fn(({ where }) => {
        const rx = mockPrescriptions.find(r => {
          return Object.keys(where).every(k => r[k] === where[k]);
        });
        return Promise.resolve(resolvePrescription(rx));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockPrescriptions.findIndex(r => r.id === where.id);
        if (idx !== -1) {
          mockPrescriptions[idx] = { ...mockPrescriptions[idx], ...data };
          return Promise.resolve(resolvePrescription(mockPrescriptions[idx]));
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(() => Promise.resolve(mockPrescriptions.length))
    },
    prescriptionLine: {
      findMany: vi.fn(({ where }) => {
        const lines = mockPrescriptionLines.filter(l => l.prescriptionId === where.prescriptionId);
        return Promise.resolve(lines);
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockPrescriptionLines.findIndex(l => l.id === where.id);
        if (idx !== -1) {
          mockPrescriptionLines[idx] = { ...mockPrescriptionLines[idx], ...data };
          return Promise.resolve(mockPrescriptionLines[idx]);
        }
        return Promise.resolve(null);
      })
    },
    sale: {
      create: vi.fn(({ data }) => {
        const sale = {
          id: 'sale-' + (mockSales.length + 1),
          status: data.status || 'pending',
          totalAmount: data.totalAmount,
          pharmacyId: data.pharmacyId,
          clinicId: data.clinicId,
          patientId: data.patientId,
          prescriptionId: data.prescriptionId,
          appointmentId: data.appointmentId,
          isDelivery: data.isDelivery,
          deliveryAddress: data.deliveryAddress,
          createdAt: new Date(),
        };
        mockSales.push(sale);

        if (data.payments?.create) {
          data.payments.create.forEach((p: any) => {
            mockPayments.push({
              id: 'pmt-' + (mockPayments.length + 1),
              saleId: sale.id,
              amount: p.amount,
              method: p.method,
              currency: p.currency,
              status: p.status || 'completed',
              notes: p.notes,
              createdAt: new Date(),
            });
          });
        }

        if (data.saleItems?.create) {
          data.saleItems.create.forEach((si: any) => {
            mockSaleItems.push({
              id: 'si-' + (mockSaleItems.length + 1),
              saleId: sale.id,
              medicineId: si.medicineId,
              quantity: si.quantity,
              unitPrice: si.unitPrice,
              createdAt: new Date(),
            });
          });
        }

        return Promise.resolve(resolveSale(sale));
      }),
      findUnique: vi.fn(({ where }) => {
        const sale = mockSales.find(s => s.id === where.id);
        return Promise.resolve(resolveSale(sale));
      }),
      findMany: vi.fn(({ where }) => {
        let list = [...mockSales];
        if (where) {
          if (where.pharmacyId) list = list.filter(s => s.pharmacyId === where.pharmacyId);
          if (where.clinicId) list = list.filter(s => s.clinicId === where.clinicId);
          if (where.status) {
            if (typeof where.status === 'string') {
              list = list.filter(s => s.status === where.status);
            } else if (where.status.in && Array.isArray(where.status.in)) {
              list = list.filter(s => where.status.in.includes(s.status));
            }
          }
          if (where.createdAt && where.createdAt.gte) {
            list = list.filter(s => s.createdAt >= where.createdAt.gte);
          }
        }
        return Promise.resolve(list.map(resolveSale));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockSales.findIndex(s => s.id === where.id);
        if (idx !== -1) {
          mockSales[idx] = { ...mockSales[idx], ...data };
          return Promise.resolve(resolveSale(mockSales[idx]));
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(() => Promise.resolve(mockSales.length)),
      aggregate: vi.fn(({ _sum, where }) => {
        let list = [...mockSales];
        if (where) {
          if (where.createdAt && where.createdAt.gte) {
            list = list.filter(s => s.createdAt >= where.createdAt.gte);
          }
        }
        const total = list.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
        return Promise.resolve({ _sum: { totalAmount: total } });
      })
    },
    deliveryOrder: {
      create: vi.fn(({ data }) => {
        const order = {
          id: 'delivery-' + (mockDeliveryOrders.length + 1),
          status: 'pending',
          saleId: data.saleId,
          pharmacyId: data.pharmacyId,
          patientId: data.patientId,
          pickupAddress: data.pickupAddress,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          deliveryAddress: data.deliveryAddress,
          deliveryLat: data.deliveryLat,
          deliveryLng: data.deliveryLng,
          createdAt: new Date(),
        };
        mockDeliveryOrders.push(order);
        return Promise.resolve(resolveDelivery(order));
      }),
      findUnique: vi.fn(({ where }) => {
        const order = mockDeliveryOrders.find(o => o.id === where.id || o.saleId === where.saleId);
        return Promise.resolve(resolveDelivery(order));
      }),
      findFirst: vi.fn(({ where }) => {
        const order = mockDeliveryOrders.find(o => Object.keys(where).every(k => o[k] === where[k]));
        return Promise.resolve(resolveDelivery(order));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockDeliveryOrders.findIndex(o => o.id === where.id);
        if (idx !== -1) {
          mockDeliveryOrders[idx] = { ...mockDeliveryOrders[idx], ...data };
          return Promise.resolve(resolveDelivery(mockDeliveryOrders[idx]));
        }
        return Promise.resolve(null);
      }),
      count: vi.fn(() => Promise.resolve(mockDeliveryOrders.length)),
      groupBy: vi.fn(({ by }) => {
        // Group by status counts
        const groups: Record<string, number> = {};
        mockDeliveryOrders.forEach(o => {
          groups[o.status] = (groups[o.status] || 0) + 1;
        });
        return Promise.resolve(Object.entries(groups).map(([status, count]) => ({
          status,
          _count: count
        })));
      })
    },
    deliveryRoute: {
      createMany: vi.fn(({ data }) => {
        data.forEach((r: any) => {
          mockDeliveryRoutes.push({
            id: 'route-' + (mockDeliveryRoutes.length + 1),
            ...r
          });
        });
        return Promise.resolve({ count: data.length });
      })
    },
    globalSetting: {
      findUnique: vi.fn(({ where }) => {
        const setting = mockGlobalSettings.find(s => s.key === where.key);
        return Promise.resolve(setting || null);
      }),
      findMany: vi.fn(() => Promise.resolve(mockGlobalSettings)),
      update: vi.fn(({ where, data }) => {
        const idx = mockGlobalSettings.findIndex(s => s.key === where.key);
        if (idx !== -1) {
          mockGlobalSettings[idx] = { ...mockGlobalSettings[idx], ...data };
          return Promise.resolve(mockGlobalSettings[idx]);
        }
        return Promise.resolve(null);
      })
    },
    familyRelationship: {
      findFirst: vi.fn(({ where }) => {
        const rel = mockFamilyRelationships.find(r => {
          // Check simple active check
          if (where.status && r.status !== where.status) return false;
          if (where.caregiverId && r.caregiverId !== where.caregiverId) return false;
          if (where.patientId && r.patientId !== where.patientId) return false;
          return true;
        });
        return Promise.resolve(rel || null);
      }),
      create: vi.fn(({ data }) => {
        const rel = { id: 'rel-' + (mockFamilyRelationships.length + 1), ...data, createdAt: new Date() };
        mockFamilyRelationships.push(rel);
        return Promise.resolve(rel);
      }),
      findMany: vi.fn(({ where }) => {
        const list = mockFamilyRelationships.filter(r => {
          if (where.caregiverId && r.caregiverId !== where.caregiverId) return false;
          if (where.patientId && r.patientId !== where.patientId) return false;
          return true;
        });
        return Promise.resolve(list);
      })
    },
    inventory: {
      findFirst: vi.fn(({ where }) => {
        const inv = mockInventory.find(i => i.pharmacyId === where.pharmacyId && i.medicineId === where.medicineId);
        return Promise.resolve(resolveInventory(inv));
      }),
      findUnique: vi.fn(({ where }) => {
        const inv = mockInventory.find(i => i.id === where.id || (where.pharmacyId_medicineId && i.pharmacyId === where.pharmacyId_medicineId.pharmacyId && i.medicineId === where.pharmacyId_medicineId.medicineId));
        return Promise.resolve(resolveInventory(inv));
      }),
      create: vi.fn(({ data }) => {
        const inv = { id: 'inv-' + (mockInventory.length + 1), quantity: data.quantity || 0, minStock: data.minStock || 10, unitPrice: data.unitPrice || 0, pharmacyId: data.pharmacyId, medicineId: data.medicineId, createdAt: new Date() };
        mockInventory.push(inv);
        return Promise.resolve(resolveInventory(inv));
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockInventory.findIndex(i => i.id === where.id);
        if (idx !== -1) {
          if (data.quantity !== undefined) {
            mockInventory[idx].quantity = parseNumberVal(mockInventory[idx].quantity || 0, data.quantity);
          }
          if (data.unitPrice !== undefined) {
            mockInventory[idx].unitPrice = parseNumberVal(mockInventory[idx].unitPrice || 0, data.unitPrice);
          }
          return Promise.resolve(resolveInventory(mockInventory[idx]));
        }
        return Promise.resolve(null);
      })
    },
    inventoryBatch: {
      findUnique: vi.fn(({ where }) => {
        const batch = mockInventoryBatches.find(b => b.id === where.id);
        return Promise.resolve(batch || null);
      }),
      findMany: vi.fn(({ where }) => {
        let list = [...mockInventoryBatches];
        if (where) {
          if (where.inventoryId) list = list.filter(b => b.inventoryId === where.inventoryId);
          if (where.quantity && where.quantity.gt) {
            list = list.filter(b => b.quantity > where.quantity.gt);
          }
        }
        // FEFO sort helper
        list.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        return Promise.resolve(list);
      }),
      create: vi.fn(({ data }) => {
        const batch = { id: 'batch-' + (mockInventoryBatches.length + 1), ...data, createdAt: new Date() };
        mockInventoryBatches.push(batch);
        
        // consolidated quantity update
        const invIdx = mockInventory.findIndex(i => i.id === data.inventoryId);
        if (invIdx !== -1) {
          mockInventory[invIdx].quantity += data.quantity;
        }

        return Promise.resolve(batch);
      }),
      update: vi.fn(({ where, data }) => {
        const idx = mockInventoryBatches.findIndex(b => b.id === where.id);
        if (idx !== -1) {
          const oldQty = mockInventoryBatches[idx].quantity || 0;
          let newQty = oldQty;
          if (data.quantity !== undefined) {
            newQty = parseNumberVal(oldQty, data.quantity);
          }
          mockInventoryBatches[idx] = { ...mockInventoryBatches[idx], ...data, quantity: newQty };
          return Promise.resolve(mockInventoryBatches[idx]);
        }
        return Promise.resolve(null);
      })
    },
    auditLog: {
      create: vi.fn(({ data }) => {
        const log = { id: 'audit-' + (mockAuditLogs.length + 1), ...data, createdAt: new Date() };
        mockAuditLogs.push(log);
        return Promise.resolve(log);
      })
    },
    chatSession: {
      create: vi.fn(({ data }) => {
        const session = { id: 'chat-' + (mockChatSessions.length + 1), isActive: true, createdAt: new Date(), ...data };
        mockChatSessions.push(session);
        return Promise.resolve(session);
      }),
      updateMany: vi.fn(({ where, data }) => {
        mockChatSessions.forEach(s => {
          if (where.targetId && s.targetId !== where.targetId) return;
          Object.assign(s, data);
        });
        return Promise.resolve({ count: mockChatSessions.length });
      }),
      findMany: vi.fn(() => Promise.resolve(mockChatSessions))
    },
    refreshToken: {
      create: vi.fn(({ data }) => {
        return Promise.resolve({ id: 'rt-1', ...data });
      })
    },
    $transaction: vi.fn(async (cb) => {
      // Execute transaction callback passing mockDb context
      return await cb(mockDb);
    })
  };
  
  return { db: mockDb };
});

// Mock notification.service and event-notifications circular requirements
vi.mock('./notification.service', () => ({
  NotificationService: {
    createNotification: vi.fn(() => Promise.resolve({ id: 'notif-1' })),
    sendToUser: vi.fn(() => Promise.resolve()),
  }
}));

vi.mock('./event-notifications', () => ({
  notifyDocumentUploaded: vi.fn(() => Promise.resolve()),
  notifyDoctorDocumentStatus: vi.fn(() => Promise.resolve()),
  notifyInvitationAccepted: vi.fn(() => Promise.resolve()),
  notifyPharmacyInvitationAccepted: vi.fn(() => Promise.resolve()),
  notifyDeliveryStatusChanged: vi.fn(() => Promise.resolve()),
  notifyPharmacyDeliveryStatus: vi.fn(() => Promise.resolve()),
  notifyLowStockAlert: vi.fn(() => Promise.resolve()),
  notifyPrescriptionFulfilled: vi.fn(() => Promise.resolve()),
  notifyAppointmentCreatedForClinic: vi.fn(() => Promise.resolve()),
  notifyAppointmentCanceledForClinic: vi.fn(() => Promise.resolve()),
  notifyNewOrderReceived: vi.fn(() => Promise.resolve()),
  notifyExpiryAlert: vi.fn(() => Promise.resolve()),
  notifyAppointmentBookedForDoctor: vi.fn(() => Promise.resolve()),
  notifyAppointmentCanceledForDoctor: vi.fn(() => Promise.resolve()),
  notifyPatientCheckIn: vi.fn(() => Promise.resolve()),
  notifyReceptionistsOfCheckIn: vi.fn(() => Promise.resolve()),
  notifyPrescriptionCreated: vi.fn(() => Promise.resolve()),
  notifyOrderAccepted: vi.fn(() => Promise.resolve()),
  notifyDriverNearby: vi.fn(() => Promise.resolve()),
  notifyOrderDelivered: vi.fn(() => Promise.resolve()),
  notifyMedicationReminder: vi.fn(() => Promise.resolve()),
  notifyAppointmentRescheduled: vi.fn(() => Promise.resolve()),
}));

// Mock external systems
vi.mock('../auth/password', () => ({
  hashPassword: vi.fn((p) => Promise.resolve('hashed-' + p)),
  verifyPassword: vi.fn((plain, hashed) => Promise.resolve(hashed === 'hashed-' + plain)),
}));

vi.mock('./audit.service', () => ({
  createAuditLog: vi.fn((data, tx) => {
    const log = { id: 'audit-' + (mockAuditLogs.length + 1), ...data, createdAt: new Date() };
    mockAuditLogs.push(log);
    return Promise.resolve(log);
  }),
}));

vi.mock('../fcm', () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock('../socket', () => ({
  getIO: vi.fn(() => ({
    to: vi.fn(() => ({
      emit: vi.fn()
    }))
  })),
  emitDeliveryLocation: vi.fn(),
  emitChatMessage: vi.fn(),
  emitNotification: vi.fn(),
}));

describe('Oasis Líquida - Comprehensive All-Roles & Flow-Path Test Suite', () => {
  beforeEach(() => {
    // Reset state arrays
    mockUsers = [];
    mockClinics = [];
    mockPharmacies = [];
    mockDoctorProfiles = [];
    mockPatientProfiles = [];
    mockPharmacyManagerProfiles = [];
    mockDeliveryDriverProfiles = [];
    mockReceptionistProfiles = [];
    mockInvitations = [];
    mockDoctorDocuments = [];
    mockClinicDocuments = [];
    mockPharmacyDocuments = [];
    mockAppointments = [];
    mockPrescriptions = [];
    mockPrescriptionLines = [];
    mockSales = [];
    mockPayments = [];
    mockSaleItems = [];
    mockDeliveryOrders = [];
    mockDeliveryRoutes = [];
    mockGlobalSettings = [{ key: 'USD_EXCHANGE_RATE', value: '36.6' }];
    mockFamilyRelationships = [];
    mockInventory = [];
    mockInventoryBatches = [];
    mockAuditLogs = [];
    mockChatSessions = [];
    vi.clearAllMocks();
  });

  it('should successfully run all roles (Patient, Caregiver, Doctor, Receptionist, Pharmacy Manager, Cashier, Delivery Driver, Clinic Owner, Pharmacy Owner, Super Admin) through E2E flows', async () => {
    // --------------------------------------------------------------------------------
    // ROLE: SUPER ADMIN - Manage Global Configuration & Setup Minsas
    // --------------------------------------------------------------------------------
    mockUsers.push({
      id: 'admin-1',
      name: 'Super Admin',
      email: 'admin@oasis.com',
      role: 'admin',
      verificationStatus: 'approved'
    });

    const rateUpdate = await updateGlobalSetting('USD_EXCHANGE_RATE', '36.6', 'admin-1');
    expect(rateUpdate).toBeDefined();
    expect(mockGlobalSettings.find(s => s.key === 'USD_EXCHANGE_RATE').value).toBe('36.6');

    // --------------------------------------------------------------------------------
    // ROLES: CLINIC ADMIN & PHARMACY ADMIN - Entity Creation
    // --------------------------------------------------------------------------------
    const clinicAdminReg = await registerUser({
      name: 'Dr. Alejandro Clinic Owner',
      email: 'clinic.admin@oasis.com',
      passwordHash: 'hashed-password',
      role: 'clinic_admin',
      entityName: 'Clínica Oasis Managua',
      entityAddress: 'Bello Horizonte, Managua',
      entityPhone: '2244-8888',
      entityLatitude: 12.145,
      entityLongitude: -86.234
    });
    expect(clinicAdminReg.user).toBeDefined();
    expect(clinicAdminReg.user.role).toBe('clinic_admin');
    expect(clinicAdminReg.user.verificationStatus).toBe('pending');
    expect(mockClinics.length).toBe(1);
    const clinicId = mockClinics[0].id;
    expect(mockClinics[0].ownerId).toBe(clinicAdminReg.user.id);

    const pharmacyAdminReg = await registerUser({
      name: 'Lic. Martha Pharmacy Owner',
      email: 'pharmacy.admin@oasis.com',
      passwordHash: 'hashed-password',
      role: 'pharmacy_admin',
      entityName: 'Farmacia Oasis Principal',
      entityAddress: 'Altamira, Managua',
      entityPhone: '2277-9999',
      entityLatitude: 12.128,
      entityLongitude: -86.255
    });
    expect(pharmacyAdminReg.user).toBeDefined();
    expect(pharmacyAdminReg.user.role).toBe('pharmacy_admin');
    expect(mockPharmacies.length).toBe(1);
    const pharmacyId = mockPharmacies[0].id;
    expect(mockPharmacies[0].ownerId).toBe(pharmacyAdminReg.user.id);

    // --------------------------------------------------------------------------------
    // ROLE: SUPER ADMIN - Accreditation and Verification
    // --------------------------------------------------------------------------------
    const clinicDoc = await DocumentService.uploadClinicDocument(
      clinicId,
      clinicAdminReg.user.id,
      {
        type: 'LICENCIA_MINSA',
        documentUrl: 'uploads/clinics/license-minsa.pdf'
      }
    );
    expect(clinicDoc).toBeDefined();
    expect(clinicDoc.status).toBe('pending');

    const pharmacyDoc = await DocumentService.uploadPharmacyDocument(
      pharmacyId,
      pharmacyAdminReg.user.id,
      {
        type: 'REGISTRO_FARMACEUTICO',
        documentUrl: 'uploads/pharmacies/registry.pdf'
      }
    );
    expect(pharmacyDoc).toBeDefined();

    await DocumentService.uploadClinicDocument(
      clinicId,
      clinicAdminReg.user.id,
      { type: 'CONSTITUCION_LEGAL', documentUrl: 'uploads/clinics/const.pdf' }
    );
    const pendingDocs = await DocumentService.getPendingDocuments();
    expect(pendingDocs.totalPending).toBe(3); 

    const clinicDocsToVerify = mockClinicDocuments.filter(d => d.clinicId === clinicId);
    for (const doc of clinicDocsToVerify) {
      await DocumentService.verifyClinicDocument(doc.id, 'admin-1', 'approved');
    }
    const updatedClinicOwner = mockUsers.find(u => u.id === clinicAdminReg.user.id);
    expect(updatedClinicOwner.verificationStatus).toBe('approved');

    await DocumentService.uploadPharmacyDocument(
      pharmacyId,
      pharmacyAdminReg.user.id,
      { type: 'PERMISO_BOMBEROS', documentUrl: 'uploads/pharmacies/bomberos.pdf' }
    );
    const pharmacyDocsToVerify = mockPharmacyDocuments.filter(d => d.pharmacyId === pharmacyId);
    for (const doc of pharmacyDocsToVerify) {
      await DocumentService.verifyPharmacyDocument(doc.id, 'admin-1', 'approved');
    }
    const updatedPharmacyOwner = mockUsers.find(u => u.id === pharmacyAdminReg.user.id);
    expect(updatedPharmacyOwner.verificationStatus).toBe('approved');

    // --------------------------------------------------------------------------------
    // ROLE: CLINIC ADMIN & PHARMACY ADMIN - Worker Recruitment
    // --------------------------------------------------------------------------------
    const doctorEmployee = await createEmployeeDirectly(clinicAdminReg.user.id, {
      name: 'Dr. Roberto Mendoza',
      email: 'doctor.roberto@oasis.com',
      role: 'doctor',
      clinicId,
      specialty: 'Pediatría',
      licenseNumber: 'MINSA-12345'
    });
    expect(doctorEmployee).toBeDefined();
    expect(doctorEmployee.role).toBe('doctor');
    const doctorId = doctorEmployee.id;

    // Doctor configures their signature PIN
    const docProfileIdx = mockDoctorProfiles.findIndex(dp => dp.userId === doctorId);
    if (docProfileIdx !== -1) {
      mockDoctorProfiles[docProfileIdx].signaturePin = 'hashed-1234';
    }

    const receptionistEmployee = await createEmployeeDirectly(clinicAdminReg.user.id, {
      name: 'Sandra Gutierrez',
      email: 'sandra@oasis.com',
      role: 'receptionist',
      clinicId
    });
    expect(receptionistEmployee).toBeDefined();
    const receptionistId = receptionistEmployee.id;

    const cashierEmployee = await createEmployeeDirectly(pharmacyAdminReg.user.id, {
      name: 'Maria Cashier',
      email: 'maria.cashier@oasis.com',
      role: 'cashier',
      pharmacyId
    });
    expect(cashierEmployee).toBeDefined();
    const cashierId = cashierEmployee.id;

    const driverEmployee = await createEmployeeDirectly(pharmacyAdminReg.user.id, {
      name: 'Carlos Driver',
      email: 'carlos.driver@oasis.com',
      role: 'delivery_driver',
      pharmacyId,
      vehicleType: 'motocicleta',
      licensePlate: 'M-55432'
    });
    expect(driverEmployee).toBeDefined();
    const driverId = driverEmployee.id;

    // --------------------------------------------------------------------------------
    // ROLE: PATIENT & RECEPTIONIST - Scheduling & Check-In
    // --------------------------------------------------------------------------------
    const patientReg = await registerUser({
      name: 'Juan Perez Patient',
      email: 'juan.perez@gmail.com',
      passwordHash: 'hashed-pass',
      role: 'patient'
    });
    expect(patientReg.user).toBeDefined();
    const patientId = patientReg.user.id;

    const appointmentTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); 
    const appointment = await createAppointment({
      patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      date_time: appointmentTime,
      notes: 'Consulta rutinaria pediátrica'
    });
    expect(appointment).toBeDefined();
    expect(appointment.status).toBe('scheduled');

    // Confirm/Check-in appointment by receptionist: scheduled -> confirmed
    const confirmedApp = await updateAppointmentStatus(
      appointment.id,
      'confirmed',
      'receptionist',
      receptionistId
    );
    expect(confirmedApp.status).toBe('confirmed');

    // Start consultation by doctor: confirmed -> in_progress
    const inProgressApp = await updateAppointmentStatus(
      appointment.id,
      'in_progress',
      'doctor',
      doctorId
    );
    expect(inProgressApp.status).toBe('in_progress');

    // Complete consultation by doctor: in_progress -> completed
    const completedApp = await updateAppointmentStatus(
      appointment.id,
      'completed',
      'doctor',
      doctorId
    );
    expect(completedApp.status).toBe('completed');

    // --------------------------------------------------------------------------------
    // ROLE: DOCTOR - Consultation & Digital Prescribing
    // --------------------------------------------------------------------------------
    await DocumentService.uploadDoctorDocument(
      doctorId,
      { type: 'TITULO_MEDICO', documentUrl: 'uploads/doctors/titulo.pdf' }
    );
    await DocumentService.uploadDoctorDocument(
      doctorId,
      { type: 'REGISTRO_MINSA', documentUrl: 'uploads/doctors/minsa.pdf' }
    );
    await DocumentService.uploadDoctorDocument(
      doctorId,
      { type: 'ESPECIALIDAD', documentUrl: 'uploads/doctors/pediatria.pdf' }
    );
    const docDocs = mockDoctorDocuments.filter(d => d.doctorId === doctorId);
    for (const doc of docDocs) {
      await DocumentService.verifyDoctorDocument(doc.id, 'admin-1', 'approved');
    }
    const verifiedDoc = mockUsers.find(u => u.id === doctorId);
    expect(verifiedDoc.verificationStatus).toBe('approved');

    const expDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const prescription = await createPrescription(
      {
        patient_id: patientId,
        clinic_id: clinicId,
        expiration_date: expDate,
        signature_pin: '1234', 
        lines: [
          { medicine_id: 'med-ibuprofen', quantity: 3, dosage_instructions: '1 tableta cada 8 horas' }
        ]
      },
      doctorId
    );
    expect(prescription).toBeDefined();
    expect(prescription.status).toBe('active');
    expect(prescription.digitalSignature).toBeDefined();

    // --------------------------------------------------------------------------------
    // SUB-ROLE: CAREGIVER - Delegated Health Tasks
    // --------------------------------------------------------------------------------
    const caregiverReg = await registerUser({
      name: 'Sofia Caregiver (Mother)',
      email: 'sofia.mom@gmail.com',
      passwordHash: 'hashed-sofia',
      role: 'patient' 
    });
    const caregiverId = caregiverReg.user.id;

    await db.familyRelationship.create({
      data: {
        caregiverId,
        patientId,
        relationship: 'madre',
        status: 'active',
        permissions: ['buy_medicines', 'view_health_data']
      }
    });

    const inv = await db.inventory.create({
      data: {
        pharmacyId,
        medicineId: 'med-ibuprofen',
        quantity: 0, 
        minStock: 5,
        unitPrice: 40.0
      }
    });

    await db.inventoryBatch.create({
      data: {
        inventoryId: inv.id,
        batchNumber: 'LOTE-EXP-PRONTO',
        quantity: 10,
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    });
    await db.inventoryBatch.create({
      data: {
        inventoryId: inv.id,
        batchNumber: 'LOTE-EXP-TARDE',
        quantity: 20,
        expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    });

    const loadedInv = mockInventory.find(i => i.id === inv.id);
    expect(loadedInv.quantity).toBe(30);

    const validatedRx = await validatePrescription(prescription.qrCode, pharmacyId);
    expect(validatedRx).toBeDefined();
    expect(validatedRx.lines[0].batches.length).toBeGreaterThan(0);
    expect(validatedRx.lines[0].batches[0].batchNumber).toBe('LOTE-EXP-PRONTO');
    expect(validatedRx.lines[0].batches[0].quantityToDeduct).toBe(3);

    // --------------------------------------------------------------------------------
    // ROLE: CASHIER (PHARMACY MANAGER) - Mixed Currency checkout & Stock alert
    // --------------------------------------------------------------------------------
    const fulfilledRx = await fulfillPrescription(
      prescription.id,
      {
        pharmacy_id: pharmacyId,
        items: [
          {
            prescription_line_id: mockPrescriptionLines[0].id,
            quantity_fulfilled: 3,
            batches: [{ batch_id: mockInventoryBatches[0].id, quantity: 3 }]
          }
        ]
      },
      cashierId,
      pharmacyId
    );
    expect(fulfilledRx.status).toBe('fulfilled');
    expect(mockInventoryBatches[0].quantity).toBe(7);
    expect(mockInventory[0].quantity).toBe(27);

    const sale = await createSale(
      pharmacyId,
      {
        items: [{ medicine_id: 'med-ibuprofen', quantity: 3 }],
        prescription_id: prescription.id,
        is_delivery: true, 
        delivery_address: 'Colonia Centroamerica, Managua',
        delivery_lat: 12.112,
        delivery_lng: -86.241,
        payments: [
          { amount: 3, method: 'cash', currency: 'USD' },
          { amount: 12, method: 'cash', currency: 'NIO' }
        ]
      },
      patientId,
      cashierId
    );
    expect(sale).toBeDefined();
    expect(sale.status).toBe('pending');
    expect(sale.totalAmount).toBe(120.0);
    const registeredPayment = mockPayments.find(p => p.saleId === sale.id && p.currency === 'USD');
    expect(registeredPayment.notes).toBe('Vuelto/Cambio: C$1.80');

    await createSale(
      pharmacyId,
      {
        items: [{ medicine_id: 'med-ibuprofen', quantity: 23 }],
        is_delivery: false,
        payments: [{ amount: 23 * 40, method: 'cash', currency: 'NIO' }]
      },
      patientId,
      cashierId
    );
    expect(mockInventory[0].quantity).toBe(4); 

    // --------------------------------------------------------------------------------
    // ROLE: DELIVERY DRIVER - Dispatch, Telemetry GPS & Completion
    // --------------------------------------------------------------------------------
    const deliveryOrder = mockDeliveryOrders.find(o => o.saleId === sale.id);
    expect(deliveryOrder).toBeDefined();
    expect(deliveryOrder.status).toBe('pending');

    const assignedOrder = await updateDeliveryStatus(
      deliveryOrder.id,
      'assigned',
      'pharmacy_manager',
      cashierId,
      driverId
    );
    expect(assignedOrder.status).toBe('assigned');
    expect(assignedOrder.deliveryDriverId).toBe(driverId);

    const pickedUpOrder = await updateDeliveryStatus(
      deliveryOrder.id,
      'picked_up',
      'delivery_driver',
      driverId
    );
    expect(pickedUpOrder.status).toBe('picked_up');

    const inTransitOrder = await updateDeliveryStatus(
      deliveryOrder.id,
      'in_transit',
      'delivery_driver',
      driverId
    );
    expect(inTransitOrder.status).toBe('in_transit');

    const pts = [
      { lat: 12.128, lng: -86.255, timestamp: Date.now() - 10000 },
      { lat: 12.120, lng: -86.248, timestamp: Date.now() - 5000 },
      { lat: 12.112, lng: -86.241, timestamp: Date.now() }
    ];

    await db.deliveryRoute.createMany({
      data: pts.map(pt => ({
        deliveryOrderId: deliveryOrder.id,
        driverLat: pt.lat,
        driverLng: pt.lng,
        recordedAt: new Date(pt.timestamp)
      }))
    });
    expect(mockDeliveryRoutes.length).toBe(3);

    await db.deliveryDriverProfile.update({
      where: { userId: driverId },
      data: { currentLat: pts[2].lat, currentLng: pts[2].lng }
    });
    const updatedDriverProfile = mockDeliveryDriverProfiles.find(dd => dd.userId === driverId);
    expect(updatedDriverProfile.currentLat).toBe(12.112);

    const deliveredOrder = await updateDeliveryStatus(
      deliveryOrder.id,
      'delivered',
      'delivery_driver',
      driverId
    );
    expect(deliveredOrder.status).toBe('delivered');
    const finalSale = mockSales.find(s => s.id === sale.id);
    expect(finalSale.status).toBe('delivered');

    // --------------------------------------------------------------------------------
    // ROLE: CASHIER (PHARMACY MANAGER) - End-of-Day Settle & Discrepancies
    // --------------------------------------------------------------------------------
    const cashSummary = await getCashSummary(pharmacyId, 'pharmacy', new Date().toISOString().slice(0, 10));
    expect(cashSummary.expectedCash).toBe(1041.8);

    const reconciliation = await createCashReconciliation(cashierId, {
      entityId: pharmacyId,
      entityType: 'pharmacy',
      openingBalance: 0,
      actualCash: 1041.8,
      actualCard: 0
    });
    expect(reconciliation.status).toBe('conciliated');
    expect(reconciliation.discrepancies.total).toBe(0);

    // --------------------------------------------------------------------------------
    // ROLE: SUPER ADMIN - System Monitoring & Stats
    // --------------------------------------------------------------------------------
    const stats = await getAdminStats();
    expect(stats.total_users).toBeGreaterThan(0);
    expect(stats.total_patients).toBe(2); 
    expect(stats.total_doctors).toBe(1);
    expect(stats.total_clinics).toBe(1);
    expect(stats.total_pharmacies).toBe(1);
    expect(stats.total_appointments).toBe(1);
    expect(stats.total_prescriptions).toBe(1);
    expect(stats.monthly_revenue).toBe(1040.0); 
  });
});
