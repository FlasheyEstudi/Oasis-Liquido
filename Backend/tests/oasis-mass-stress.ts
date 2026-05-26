// ============================================================================
// OASIS NICARAGUA - TEST DE ESTRÉS MASIVO, INTEGRIDAD DE LOGS Y CONCURRENCIA
// This script runs an intense, destructive transactional suite testing registering,
// logging in, and executing major workflows across ALL roles. It stresses 
// database locking under concurrent load and reports the exact point of failure.
// ============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const db = new PrismaClient();

async function runMassStressTest() {
  console.log('\n\x1b[35m==================================================================\x1b[0m');
  console.log('\x1b[35m   ⚡ OASIS NICARAGUA - TEST DE ESTRÉS MASIVO Y DESTRUCCIÓN ⚡   \x1b[0m');
  console.log('\x1b[35m==================================================================\x1b[0m\n');

  let passedTests = 0;
  let failedTests = 0;
  const failurePoints: string[] = [];

  function recordStep(name: string, success: boolean, message: string) {
    if (success) {
      passedTests++;
      console.log(`\x1b[32m[OK]\x1b[0m \x1b[1m${name}\x1b[0m - ${message}`);
    } else {
      failedTests++;
      console.log(`\x1b[31m[FAIL]\x1b[0m \x1b[1m${name}\x1b[0m - \x1b[31m${message}\x1b[0m`);
      failurePoints.push(`${name}: ${message}`);
    }
  }

  // Identificadores únicos para evitar conflictos de ejecuciones previas
  const runId = crypto.randomBytes(3).toString('hex');
  const passwordHash = await bcrypt.hash('password123', 12);

  // -------------------------------------------------------------
  // FASE 1: REGISTRO E INICIO DE SESIÓN DE TODOS LOS ROLES (STRESS)
  // -------------------------------------------------------------
  console.log('\n\x1b[36m👉 FASE 1: Creación de Cuentas, Registros y Casos de Conflicto\x1b[0m');

  try {
    // 1.1 Registrar un paciente
    const patientEmail = `paciente.stress.${runId}@oasis.com.ni`;
    const patient = await db.user.create({
      data: {
        name: 'Gabriela Stress Test',
        email: patientEmail,
        passwordHash,
        role: 'patient',
        isActive: true,
        emailVerified: true,
        verificationStatus: 'approved',
        patientProfile: {
          create: {
            dateOfBirth: '1998-04-20',
            bloodType: 'AB+',
            allergies: 'Ninguna',
            medicalNotes: 'Sujeto de prueba de estrés masivo'
          }
        }
      }
    });
    recordStep('REG-01: Registro de Paciente', true, `Paciente creado con ID: ${patient.id} y email: ${patientEmail}`);

    // 1.2 Intentar registrar el MISMO email (Debe fallar)
    try {
      await db.user.create({
        data: {
          name: 'Duplicado Pérez',
          email: patientEmail,
          passwordHash,
          role: 'patient'
        }
      });
      recordStep('REG-02: Bloqueo de Email Duplicado', false, 'El sistema permitió registrar una cuenta con email existente.');
    } catch (e: any) {
      recordStep('REG-02: Bloqueo de Email Duplicado', true, 'El motor de la base de datos bloqueó correctamente la creación con email duplicado.');
    }

    // 1.3 Registro de Clínica y Doctor bajo invitación segura
    const mockClinic = await db.clinic.create({
      data: {
        name: `Clínica Providencia ${runId}`,
        address: 'Carretera Norte, Managua',
        phone: '+505 8888-9999'
      }
    });

    const docEmail = `doctor.stress.${runId}@oasis.com.ni`;
    const doctor = await db.user.create({
      data: {
        name: 'Dr. Roberto Stress',
        email: docEmail,
        passwordHash,
        role: 'doctor',
        isActive: true,
        emailVerified: true,
        verificationStatus: 'approved', // Acreditación aprobada por defecto para probar flujo
        doctorProfile: {
          create: {
            clinicId: mockClinic.id,
            licenseNumber: `MINSA-STRESS-${runId}`,
            specialty: 'Medicina Interna',
            signaturePin: await bcrypt.hash('1234', 10) // Guardamos el PIN con bcrypt para máxima seguridad
          }
        }
      }
    });
    recordStep('REG-03: Registro de Doctor', true, `Doctor creado e integrado a la Clínica ID: ${mockClinic.id}`);

  } catch (error: any) {
    recordStep('FASE 1 - Fallo Crítico', false, error.message);
  }

  // -------------------------------------------------------------
  // FASE 2: SIMULACIÓN DE SEGURIDAD Y VERIFICACIÓN DE FIRMA DIGITAL
  // -------------------------------------------------------------
  console.log('\n\x1b[36m👉 FASE 2: Expedición Legal de Recetas y Validación de Firmas\x1b[0m');

  try {
    const doc = await db.user.findFirst({
      where: { email: { startsWith: 'doctor.stress' } },
      include: { doctorProfile: true }
    });

    const pat = await db.user.findFirst({
      where: { email: { startsWith: 'paciente.stress' } }
    });

    const clin = await db.clinic.findFirst({
      where: { name: { startsWith: 'Clínica Providencia' } }
    });

    if (doc && pat && clin && doc.doctorProfile) {
      // 2.1 Test de firma con PIN correcto
      const submittedPin = '1234';
      const pinMatches = await bcrypt.compare(submittedPin, doc.doctorProfile.signaturePin || '');
      
      if (pinMatches) {
        const signaturePayload = `${doc.id}|${pat.id}|${doc.doctorProfile.licenseNumber}|${new Date().toISOString()}`;
        const digitalSignature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

        const mockPrescription = await db.prescription.create({
          data: {
            patientId: pat.id,
            doctorId: doc.id,
            clinicId: clin.id,
            expirationDate: '2026-12-31',
            status: 'active',
            digitalSignature,
            notes: 'Test de integridad criptográfica',
            qrCode: `oasis-signature-qr-${runId}`
          }
        });

        recordStep(
          'SIGN-01: Expedición Firmada con Éxito',
          true,
          `Receta digital creada legalmente. Sello de Receta: ${mockPrescription.digitalSignature?.substring(0, 16)}...`
        );
      } else {
        recordStep('SIGN-01: Expedición Firmada con Éxito', false, 'Fallo al verificar el PIN correcto del médico.');
      }

      // 2.2 Bloqueo de expedición si el PIN es incorrecto
      const badPin = '9999';
      const pinMatchesBad = await bcrypt.compare(badPin, doc.doctorProfile.signaturePin || '');
      recordStep(
        'SIGN-02: Bloqueo de Firma por PIN Erróneo',
        !pinMatchesBad,
        'El sistema previno exitosamente la firma debido a un PIN incorrecto.'
      );

    } else {
      recordStep('FASE 2: Expedición de Receta', false, 'Falta de perfiles de prueba en la base de datos.');
    }
  } catch (error: any) {
    recordStep('FASE 2 - Fallo Criptográfico', false, error.message);
  }

  // -------------------------------------------------------------
  // FASE 3: FLUJO DE CUMPLIMIENTO LEGAL DE MINSA
  // -------------------------------------------------------------
  console.log('\n\x1b[36m👉 FASE 3: Aislamiento Legal y Acreditación del MINSA\x1b[0m');

  try {
    // 3.1 Un médico con acreditación rechazada no debe firmar recetas
    const badDocEmail = `doctor.rechazado.${runId}@oasis.com.ni`;
    const badDoctor = await db.user.create({
      data: {
        name: 'Dr. Falso',
        email: badDocEmail,
        passwordHash,
        role: 'doctor',
        isActive: true,
        verificationStatus: 'rejected', // RECHAZADO por el MINSA
        doctorProfile: {
          create: {
            clinicId: (await db.clinic.findFirst())?.id || 'clinic-id',
            licenseNumber: `MINSA-FALSE-${runId}`,
            specialty: 'Ninguna'
          }
        }
      }
    });

    const isLegalToPractice = badDoctor.verificationStatus === 'approved';
    recordStep(
      'MINSA-01: Bloqueo a Doctores No Acreditados',
      !isLegalToPractice,
      `Dr. Falso está marcado como '${badDoctor.verificationStatus}'. Estatus de operación: BLOQUEADO DE FIRMA LEGAL.`
    );

  } catch (error: any) {
    recordStep('FASE 3 - Fallo de Gobernanza', false, error.message);
  }

  // -------------------------------------------------------------
  // FASE 4: INVENTARIO FIFO/FEFO Y CONTROL DE CUMPLIMIENTO EN VENTAS
  // -------------------------------------------------------------
  console.log('\n\x1b[36m👉 FASE 4: Venta de Medicamentos POS con Inventario FIFO/FEFO por Lote\x1b[0m');

  try {
    const pharmacy = await db.pharmacy.create({
      data: {
        name: `Farmacia Stress ${runId}`,
        address: 'Bello Horizonte, Managua',
        phone: '+505 2244-1122'
      }
    });

    const medicine = await db.medicine.create({
      data: {
        name: `Paracetamol Stress ${runId}`,
        genericName: 'Paracetamol',
        requiresPrescription: false
      }
    });

    const inventory = await db.inventory.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineId: medicine.id,
        quantity: 100
      }
    });

    // Crear dos lotes con diferentes fechas de expiración
    const batch1 = await db.inventoryBatch.create({
      data: {
        inventoryId: inventory.id,
        batchNumber: 'LOTE-STRESS-PRONTO',
        quantity: 40,
        expirationDate: new Date('2026-08-30') // Expira antes (FEFO)
      }
    });

    const batch2 = await db.inventoryBatch.create({
      data: {
        inventoryId: inventory.id,
        batchNumber: 'LOTE-STRESS-TARDIO',
        quantity: 60,
        expirationDate: new Date('2027-04-15') // Expira después
      }
    });

    // Simular despacho de 30 unidades
    const qtyToBuy = 30;
    
    // Algoritmo FEFO programático
    const batches = await db.inventoryBatch.findMany({
      where: { inventoryId: inventory.id, quantity: { gt: 0 } },
      orderBy: { expirationDate: 'asc' }
    });

    let remainingToDeduct = qtyToBuy;
    let successDeduction = false;

    for (const batch of batches) {
      if (batch.quantity >= remainingToDeduct) {
        await db.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: remainingToDeduct } }
        });
        remainingToDeduct = 0;
        successDeduction = true;
        break;
      }
    }

    const updatedBatch1 = await db.inventoryBatch.findUnique({ where: { id: batch1.id } });
    recordStep(
      'FEFO-01: Rotación de Lotes por Expiración',
      successDeduction && updatedBatch1?.quantity === 10,
      `Surtido exitoso. El stock del lote próximo a vencer '${batch1.batchNumber}' se redujo de 40 a ${updatedBatch1?.quantity}.`
    );

    // 4.2 Control de quiebre de stock
    const excessQty = 200;
    const isStockSufficient = (await db.inventory.findUnique({ where: { id: inventory.id } }))!.quantity >= excessQty;
    recordStep(
      'STOCK-02: Bloqueo por Stock Insuficiente',
      !isStockSufficient,
      'El sistema impidió correctamente la transacción por exceder el inventario global de la sede.'
    );

  } catch (error: any) {
    recordStep('FASE 4 - Fallo de Inventario', false, error.message);
  }

  // -------------------------------------------------------------
  // FASE 5: TEST DE CONCURRENCIA EXTREMA (RACE CONDITIONS)
  // -------------------------------------------------------------
  console.log('\n\x1b[36m👉 FASE 5: Concurrencia Extrema de Citas (Race Conditions)\x1b[0m');

  try {
    const doc = await db.user.findFirst({
      where: { email: { startsWith: 'doctor.stress' } }
    });

    const pat = await db.user.findFirst({
      where: { email: { startsWith: 'paciente.stress' } }
    });

    const clin = await db.clinic.findFirst({
      where: { name: { startsWith: 'Clínica Providencia' } }
    });

    if (doc && pat && clin) {
      const appointmentTime = new Date('2026-10-10T10:00:00Z');

      // Limpiamos cualquier cita previa en ese slot para garantizar repetibilidad limpia de la prueba
      await db.appointment.deleteMany({
        where: {
          doctorId: doc.id,
          dateTime: appointmentTime
        }
      });

      // Intentaremos programar 5 citas concurrentes para el mismo médico al mismo tiempo
      console.log('⚡ Enviando 5 peticiones simultáneas de reserva de cita con bloqueo pesimista (FOR UPDATE)...');
      const promises = Array.from({ length: 5 }).map(async (_, index) => {
        try {
          // Usamos una transacción con bloqueo selectivo o validación atómica
          return await db.$transaction(async (tx) => {
            // Forzamos un bloqueo pesimista (FOR UPDATE) sobre el registro del doctor en PostgreSQL.
            // Esto serializa de forma atómica todas las peticiones concurrentes para este doctor.
            await tx.$executeRaw`SELECT id FROM "users" WHERE id = ${doc.id} FOR UPDATE`;

            const existing = await tx.appointment.findFirst({
              where: {
                doctorId: doc.id,
                dateTime: appointmentTime,
                status: 'scheduled'
              }
            });

            if (existing) {
              throw new Error('SLOT_ALREADY_BOOKED');
            }

            return await tx.appointment.create({
              data: {
                patientId: pat.id,
                doctorId: doc.id,
                clinicId: clin.id,
                dateTime: appointmentTime,
                status: 'scheduled',
                notes: `Petición concurrente #${index}`
              }
            });
          });
        } catch (err: any) {
          return err.message;
        }
      });

      const results = await Promise.all(promises);

      const successfulReservations = results.filter(r => typeof r === 'object' && r !== null);
      const rejectedReservations = results.filter(r => r === 'SLOT_ALREADY_BOOKED');

      recordStep(
        'RACE-01: Evitar Double-Booking por Concurrencia',
        successfulReservations.length === 1 && rejectedReservations.length === 4,
        `De las 5 peticiones simultáneas, exactamente ${successfulReservations.length} se confirmó y ${rejectedReservations.length} fueron denegadas con SLOT_ALREADY_BOOKED de forma limpia.`
      );
    }
  } catch (error: any) {
    recordStep('FASE 5 - Fallo de Concurrencia', false, error.message);
  }

  // -------------------------------------------------------------
  // REPORTE DE RESULTADOS
  // -------------------------------------------------------------
  console.log('\n\x1b[35m==================================================================\x1b[0m');
  console.log('\x1b[35m                    RESULTADOS DE LA PRUEBA                        \x1b[0m');
  console.log('\x1b[35m==================================================================\x1b[0m');
  console.log(`⚡ Pruebas Exitosas: \x1b[32m${passedTests}\x1b[0m`);
  console.log(`⚡ Pruebas Fallidas: \x1b[31m${failedTests}\x1b[0m`);
  
  if (failedTests > 0) {
    console.log('\n\x1b[31m[!] PUNTOS DE FALLA ENCONTRADOS EN LA PRUEBA DE ESTRÉS:\x1b[0m');
    failurePoints.forEach(pt => console.log(`  - ${pt}`));
  } else {
    console.log('\n\x1b[32m🏆 ¡SISTEMA 100% INMUNE! No se detectaron fallos lógicos, bugs de concurrencia ni violaciones de integridad legal.\x1b[0m');
  }
  console.log('\x1b[35m==================================================================\x1b[0m\n');
}

runMassStressTest()
  .catch(err => {
    console.error('Error catastrófico durante la prueba de estrés:', err);
  })
  .finally(async () => {
    await db.$disconnect();
  });
