import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('🧪 Testing database cleaning step-by-step to identify exact FK or structural failures...');
  
  const tables = [
    { name: 'familyRelationship', op: () => prisma.familyRelationship.deleteMany() },
    { name: 'doctorDocument', op: () => prisma.doctorDocument.deleteMany() },
    { name: 'clinicDocument', op: () => prisma.clinicDocument.deleteMany() },
    { name: 'deliveryRoute', op: () => prisma.deliveryRoute.deleteMany() },
    { name: 'deliveryOrder', op: () => prisma.deliveryOrder.deleteMany() },
    { name: 'payment', op: () => prisma.payment.deleteMany() },
    { name: 'saleItem', op: () => prisma.saleItem.deleteMany() },
    { name: 'sale', op: () => prisma.sale.deleteMany() },
    { name: 'prescriptionLine', op: () => prisma.prescriptionLine.deleteMany() },
    { name: 'prescription', op: () => prisma.prescription.deleteMany() },
    { name: 'appointment', op: () => prisma.appointment.deleteMany() },
    { name: 'inventoryMovement', op: () => prisma.inventoryMovement.deleteMany() },
    { name: 'inventoryBatch', op: () => prisma.inventoryBatch.deleteMany() },
    { name: 'inventory', op: () => prisma.inventory.deleteMany() },
    { name: 'review', op: () => prisma.review.deleteMany() },
    { name: 'chatMessage', op: () => prisma.chatMessage.deleteMany() },
    { name: 'chatParticipant', op: () => prisma.chatParticipant.deleteMany() },
    { name: 'chatSession', op: () => prisma.chatSession.deleteMany() },
    { name: 'auditLog', op: () => prisma.auditLog.deleteMany() },
    { name: 'refreshToken', op: () => prisma.refreshToken.deleteMany() },
    { name: 'pharmacyManagerProfile', op: () => prisma.pharmacyManagerProfile.deleteMany() },
    { name: 'deliveryDriverProfile', op: () => prisma.deliveryDriverProfile.deleteMany() },
    { name: 'receptionistProfile', op: () => prisma.receptionistProfile.deleteMany() },
    { name: 'doctorProfile', op: () => prisma.doctorProfile.deleteMany() },
    { name: 'patientProfile', op: () => prisma.patientProfile.deleteMany() },
    { name: 'user', op: () => prisma.user.deleteMany() },
    { name: 'medicine', op: () => prisma.medicine.deleteMany() },
    { name: 'pharmacy', op: () => prisma.pharmacy.deleteMany() },
    { name: 'clinic', op: () => prisma.clinic.deleteMany() },
  ];

  for (const table of tables) {
    try {
      await table.op();
      console.log(`✅ Cleared table: ${table.name}`);
    } catch (err: any) {
      console.error(`❌ Failed to clear table ${table.name}:`, err.message || err);
    }
  }
}

test()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
