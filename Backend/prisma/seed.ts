// OASIS - Rich Nicaragua Seed Script for clinic_admin, pharmacy_admin, staff, stock, and prescriptions
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌿 OASIS - Seeding database with fully-populated clinic_admin, pharmacy_admin, staff, stock and prescriptions...\n');

  // Clean existing data in correct order to respect FK constraints
  console.log('🧹 Cleaning existing data...');
  await prisma.familyRelationship.deleteMany();
  await prisma.doctorDocument.deleteMany();
  await prisma.clinicDocument.deleteMany();
  await prisma.deliveryRoute.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.prescriptionLine.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryBatch.deleteMany();
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
  const clinic1 = await prisma.clinic.create({
    data: {
      name: 'Clínica Metropolitana de Nicaragua',
      address: 'Frente a Metrocentro, Managua',
      latitude: 12.1264,
      longitude: -86.2654,
      phone: '+505 2270-1234',
      isActive: true,
    }
  });

  const clinic2 = await prisma.clinic.create({
    data: {
      name: 'Clínica San Lucas León',
      address: 'De la Catedral 2 cuadras al oeste, León',
      latitude: 12.4379,
      longitude: -86.8780,
      phone: '+505 2311-4321',
      isActive: true,
    }
  });

  const clinic3 = await prisma.clinic.create({
    data: {
      name: 'Centro Médico San Jerónimo Masaya',
      address: 'De las Siete Esquinas 1 cuadra al sur, Masaya',
      latitude: 11.9720,
      longitude: -86.0980,
      phone: '+505 2522-8888',
      isActive: true,
    }
  });

  const clinic4 = await prisma.clinic.create({
    data: {
      name: 'Clínica La Gran Sultana Granada',
      address: 'Calle La Calzada, frente a Iglesia Guadalupe, Granada',
      latitude: 11.9295,
      longitude: -85.9520,
      phone: '+505 2552-4444',
      isActive: true,
    }
  });

  // 2. Pharmacies
  console.log('💊 Creating pharmacies...');
  const pharmacy1 = await prisma.pharmacy.create({
    data: {
      name: 'Farmacia Oasis Principal',
      address: 'Plaza España 1 cuadra al sur, Managua',
      latitude: 12.1345,
      longitude: -86.2798,
      phone: '+505 2266-9988',
      deliveryFee: 40.00,
      isActive: true,
    }
  });

  const pharmacy2 = await prisma.pharmacy.create({
    data: {
      name: 'Farmacia Oasis León',
      address: 'Frente a Parque Central, León',
      latitude: 12.4350,
      longitude: -86.8750,
      phone: '+505 2315-8899',
      deliveryFee: 50.00,
      isActive: true,
    }
  });

  const pharmacy3 = await prisma.pharmacy.create({
    data: {
      name: 'Farmacia Oasis Granada',
      address: 'De la Esquina de la Sirena 1/2 cuadra al este, Granada',
      latitude: 11.9310,
      longitude: -85.9570,
      phone: '+505 2552-9999',
      deliveryFee: 45.00,
      isActive: true,
    }
  });

  const pharmacy4 = await prisma.pharmacy.create({
    data: {
      name: 'Farmacia Oasis Estelí',
      address: 'Avenida Central, contiguo a Catedral de Estelí, Estelí',
      latitude: 13.0920,
      longitude: -86.3540,
      phone: '+505 2713-1111',
      deliveryFee: 55.00,
      isActive: true,
    }
  });

  // 3. Admin Users
  console.log('👑 Creating Superadmin, Clinic Admin and Pharmacy Admin...');
  
  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Administrador Oasis',
      email: 'admin@oasis.com',
      passwordHash,
      role: 'admin',
      phone: '+505 8888-0000',
      isActive: true,
      emailVerified: true,
      verificationStatus: 'approved'
    }
  });

  // Clinic Admin
  const clinicAdminUser = await prisma.user.create({
    data: {
      name: 'Dr. Alejandro Montenegro',
      email: 'clinic.admin@oasis.com',
      passwordHash,
      role: 'clinic_admin',
      phone: '+505 7777-1111',
      isActive: true,
      emailVerified: true,
      verificationStatus: 'approved',
      verificationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  // Vincular la clínica al administrador de clínica
  await prisma.clinic.update({
    where: { id: clinic1.id },
    data: { ownerId: clinicAdminUser.id }
  });

  // Pharmacy Admin
  const pharmacyAdminUser = await prisma.user.create({
    data: {
      name: 'Lic. Martha Lorena Zelaya',
      email: 'pharmacy.admin@oasis.com',
      passwordHash,
      role: 'pharmacy_admin',
      phone: '+505 7777-2222',
      isActive: true,
      emailVerified: true,
      verificationStatus: 'approved',
      verificationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  // Vincular la farmacia al administrador de farmacia
  await prisma.pharmacy.update({
    where: { id: pharmacy1.id },
    data: { ownerId: pharmacyAdminUser.id }
  });

  // 4. Patients
  console.log('👤 Creating patients...');
  const patient1 = await prisma.user.create({
    data: {
      name: 'Juan José Pérez',
      email: 'patient1@oasis.com',
      passwordHash,
      role: 'patient',
      phone: '+505 8899-7766',
      isActive: true,
      emailVerified: true,
      patientProfile: {
        create: {
          dateOfBirth: '1984-05-12',
          bloodType: 'O+',
          allergies: JSON.stringify(['Penicilina']),
          medicalNotes: 'Paciente hipertenso bajo control.'
        }
      }
    }
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Sofía Isabel Blandón',
      email: 'patient2@oasis.com',
      passwordHash,
      role: 'patient',
      phone: '+505 8456-1234',
      isActive: true,
      emailVerified: true,
      patientProfile: {
        create: {
          dateOfBirth: '1995-11-23',
          bloodType: 'A-',
          allergies: JSON.stringify([]),
          medicalNotes: 'Control rutinario.'
        }
      }
    }
  });

  // 5. Staff under Clinic Admin
  console.log('🩺 Creating Clinic staff (Doctors, Receptionists)...');
  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. Ramiro Gutiérrez',
      email: 'dr.gutierrez@oasis.com',
      passwordHash,
      role: 'doctor',
      phone: '+505 8812-3456',
      isActive: true,
      emailVerified: true,
      doctorProfile: {
        create: {
          clinicId: clinic1.id,
          specialty: 'Cardiología',
          licenseNumber: 'MINSA-12940',
          signaturePin: '1234'
        }
      }
    }
  });

  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dra. Elena Rostrán',
      email: 'dra.rostran@oasis.com',
      passwordHash,
      role: 'doctor',
      phone: '+505 8823-4567',
      isActive: true,
      emailVerified: true,
      doctorProfile: {
        create: {
          clinicId: clinic1.id,
          specialty: 'Pediatría',
          licenseNumber: 'MINSA-14302',
          signaturePin: '1234'
        }
      }
    }
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Auxiliadora Espinoza',
      email: 'recepcion@oasis.com',
      passwordHash,
      role: 'receptionist',
      phone: '+505 8834-5678',
      isActive: true,
      emailVerified: true,
      receptionistProfile: {
        create: {
          clinicId: clinic1.id
        }
      }
    }
  });

  // 6. Staff under Pharmacy Admin
  console.log('🛒 Creating Pharmacy staff (Managers/Cashiers, Delivery Drivers)...');
  const cashier = await prisma.user.create({
    data: {
      name: 'Carlos Manuel Gómez',
      email: 'cajero@oasis.com',
      passwordHash,
      role: 'pharmacy_manager',
      phone: '+505 8845-6789',
      isActive: true,
      emailVerified: true,
      pharmacyManagerProfile: {
        create: {
          pharmacyId: pharmacy1.id
        }
      }
    }
  });

  const driver1 = await prisma.user.create({
    data: {
      name: 'Néstor Danilo Ruiz',
      email: 'repartidor1@oasis.com',
      passwordHash,
      role: 'delivery_driver',
      phone: '+505 8856-7890',
      isActive: true,
      emailVerified: true,
      deliveryDriverProfile: {
        create: {
          pharmacyId: pharmacy1.id,
          vehicleType: 'motocicleta',
          licensePlate: 'M-54210',
          isAvailable: true,
          employmentType: 'contractor',
          baseSalary: 120.00
        }
      }
    }
  });

  const driver2 = await prisma.user.create({
    data: {
      name: 'Bayardo José López',
      email: 'repartidor2@oasis.com',
      passwordHash,
      role: 'delivery_driver',
      phone: '+505 8867-8901',
      isActive: true,
      emailVerified: true,
      deliveryDriverProfile: {
        create: {
          pharmacyId: pharmacy1.id,
          vehicleType: 'bicicleta',
          licensePlate: 'BICI-OASIS-01',
          isAvailable: true,
          employmentType: 'employee',
          baseSalary: 80.00
        }
      }
    }
  });

  // 7. Medicines
  console.log('💊 Creating rich catalog of medicines...');
  const medicines = await Promise.all([
    prisma.medicine.create({
      data: {
        name: 'Amoxicilina 500mg',
        genericName: 'Amoxicilina',
        description: 'Antibiótico de amplio espectro para infecciones bacterianas.',
        dosageForm: 'Cápsulas',
        concentration: '500mg',
        requiresPrescription: true,
        isActive: true,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Acetaminofén 500mg',
        genericName: 'Paracetamol',
        description: 'Analgésico y antipirético para el alivio del dolor y la fiebre.',
        dosageForm: 'Tabletas',
        concentration: '500mg',
        requiresPrescription: false,
        isActive: true,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Ibuprofeno 400mg',
        genericName: 'Ibuprofeno',
        description: 'Antiinflamatorio no esteroideo (AINE) para aliviar inflamación y dolor severo.',
        dosageForm: 'Tabletas',
        concentration: '400mg',
        requiresPrescription: false,
        isActive: true,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Metformina 850mg',
        genericName: 'Metformina Clorhidrato',
        description: 'Medicamento oral para el tratamiento de la diabetes tipo 2.',
        dosageForm: 'Tabletas de liberación prolongada',
        concentration: '850mg',
        requiresPrescription: true,
        isActive: true,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Atorvastatina 20mg',
        genericName: 'Atorvastatina Cálcica',
        description: 'Estatina utilizada para disminuir los niveles de colesterol en sangre.',
        dosageForm: 'Tabletas',
        concentration: '20mg',
        requiresPrescription: true,
        isActive: true,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Loratadina 10mg',
        genericName: 'Loratadina',
        description: 'Antihistamínico de segunda generación para alergias.',
        dosageForm: 'Tabletas',
        concentration: '10mg',
        requiresPrescription: false,
        isActive: true,
      }
    })
  ]);

  // 8. Stock & FEFO Batches for Pharmacy 1
  console.log('📦 Populating stock and FEFO batches for Oasis Principal...');
  const medicinePrices: Record<string, number> = {
    'Amoxicilina 500mg': 65.00,
    'Acetaminofén 500mg': 18.00,
    'Ibuprofeno 400mg': 25.00,
    'Metformina 850mg': 85.00,
    'Atorvastatina 20mg': 110.00,
    'Loratadina 10mg': 22.00,
  };

  for (const med of medicines) {
    const price = medicinePrices[med.name] || 35.00;
    const inventory = await prisma.inventory.create({
      data: {
        pharmacyId: pharmacy1.id,
        medicineId: med.id,
        quantity: 350,
        minStock: 25,
        unitPrice: price,
      }
    });

    // Crear lotes FEFO
    await prisma.inventoryBatch.create({
      data: {
        inventoryId: inventory.id,
        batchNumber: `LOTE-${med.name.slice(0, 3).toUpperCase()}-26A`,
        quantity: 150,
        costPrice: price * 0.45,
        sellingPrice: price,
        expirationDate: new Date('2026-08-30'),
        supplier: 'Distribuidora Médica Cruz Azul'
      }
    });

    await prisma.inventoryBatch.create({
      data: {
        inventoryId: inventory.id,
        batchNumber: `LOTE-${med.name.slice(0, 3).toUpperCase()}-26B`,
        quantity: 200,
        costPrice: price * 0.42,
        sellingPrice: price,
        expirationDate: new Date('2026-12-31'),
        supplier: 'Laboratorios Ramos S.A.'
      }
    });

    // Registrar movimiento de inventario inicial
    await prisma.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        type: 'restock',
        quantityChange: 350,
        reason: 'Carga inicial del sistema (Seed)',
      }
    });
  }

  // 9. Prescriptions
  console.log('📜 Creating active, expired, and pending prescriptions...');
  
  // Receta 1: Amoxicilina (Activa, lista para surtir)
  const prescription1 = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      clinicId: clinic1.id,
      status: 'active',
      verificationCode: 'REC-OASIS-321',
      qrCode: 'QR-OASIS-AMOXICILINA-321',
      digitalSignature: crypto.randomBytes(32).toString('hex'),
      notes: 'Tomar con abundante agua. Completar el ciclo de 7 días sin interrupciones.',
      expirationDate: '2026-08-01',
      prescriptionLines: {
        create: {
          medicineId: medicines[0].id, // Amoxicilina
          quantity: 21,
          dosageInstructions: '1 cápsula cada 8 horas por 7 días'
        }
      }
    }
  });

  // Receta 2: Metformina + Atorvastatina (Crónicos, activa)
  const prescription2 = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      clinicId: clinic1.id,
      status: 'active',
      verificationCode: 'REC-CRONICO-900',
      qrCode: 'QR-OASIS-CRONICO-900',
      digitalSignature: crypto.randomBytes(32).toString('hex'),
      notes: 'Tratamiento de control mensual de glucosa y colesterol.',
      expirationDate: '2026-12-31',
      prescriptionLines: {
        create: [
          {
            medicineId: medicines[3].id, // Metformina
            quantity: 30,
            dosageInstructions: '1 tableta con la cena diariamente'
          },
          {
            medicineId: medicines[4].id, // Atorvastatina
            quantity: 30,
            dosageInstructions: '1 tableta antes de dormir diariamente'
          }
        ]
      }
    }
  });

  // Receta 3: Acetaminofén (Ya surtida en el pasado)
  const prescription3 = await prisma.prescription.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      clinicId: clinic1.id,
      status: 'fulfilled',
      verificationCode: 'REC-SURTIDA-101',
      qrCode: 'QR-OASIS-SURTIDA-101',
      digitalSignature: crypto.randomBytes(32).toString('hex'),
      notes: 'Alivio sintomático.',
      expirationDate: '2026-02-15',
      fulfilledAt: new Date('2026-02-10'),
      fulfilledPharmacyId: pharmacy1.id,
      prescriptionLines: {
        create: {
          medicineId: medicines[1].id, // Acetaminofén
          quantity: 10,
          dosageInstructions: '1 tableta cada 6 horas en caso de fiebre'
        }
      }
    }
  });

  // 10. Appointments
  console.log('📅 Scheduling appointments...');
  const today = new Date();
  
  // Cita de hoy (Dr. Gutiérrez con Paciente 1)
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      clinicId: clinic1.id,
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      durationMinutes: 30,
      status: 'confirmed',
      notes: 'Control general de hipertensión arterial.'
    }
  });

  // Cita de mañana (Dra. Rostrán con Paciente 2)
  const appt2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      clinicId: clinic1.id,
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 30, 0),
      durationMinutes: 30,
      status: 'scheduled',
      notes: 'Chequeo de crecimiento pediátrico.'
    }
  });

  // Cita completada con su respectiva receta
  const appt3 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      clinicId: clinic1.id,
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 9, 30, 0),
      durationMinutes: 30,
      status: 'completed',
      notes: 'Consulta médica completada con éxito. Paciente refiere mejoría.'
    }
  });

  // 11. Sales & Cash Flow (Para Arqueo de Caja y Gráficas de Dashboard)
  console.log('💰 Creating sales, cash flow and deliveries...');
  
  // Venta de ayer (Efectivo)
  const sale1 = await prisma.sale.create({
    data: {
      pharmacyId: pharmacy1.id,
      patientId: patient1.id,
      prescriptionId: prescription3.id,
      totalAmount: 180.00,
      status: 'completed',
      isDelivery: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      saleItems: {
        create: {
          medicineId: medicines[1].id, // Acetaminofén
          quantity: 10,
          unitPrice: 18.00
        }
      },
      payments: {
        create: {
          method: 'cash',
          amount: 180.00,
          currency: 'NIO',
          status: 'completed'
        }
      }
    }
  });

  // Venta de hoy (Pago Compuesto / Split Payment: Tarjeta + Transferencia)
  const sale2 = await prisma.sale.create({
    data: {
      pharmacyId: pharmacy1.id,
      patientId: patient2.id,
      totalAmount: 250.00,
      status: 'completed',
      isDelivery: true,
      deliveryAddress: 'Altamira, de la Vicky 2c al sur, Managua',
      deliveryLat: 12.1194,
      deliveryLng: -86.2554,
      deliveryNotes: 'Entregar en portería principal.',
      saleItems: {
        create: [
          {
            medicineId: medicines[2].id, // Ibuprofeno
            quantity: 4,
            unitPrice: 25.00
          },
          {
            medicineId: medicines[5].id, // Loratadina
            quantity: 5,
            unitPrice: 22.00
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'card',
            amount: 150.00,
            currency: 'NIO',
            status: 'completed'
          },
          {
            method: 'bank_transfer',
            amount: 100.00,
            currency: 'NIO',
            status: 'completed'
          }
        ]
      }
    }
  });

  // Crear Delivery para la venta 2
  await prisma.deliveryOrder.create({
    data: {
      saleId: sale2.id,
      pharmacyId: pharmacy1.id,
      patientId: patient2.id,
      deliveryDriverId: driver1.id,
      pickupAddress: pharmacy1.address,
      pickupLat: pharmacy1.latitude,
      pickupLng: pharmacy1.longitude,
      deliveryAddress: sale2.deliveryAddress!,
      deliveryLat: sale2.deliveryLat!,
      deliveryLng: sale2.deliveryLng!,
      status: 'in_transit',
      assignedAt: new Date(),
      pickedUpAt: new Date(),
      notes: 'Cliente solicitó entrega express.'
    }
  });

  // 12. Legal Documents Uploaded (Para simular la verificación en el dashboard de Superadmin)
  console.log('📄 Uploading mock compliance legal documents...');
  
  // Documentos de la Clínica
  await prisma.clinicDocument.create({
    data: {
      clinicId: clinic1.id,
      type: 'sanitary_permit',
      documentUrl: '/uploads/documents/minsa-licencia-clinica1.pdf',
      status: 'pending',
      uploadedBy: clinicAdminUser.id,
      notes: 'Permiso de Funcionamiento Sanitario emitido por el Silais Managua en Marzo 2026.'
    }
  });

  await prisma.clinicDocument.create({
    data: {
      clinicId: clinic1.id,
      type: 'ruc',
      documentUrl: '/uploads/documents/ruc-clinica1.pdf',
      status: 'pending',
      uploadedBy: clinicAdminUser.id,
      notes: 'RUC de Persona Jurídica para facturación.'
    }
  });

  // Documentos del Doctor 1 (Licencia Médica)
  await prisma.doctorDocument.create({
    data: {
      doctorId: doctor1.id,
      type: 'license',
      documentUrl: '/uploads/documents/cedula-profesional-dr1.pdf',
      status: 'pending',
      notes: 'Cédula profesional del MINSA para prescripción de psicotrópicos.'
    }
  });

  // 13. Global Settings
  console.log('⚙️ Seeding global settings...');
  const dbAny = prisma as any;
  await dbAny.globalSetting.upsert({
    where: { key: 'delivery_fee_per_km' },
    update: {},
    create: {
      key: 'delivery_fee_per_km',
      value: '15.00',
      description: 'Tarifa de delivery cobrada por cada kilómetro recorrido desde la farmacia (NIO).'
    }
  });

  await dbAny.globalSetting.upsert({
    where: { key: 'vat_percentage' },
    update: {},
    create: {
      key: 'vat_percentage',
      value: '15.00',
      description: 'Porcentaje del Impuesto sobre el Valor Agregado (IVA) aplicable a ventas de servicios/medicinas.'
    }
  });

  console.log('\n🏝️  OASIS - Seeding completed successfully!');
  console.log('\n🚀 Cuentas de Acceso Creadas:');
  console.log('--------------------------------------------------');
  console.log('👑 Superadmin:      admin@oasis.com         / password123');
  console.log('🏥 Admin Clínica:   clinic.admin@oasis.com  / password123');
  console.log('💊 Admin Farmacia:  pharmacy.admin@oasis.com / password123');
  console.log('🩺 Doctor:          dr.gutierrez@oasis.com   / password123');
  console.log('🛒 Cajero/Manager:  cajero@oasis.com         / password123');
  console.log('🛵 Repartidor:      repartidor1@oasis.com    / password123');
  console.log('👤 Paciente:        patient1@oasis.com       / password123');
  console.log('--------------------------------------------------\n');
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
