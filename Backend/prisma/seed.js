const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🏝️  OASIS - Seeding Extensive Nicaragua Ecosystem...\n');

  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
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

  const passwordHash = await bcrypt.hash('password123', 12);
  console.log('✅ Cleared existing data\n');

  // ============================
  // 1. CLINICS
  // ============================
  console.log('🏥 Creating clinics...');
  const clinics = await Promise.all([
    prisma.clinic.create({ data: { name: 'Hospital Metropolitano Vivian Pellas', address: 'Km 9.7 Carretera a Masaya', latitude: 12.0850, longitude: -86.2150, phone: '+505 2255 6900' } }),
    prisma.clinic.create({ data: { name: 'Hospital Militar Dr. Alejandro Dávila Bolaños', address: 'Avenida Bolivar, Managua', latitude: 12.1350, longitude: -86.2750, phone: '+505 2222 1234' } }),
    prisma.clinic.create({ data: { name: 'Centro Médico Bautista', address: 'Reparto Lomas de Guadalupe', latitude: 12.1250, longitude: -86.2550, phone: '+505 2249 7070' } }),
  ]);

  // ============================
  // 2. PHARMACIES
  // ============================
  console.log('💊 Creating pharmacies...');
  const pharmacies = await Promise.all([
    prisma.pharmacy.create({ data: { name: 'Farmacia Saba - Metrocentro', address: 'Metrocentro 1er Nivel', latitude: 12.1264, longitude: -86.2654, phone: '+505 2271 9111', deliveryFee: 40.00 } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia Kielsa - Los Robles', address: 'Lomas de Guadalupe, Los Robles', latitude: 12.1150, longitude: -86.2520, phone: '+505 2222 5555', deliveryFee: 35.00 } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia Medco - Galerías', address: 'Centro Comercial Galerías', latitude: 12.0950, longitude: -86.2350, phone: '+505 2276 5000', deliveryFee: 50.00 } }),
  ]);

  // ============================
  // 3. MEDICINES
  // ============================
  const meds = [
    { name: 'Amoxicilina', generic: 'Amoxicilina', form: 'capsule', price: 15.5 },
    { name: 'Panadol Forte', generic: 'Acetaminofén', form: 'tablet', price: 5.0 },
    { name: 'Advil', generic: 'Ibuprofeno', form: 'capsule', price: 12.0 },
    { name: 'Nexium', generic: 'Esomeprazol', form: 'capsule', price: 45.0 },
    { name: 'Lantus SoloStar', generic: 'Insulina Glargina', form: 'injection', price: 850.0 },
    { name: 'Ventolin', generic: 'Salbutamol', form: 'inhaler', price: 320.0 },
  ];
  
  const createdMeds = await Promise.all(meds.map(m => 
    prisma.medicine.create({ data: { name: m.name, genericName: m.generic, dosageForm: m.form, requiresPrescription: true } })
  ));

  // ============================
  // 4. USERS & STAFF
  // ============================
  console.log('👥 Creating staff and users...');

  // Admin
  await prisma.user.create({ data: { name: 'Oasis Admin', email: 'admin@oasis.com', passwordHash, role: 'admin' } });

  // Patients
  const patients = await Promise.all([
    prisma.user.create({ data: { name: 'María Selva', email: 'maria@oasis.com', passwordHash, role: 'patient', patientProfile: { create: { dateOfBirth: '1992-04-12', bloodType: 'O+' } } } }),
    prisma.user.create({ data: { name: 'Juan Pérez', email: 'juan@oasis.com', passwordHash, role: 'patient', patientProfile: { create: { dateOfBirth: '1988-08-25', bloodType: 'A+' } } } }),
  ]);

  // Doctors
  const doctors = await Promise.all([
    prisma.user.create({ data: { name: 'Dr. Alejandro Zelaya', email: 'zelaya@oasis.com', passwordHash, role: 'doctor', doctorProfile: { create: { clinicId: clinics[0].id, specialty: 'Cardiología', licenseNumber: 'NI-MC-001' } } } }),
    prisma.user.create({ data: { name: 'Dra. Xiomara Castro', email: 'xiomara@oasis.com', passwordHash, role: 'doctor', doctorProfile: { create: { clinicId: clinics[1].id, specialty: 'Pediatría', licenseNumber: 'NI-MC-002' } } } }),
    prisma.user.create({ data: { name: 'Dr. Roberto Cuadra', email: 'cuadra@oasis.com', passwordHash, role: 'doctor', doctorProfile: { create: { clinicId: clinics[0].id, specialty: 'Medicina Interna', licenseNumber: 'NI-MC-003' } } } }),
  ]);

  // Pharmacy Managers & Staff
  const pharmStaff = await Promise.all([
    prisma.user.create({ data: { name: 'Lic. Jorge Vargas', email: 'jorge@oasis.com', passwordHash, role: 'pharmacy_manager', pharmacyManagerProfile: { create: { pharmacyId: pharmacies[0].id } } } }),
    prisma.user.create({ data: { name: 'Auxiliar Ana Leyton', email: 'ana@oasis.com', passwordHash, role: 'pharmacy_manager', pharmacyManagerProfile: { create: { pharmacyId: pharmacies[0].id } } } }),
  ]);

  // Drivers
  const drivers = await Promise.all([
    prisma.user.create({ data: { name: 'Pedro Motorizado', email: 'pedro@oasis.com', passwordHash, role: 'delivery_driver', deliveryDriverProfile: { create: { vehicleType: 'motocicleta', isAvailable: true, currentLat: 12.1364, currentLng: -86.2514 } } } }),
    prisma.user.create({ data: { name: 'Carlos Express', email: 'carlos@oasis.com', passwordHash, role: 'delivery_driver', deliveryDriverProfile: { create: { vehicleType: 'automóvil', isAvailable: true, currentLat: 12.1100, currentLng: -86.2400 } } } }),
  ]);

  // Receptionists & Clinic Admins
  await Promise.all([
    prisma.user.create({ data: { name: 'Admin Clínica Vivian', email: 'admin.clinica@oasis.com', passwordHash, role: 'admin' } }),
    prisma.user.create({ data: { name: 'Lucía Recepción', email: 'lucia@oasis.com', passwordHash, role: 'receptionist', receptionistProfile: { create: { clinicId: clinics[0].id } } } }),
    prisma.user.create({ data: { name: 'Marcos Recepción', email: 'marcos@oasis.com', passwordHash, role: 'receptionist', receptionistProfile: { create: { clinicId: clinics[1].id } } } }),
  ]);

  // ============================
  // 5. INVENTORY & TRANSACTIONS
  // ============================
  console.log('📦 Finalizing inventory and history...');
  for (const ph of pharmacies) {
    for (const med of createdMeds) {
      const inv = await prisma.inventory.create({
        data: { pharmacyId: ph.id, medicineId: med.id, quantity: 100, unitPrice: 50.0, batchNumber: 'NI-EXP-01' }
      });
      // Add initial movement for Kardex
      await prisma.inventoryMovement.create({
        data: { inventoryId: inv.id, type: 'restock', quantityChange: 100, reason: 'Carga inicial del sistema' }
      });
    }
  }

  // Sample Review
  await prisma.review.create({
    data: { userId: patients[0].id, targetId: doctors[0].id, targetType: 'doctor', rating: 5, comment: 'Excelente cardiólogo, muy atento.' }
  });

  console.log('\n✅ OASIS ECOSYSTEM SEEDED SUCCESSFULLY!');
  console.log('----------------------------------------');
  console.log('Admin: admin@oasis.com');
  console.log('Patient: maria@oasis.com');
  console.log('Doctor: zelaya@oasis.com');
  console.log('Pharmacy: jorge@oasis.com');
  console.log('Driver: pedro@oasis.com');
  console.log('Reception: lucia@oasis.com');
  console.log('Password: password123');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
