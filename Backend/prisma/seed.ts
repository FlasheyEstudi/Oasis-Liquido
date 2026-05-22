// OASIS - Seed Script (Fixed Deletion Order)
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏝️  OASIS - Seeding database...\n');

  // Clean existing data in correct order to respect FK constraints
  console.log('🧹 Cleaning existing data...');
  await prisma.deliveryRoute.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.prescriptionLine.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.pharmacyManagerProfile.deleteMany();
  await prisma.deliveryDriverProfile.deleteMany();
  await prisma.receptionistProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.clinic.deleteMany();
  
  const passwordHash = await hash('password123', 12);
  console.log('✅ Cleared existing data\n');

  // 1. Clinics
  console.log('🏥 Creating clinics...');
  const clinics = await Promise.all([
    prisma.clinic.create({ data: { name: 'Clínica Central OASIS', address: 'Managua, Nicaragua', latitude: 12.1278, longitude: -86.2708 } }),
    prisma.clinic.create({ data: { name: 'Clínica Los Robles', address: 'Los Robles, Managua', latitude: 12.1154, longitude: -86.2514 } }),
  ]);

  // 2. Pharmacies
  console.log('💊 Creating pharmacies...');
  const pharmacies = await Promise.all([
    prisma.pharmacy.create({ data: { name: 'Farmacia Metrocentro', address: 'Metrocentro, Managua', latitude: 12.1264, longitude: -86.2654, deliveryFee: 40 } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia Galerías', address: 'Galerías Santo Domingo', latitude: 12.0950, longitude: -86.2350, deliveryFee: 50 } }),
  ]);

  // 3. Medicines
  console.log('💉 Creating medicines...');
  const medicines = await Promise.all([
    prisma.medicine.create({ data: { name: 'Amoxicilina', genericName: 'Amoxicilina', description: 'Antibiótico', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Paracetamol', genericName: 'Acetaminofén', description: 'Analgésico', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Ibuprofeno', genericName: 'Ibuprofeno', description: 'Antiinflamatorio', requiresPrescription: false } }),
  ]);

  // 4. Users
  console.log('👥 Creating core users...');
  const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@oasis.com', passwordHash, role: 'admin' } });
  
  const doctor = await prisma.user.create({ 
    data: { 
      name: 'Dr. Morales', email: 'doctor@oasis.com', passwordHash, role: 'doctor',
      doctorProfile: { create: { clinicId: clinics[0].id, specialty: 'Medicina General', licenseNumber: 'LIC-001' } }
    } 
  });

  const patient = await prisma.user.create({ 
    data: { 
      name: 'María López', email: 'patient@oasis.com', passwordHash, role: 'patient',
      patientProfile: { create: { dateOfBirth: '1990-01-01', bloodType: 'O+' } }
    } 
  });

  const pharmacyMgr = await prisma.user.create({ 
    data: { 
      name: 'Jorge Vargas', email: 'pharmacy@oasis.com', passwordHash, role: 'pharmacy_manager',
      pharmacyManagerProfile: { create: { pharmacyId: pharmacies[0].id } }
    } 
  });

  console.log('👥 Generating 25+ additional demo users...');
  const roles = ['patient', 'doctor', 'receptionist', 'delivery_driver'];
  for (let i = 1; i <= 25; i++) {
    const role = roles[i % roles.length];
    const user = await prisma.user.create({
      data: {
        name: `Demo User ${i}`,
        email: `demo${i}@oasis.com`,
        passwordHash,
        role,
        isActive: true,
      }
    });

    // Create profile based on role
    if (role === 'patient') {
      await prisma.patientProfile.create({ data: { userId: user.id, dateOfBirth: '1985-05-15', bloodType: 'A+' } });
    } else if (role === 'doctor') {
      await prisma.doctorProfile.create({ data: { userId: user.id, clinicId: clinics[i % 2].id, specialty: 'Cardiología', licenseNumber: `LIC-DEMO-${i}` } });
    } else if (role === 'receptionist') {
      await prisma.receptionistProfile.create({ data: { userId: user.id, clinicId: clinics[i % 2].id } });
    } else if (role === 'delivery_driver') {
      await prisma.deliveryDriverProfile.create({ data: { userId: user.id, vehicleType: 'Motorcycle', licensePlate: `ABC-${i}23` } });
    }
  }

  // 5. Inventory and Batches
  console.log('📦 Creating inventory and batches...');
  const paracetamol = medicines[1];
  const amoxicilina = medicines[0];

  for (const ph of pharmacies) {
    for (const med of medicines) {
      const inventory = await prisma.inventory.create({
        data: { 
          pharmacyId: ph.id, 
          medicineId: med.id, 
          quantity: med.id === paracetamol.id ? 150 : 100, 
          unitPrice: 25.50,
          minStock: 20 
        }
      });

      // Add batches for Paracetamol (FEFO test)
      if (med.id === paracetamol.id) {
        await prisma.inventoryBatch.createMany({
          data: [
            {
              inventoryId: inventory.id,
              batchNumber: 'BATCH-JUN-2026',
              quantity: 50,
              expirationDate: new Date('2026-06-30'),
              costPrice: 10.0,
              sellingPrice: 25.5,
            },
            {
              inventoryId: inventory.id,
              batchNumber: 'BATCH-DEC-2026',
              quantity: 100,
              expirationDate: new Date('2026-12-31'),
              costPrice: 10.0,
              sellingPrice: 25.5,
            }
          ]
        });
      }
    }
  }

  // 6. Demo Prescription with Digital Signature
  console.log('📜 Creating demo prescription with digital signature...');
  await prisma.prescription.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: clinics[0].id,
      status: 'active',
      verificationCode: 'DEMO-VERIFY-001',
      digitalSignature: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      notes: 'Demo prescription for FEFO and Signature testing',
      expirationDate: '2026-12-31',
      prescriptionLines: {
        create: {
          medicineId: paracetamol.id,
          quantity: 5,
          dosageInstructions: 'Take 1 tablet every 8 hours'
        }
      }
    }
  });

  console.log('🏝️  Seed Complete!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
