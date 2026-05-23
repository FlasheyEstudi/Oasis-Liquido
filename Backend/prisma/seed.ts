// OASIS - Seed Script (Fixed Deletion Order & Rich Nicaragua Data)
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏝️  OASIS - Seeding database with rich Nicaragua data...\n');

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

  // 1. Clinics (Nicaragua Coordinates)
  console.log('🏥 Creating clinics...');
  const clinics = await Promise.all([
    prisma.clinic.create({ data: { name: 'Clínica Central OASIS', address: 'Bello Horizonte, Managua', latitude: 12.1420, longitude: -86.2440, phone: '+505 2244-1122' } }),
    prisma.clinic.create({ data: { name: 'Clínica Los Robles', address: 'Los Robles, Managua', latitude: 12.1154, longitude: -86.2514, phone: '+505 2277-3344' } }),
    prisma.clinic.create({ data: { name: 'Clínica Plaza España', address: 'Plaza España, Managua', latitude: 12.1345, longitude: -86.2798, phone: '+505 2266-5566' } }),
    prisma.clinic.create({ data: { name: 'Clínica Central de Masaya', address: 'Parque Central, Masaya', latitude: 11.9744, longitude: -86.0942, phone: '+505 2522-7788' } }),
    prisma.clinic.create({ data: { name: 'Clínica Médica de León', address: 'El Sagrario, León', latitude: 12.4379, longitude: -86.8780, phone: '+505 2311-9900' } }),
  ]);

  // 2. Pharmacies (Nicaragua Coordinates)
  console.log('💊 Creating pharmacies...');
  const pharmacies = await Promise.all([
    prisma.pharmacy.create({ data: { name: 'Farmacia Metrocentro', address: 'Metrocentro, Managua', latitude: 12.1264, longitude: -86.2654, deliveryFee: 40, phone: '+505 8888-0001' } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia Galerías', address: 'Galerías Santo Domingo, Managua', latitude: 12.0950, longitude: -86.2350, deliveryFee: 50, phone: '+505 8888-0002' } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia Linda Vista', address: 'Linda Vista, Managua', latitude: 12.1520, longitude: -86.2970, deliveryFee: 35, phone: '+505 8888-0003' } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia Multicentro Las Américas', address: 'Multicentro Las Américas, Managua', latitude: 12.1465, longitude: -86.2305, deliveryFee: 45, phone: '+505 8888-0004' } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia La Estación Masaya', address: 'La Estación, Masaya', latitude: 11.9720, longitude: -86.0910, deliveryFee: 30, phone: '+505 8888-0005' } }),
    prisma.pharmacy.create({ data: { name: 'Farmacia El Sagrario León', address: 'Sagrario, León', latitude: 12.4350, longitude: -86.8750, deliveryFee: 40, phone: '+505 8888-0006' } }),
  ]);

  // 3. Medicines
  console.log('💉 Creating medicines...');
  const medicines = await Promise.all([
    prisma.medicine.create({ data: { name: 'Amoxicilina', genericName: 'Amoxicilina', description: 'Antibiótico potente de amplio espectro', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Paracetamol', genericName: 'Acetaminofén', description: 'Analgésico y antipirético para el alivio del dolor', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Ibuprofeno', genericName: 'Ibuprofeno', description: 'Antiinflamatorio no esteroideo (AINE)', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Loratadina', genericName: 'Loratadina', description: 'Antihistamínico para alergias y rinitis', requiresPrescription: false } }),
    prisma.medicine.create({ data: { name: 'Metformina', genericName: 'Metformina', description: 'Antidiabético oral para el control de glucosa', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Atorvastatina', genericName: 'Atorvastatina', description: 'Tratamiento para reducir el colesterol alto', requiresPrescription: true } }),
    prisma.medicine.create({ data: { name: 'Omeprazol', genericName: 'Omeprazol', description: 'Protector gástrico y antiácido estomacal', requiresPrescription: false } }),
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
      await prisma.doctorProfile.create({ data: { userId: user.id, clinicId: clinics[i % clinics.length].id, specialty: 'Cardiología', licenseNumber: `LIC-DEMO-${i}` } });
    } else if (role === 'receptionist') {
      await prisma.receptionistProfile.create({ data: { userId: user.id, clinicId: clinics[i % clinics.length].id } });
    } else if (role === 'delivery_driver') {
      await prisma.deliveryDriverProfile.create({ data: { userId: user.id, vehicleType: 'Motorcycle', licensePlate: `ABC-${i}23` } });
    }
  }

  // 5. Inventory and Batches for All Pharmacies
  console.log('📦 Creating rich inventory and FEFO batches...');
  const medicinePrices: Record<string, number> = {
    'Amoxicilina': 45.00,
    'Paracetamol': 15.50,
    'Ibuprofeno': 22.00,
    'Loratadina': 18.00,
    'Metformina': 65.00,
    'Atorvastatina': 85.00,
    'Omeprazol': 28.50,
  };

  for (const ph of pharmacies) {
    for (const med of medicines) {
      const price = medicinePrices[med.name] || 30.00;
      const inventory = await prisma.inventory.create({
        data: { 
          pharmacyId: ph.id, 
          medicineId: med.id, 
          quantity: 200, 
          unitPrice: price,
          minStock: 20 
        }
      });

      // Add two separate batches for FEFO expiration checks
      await prisma.inventoryBatch.createMany({
        data: [
          {
            inventoryId: inventory.id,
            batchNumber: `BATCH-${med.name.slice(0, 3).toUpperCase()}-JUN-2026`,
            quantity: 100,
            expirationDate: new Date('2026-06-30'),
            costPrice: price * 0.4,
            sellingPrice: price,
          },
          {
            inventoryId: inventory.id,
            batchNumber: `BATCH-${med.name.slice(0, 3).toUpperCase()}-DEC-2026`,
            quantity: 100,
            expirationDate: new Date('2026-12-31'),
            costPrice: price * 0.4,
            sellingPrice: price,
          }
        ]
      });
    }
  }

  // 6. Multiple Active Prescriptions for testing Checkout/Map matching
  console.log('📜 Creating multiple active prescriptions with different verification codes...');
  
  // Prescription 1: Paracetamol
  await prisma.prescription.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: clinics[0].id,
      status: 'active',
      verificationCode: 'DEMO-VERIFY-001',
      digitalSignature: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      notes: 'Tratamiento analgésico para dolor general',
      expirationDate: '2026-12-31',
      prescriptionLines: {
        create: {
          medicineId: medicines[1].id, // Paracetamol
          quantity: 6,
          dosageInstructions: '1 tableta cada 8 horas por 2 días'
        }
      }
    }
  });

  // Prescription 2: Amoxicilina + Ibuprofeno (Multi-item check)
  await prisma.prescription.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: clinics[1].id,
      status: 'active',
      verificationCode: 'DEMO-VERIFY-002',
      digitalSignature: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
      notes: 'Tratamiento antibiótico e inflamatorio para infección bucal',
      expirationDate: '2026-12-31',
      prescriptionLines: {
        create: [
          {
            medicineId: medicines[0].id, // Amoxicilina
            quantity: 10,
            dosageInstructions: '1 cápsula cada 8 horas por 7 días'
          },
          {
            medicineId: medicines[2].id, // Ibuprofeno
            quantity: 10,
            dosageInstructions: '1 tableta cada 12 horas por 5 días'
          }
        ]
      }
    }
  });

  // Prescription 3: Atorvastatina + Metformina (Chronic treatments)
  await prisma.prescription.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: clinics[2].id,
      status: 'active',
      verificationCode: 'DEMO-VERIFY-003',
      digitalSignature: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2',
      notes: 'Tratamiento crónico para diabetes y colesterol',
      expirationDate: '2026-12-31',
      prescriptionLines: {
        create: [
          {
            medicineId: medicines[4].id, // Metformina
            quantity: 30,
            dosageInstructions: '1 tableta con la cena diariamente'
          },
          {
            medicineId: medicines[5].id, // Atorvastatina
            quantity: 30,
            dosageInstructions: '1 tableta antes de acostarse diariamente'
          }
        ]
      }
    }
  });

  console.log('🏝️  Seed Complete successfully!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
