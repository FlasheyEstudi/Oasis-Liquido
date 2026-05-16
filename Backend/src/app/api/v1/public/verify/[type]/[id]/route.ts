import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

export async function GET(
  req: Request,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;

    if (type === 'sale') {
      const sale = await db.sale.findUnique({
        where: { id },
        include: {
          saleItems: { include: { medicine: true } },
          pharmacy: true,
          patient: true,
          prescription: {
            include: {
              doctor: true,
              clinic: true,
            }
          },
          appointment: {
            include: {
              doctor: true,
            }
          }
        },
      });

      if (!sale) return errorResponse(ErrorCodes.NOT_FOUND, 'Venta no encontrada', 404);

      // Map to verification format
      const data = {
        type: 'sale',
        id: sale.id,
        date: sale.createdAt,
        total: sale.totalAmount,
        customerName: sale.patient?.name || 'Cliente Físico',
        pharmacyName: sale.pharmacy?.name || 'Oasis Aura',
        attendant: 'Personal de Farmacia', // Could be refined if we had an attendantId
        items: sale.saleItems.map(si => ({
          name: si.medicine.name,
          quantity: si.quantity,
          price: si.unitPrice
        })),
        prescription: sale.prescription ? {
          doctor: sale.prescription.doctor.name,
          clinic: sale.prescription.clinic.name,
          date: sale.prescription.issuedAt
        } : null
      };

      return successResponse(data);
    } 
    
    if (type === 'prescription') {
      const prescription = await db.prescription.findUnique({
        where: { id },
        include: {
          doctor: { include: { doctorProfile: { include: { clinic: true } } } },
          patient: true,
          clinic: true,
          prescriptionLines: { include: { medicine: true } },
        },
      });

      if (!prescription) return errorResponse(ErrorCodes.NOT_FOUND, 'Receta no encontrada', 404);

      // Find stock in pharmacies
      const medicineIds = prescription.prescriptionLines.map(l => l.medicineId);
      const pharmaciesWithStock = await db.pharmacy.findMany({
        where: {
          inventory: {
            some: {
              medicineId: { in: medicineIds },
              quantity: { gt: 0 }
            }
          },
          isActive: true
        },
        include: {
          inventory: {
            where: { medicineId: { in: medicineIds } }
          }
        }
      });

      const data = {
        type: 'prescription',
        id: prescription.id,
        status: prescription.status,
        date: prescription.issuedAt,
        doctorName: prescription.doctor.name,
        clinicName: prescription.clinic.name,
        patientName: prescription.patient.name,
        items: prescription.prescriptionLines.map(l => ({
          medicineId: l.medicineId,
          name: l.medicine.name,
          quantity: l.quantity,
          instructions: l.dosageInstructions
        })),
        pharmacies: pharmaciesWithStock.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          stock: p.inventory.map(inv => ({
            medicineId: inv.medicineId,
            quantity: inv.quantity
          }))
        }))
      };

      return successResponse(data);
    }

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Tipo de verificación inválido', 400);
  } catch (error: any) {
    console.error('Verification API Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno', 500);
  }
}
