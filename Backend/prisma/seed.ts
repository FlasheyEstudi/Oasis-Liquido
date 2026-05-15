// OASIS - Seed Script
// Populates the database with realistic test data for all entities
// Run with: bun run prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD_HASH = '$2a$12$LJ3tFv2Jq1Gz0Y3m5K8vOeXwN6rT9pQ2sA4bC6dE8fG0hI2jK4lM'; // Pre-hashed "password123"
// We'll hash it properly in the script

async function main() {
  console.log('🏝️  OASIS - Seeding database...\n');

  // Clean existing data
  await prisma.deliveryRoute.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.prescriptionLine.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.pharmacyManagerProfile.deleteMany();
  await prisma.deliveryDriverProfile.deleteMany();
  await prisma.receptionistProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.clinic.deleteMany();

  const passwordHash = await hash('password123', 12);
  console.log('✅ Cleared existing data\n');

  // ============================
  // 1. CLINICS
  // ============================
  console.log('🏥 Creating clinics...');
  const clinics = await Promise.all([
    prisma.clinic.create({
      data: { name: 'Clínica Central OASIS - Managua', address: 'Pista Juan Pablo II, Managua', latitude: 12.1278, longitude: -86.2708, phone: '+505 2222 5678' },
    }),
    prisma.clinic.create({
      data: { name: 'Clínica OASIS Los Robles', address: 'Los Robles, Managua', latitude: 12.1154, longitude: -86.2514, phone: '+505 2222 6789' },
    }),
    prisma.clinic.create({
      data: { name: 'Clínica OASIS Carretera Masaya', address: 'Km 10.5 Carr. Masaya', latitude: 12.0850, longitude: -86.2150, phone: '+505 2222 7890' },
    }),
  ]);
  console.log(`   Created ${clinics.length} clinics\n`);

  // ============================
  // 2. PHARMACIES
  // ============================
  console.log('💊 Creating pharmacies...');
  const pharmacies = await Promise.all([
    prisma.pharmacy.create({
      data: { name: 'Farmacia OASIS Metrocentro', address: 'Metrocentro, Managua', latitude: 12.1264, longitude: -86.2654, phone: '+505 2222 1111', deliveryFee: 40.00 },
    }),
    prisma.pharmacy.create({
      data: { name: 'Farmacia OASIS Galerías', address: 'Galerías Santo Domingo', latitude: 12.0950, longitude: -86.2350, phone: '+505 2222 3333', deliveryFee: 50.00 },
    }),
    prisma.pharmacy.create({
      data: { name: 'Farmacia OASIS Bello Horizonte', address: 'Bello Horizonte, Managua', latitude: 12.1450, longitude: -86.2450, phone: '+505 2222 5555', deliveryFee: 45.00 },
    }),
  ]);
  console.log(`   Created ${pharmacies.length} pharmacies\n`);

  // ============================
  // 3. MEDICINES
  // ============================
  console.log('💉 Creating medicines...');
  const medicines = await Promise.all([
    prisma.medicine.create({ data: { name: 'Amoxicilina', genericName: 'Amoxicilina', description: 'Antibiótico de amplio espectro', dosageForm: 'Cápsula', concentration: '500mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Paracetamol', genericName: 'Acetaminofén', description: 'Analgésico y antipirético', dosageForm: 'Tableta', concentration: '500mg', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Ibuprofeno', genericName: 'Ibuprofeno', description: 'Antiinflamatorio no esteroideo', dosageForm: 'Tableta', concentration: '400mg', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Omeprazol', genericName: 'Omeprazol', description: 'Inhibidor de la bomba de protones', dosageForm: 'Cápsula', concentration: '20mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Losartán', genericName: 'Losartán potásico', description: 'Antagonista de receptores de angiotensina II', dosageForm: 'Tableta', concentration: '50mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Metformina', genericName: 'Metformina', description: 'Biguanida para diabetes tipo 2', dosageForm: 'Tableta', concentration: '850mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Azitromicina', genericName: 'Azitromicina', description: 'Antibiótico macrólido', dosageForm: 'Tableta', concentration: '500mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Cetirizina', genericName: 'Cetirizina', description: 'Antihistamínico', dosageForm: 'Tableta', concentration: '10mg', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Salbutamol', genericName: 'Salbutamol', description: 'Broncodilatador inhalado', dosageForm: 'Inhalador', concentration: '100mcg/dosis', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Atorvastatina', genericName: 'Atorvastatina', description: 'Estatina para colesterol', dosageForm: 'Tableta', concentration: '20mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Lorazepam', genericName: 'Lorazepam', description: 'Benzodiacepina ansiolítico', dosageForm: 'Tableta', concentration: '1mg', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Diclofenaco', genericName: 'Diclofenaco sódico', description: 'Antiinflamatorio no esteroideo', dosageForm: 'Tableta', concentration: '50mg', requiresPrescription: true } }),
  ]);
  console.log(`   Created ${medicines.length} medicines\n`);

  // ============================
  // 4. USERS
  // ============================
  console.log('👥 Creating users...');

  // Admin
  const admin = await prisma.user.create({
    data: { name: 'Admin OASIS', email: 'admin@oasis.com', passwordHash, role: 'admin', phone: '+505 0000 0001', emailVerified: true },
  });

  // Patients
  const patients = await Promise.all([
    prisma.user.create({
      data: { name: 'María García López', email: 'maria@oasis.com', passwordHash, role: 'patient', phone: '+505 1111 0001', emailVerified: true,
        patientProfile: { create: { dateOfBirth: '1990-05-15', bloodType: 'O+', allergies: JSON.stringify(['Penicilina']), medicalNotes: 'Sin antecedentes relevantes' } } },
    }),
    prisma.user.create({
      data: { name: 'Carlos Rodríguez Martínez', email: 'carlos@oasis.com', passwordHash, role: 'patient', phone: '+505 2222 0002', emailVerified: true,
        patientProfile: { create: { dateOfBirth: '1985-11-22', bloodType: 'A-', allergies: JSON.stringify([]), medicalNotes: 'Hipertensión controlada' } } },
    }),
    prisma.user.create({
      data: { name: 'Ana Hernández Ruiz', email: 'ana@oasis.com', passwordHash, role: 'patient', phone: '+505 3333 0003', emailVerified: true,
        patientProfile: { create: { dateOfBirth: '1995-03-08', bloodType: 'B+', allergies: JSON.stringify(['Sulfonamidas', 'Aspirina']), medicalNotes: '' } } },
    }),
    prisma.user.create({
      data: { name: 'Roberto Sánchez Díaz', email: 'roberto@oasis.com', passwordHash, role: 'patient', phone: '+505 4444 0004', emailVerified: true,
        patientProfile: { create: { dateOfBirth: '1978-09-30', bloodType: 'AB+', allergies: JSON.stringify([]), medicalNotes: 'Diabetes tipo 2 diagnosticada en 2020' } } },
    }),
  ]);

  // Doctors
  const doctors = await Promise.all([
    prisma.user.create({
      data: { name: 'Dr. Fernando Morales Vega', email: 'fernando@oasis.com', passwordHash, role: 'doctor', phone: '+505 5555 0005', emailVerified: true,
        doctorProfile: { create: { clinicId: clinics[0].id, specialty: 'Medicina General', licenseNumber: 'LIC-12345' } } },
    }),
    prisma.user.create({
      data: { name: 'Dra. Patricia Ramírez Torres', email: 'patricia@oasis.com', passwordHash, role: 'doctor', phone: '+505 6666 0006', emailVerified: true,
        doctorProfile: { create: { clinicId: clinics[0].id, specialty: 'Cardiología', licenseNumber: 'LIC-23456' } } },
    }),
  ]);

  // Pharmacy Managers
  const pharmacyManagers = await Promise.all([
    prisma.user.create({
      data: { name: 'Lic. Jorge Vargas Mendoza', email: 'jorge@oasis.com', passwordHash, role: 'pharmacy_manager', phone: '+505 9999 0009', emailVerified: true,
        pharmacyManagerProfile: { create: { pharmacyId: pharmacies[0].id } } },
    }),
  ]);

  // Delivery Drivers
  const deliveryDrivers = await Promise.all([
    prisma.user.create({
      data: { name: 'Pedro Gutiérrez Luna', email: 'pedro@oasis.com', passwordHash, role: 'delivery_driver', phone: '+505 1212 0012', emailVerified: true,
        deliveryDriverProfile: { create: { vehicleType: 'motocicleta', licensePlate: 'MCD-1234', isAvailable: true, currentLat: 12.1364, currentLng: -86.2514 } } },
    }),
  ]);

  // Receptionists
  const receptionists = await Promise.all([
    prisma.user.create({
      data: { name: 'Lucía Navarro Ríos', email: 'lucia@oasis.com', passwordHash, role: 'receptionist', phone: '+505 1414 0014', emailVerified: true,
        receptionistProfile: { create: { clinicId: clinics[0].id } } },
    }),
  ]);

  // ============================
  // 5. INVENTORY
  // ============================
  console.log('📦 Creating inventory...');
  for (const pharmacy of pharmacies) {
    for (const medicine of medicines) {
      await prisma.inventory.create({
        data: {
          pharmacyId: pharmacy.id,
          medicineId: medicine.id,
          quantity: Math.floor(Math.random() * 100) + 20,
          minStock: 10,
          unitPrice: parseFloat((Math.random() * 200 + 15).toFixed(2)),
          batchNumber: `NI-${Math.random().toString(36).substring(7).toUpperCase()}`,
          expirationDate: '2026-12-31',
        },
      });
    }
  }

  // ============================
  // 6. REVIEWS & CHATS
  // ============================
  console.log('⭐ Creating reviews & chats...');
  await prisma.review.createMany({
    data: [
      { userId: patients[0].id, targetId: doctors[0].id, targetType: 'doctor', rating: 5, comment: 'Excelente atención, muy profesional.' },
      { userId: patients[1].id, targetId: pharmacies[0].id, targetType: 'pharmacy', rating: 4, comment: 'Entrega rápida y medicinas completas.' },
      { userId: patients[2].id, targetId: deliveryDrivers[0].id, targetType: 'driver', rating: 5, comment: 'Muy amable y puntual.' },
    ]
  });

  const chat = await prisma.chatSession.create({
    data: {
      type: 'appointment',
      targetId: 'demo-session',
      participants: {
        create: [
          { userId: patients[0].id },
          { userId: doctors[0].id }
        ]
      }
    }
  });

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: chat.id, senderId: doctors[0].id, content: 'Hola María, ¿cómo sigues con el tratamiento?' },
      { sessionId: chat.id, senderId: patients[0].id, content: 'Hola Dr. Mucho mejor, gracias.' },
    ]
  });

  console.log('🏝️  OASIS - Seed Complete!');
  console.log('\n📧 Test Accounts (password: password123):');
  console.log('  👤 Admin:       admin@oasis.com');
  console.log('  🏥 Patient:     maria@oasis.com');
  console.log('  🩺 Doctor:      fernando@oasis.com');
  console.log('  💊 PharmMgr:    jorge@oasis.com');
  console.log('  🚚 Driver:      pedro@oasis.com');
  console.log('  📋 Receptionist: lucia@oasis.com');
  console.log('\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
