
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { verifyFacilityAccess } from '@/lib/auth/access';

/**
 * GET /api/v1/clinics/:id/reports
 * Returns consultation and billing reports for the clinic
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id: clinicId } = await context.params;
    
    const hasAccess = await verifyFacilityAccess(req.user.userId, req.user.role, clinicId, 'clinic');
    if (!hasAccess) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta clínica', 403);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalAppointments, todayAppointments, pendingBilling, revenue] = await Promise.all([
        db.appointment.count({ where: { clinicId } }),
        db.appointment.count({ where: { clinicId, dateTime: { gte: today } } }),
        db.appointment.count({ where: { clinicId, status: 'completed', sale: null } }),
        db.sale.aggregate({
          where: { clinicId, createdAt: { gte: today } },
          _sum: { totalAmount: true }
        })
      ]);

      // Time series for charts (Last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const appointmentHistory = await db.appointment.groupBy({
        by: ['dateTime'],
        where: { clinicId, dateTime: { gte: sevenDaysAgo } },
        _count: { _all: true },
        orderBy: { dateTime: 'asc' }
      });

      // Post-process grouping by day
      const dailyData: Record<string, number> = {};
      appointmentHistory.forEach(h => {
        const date = h.dateTime.toISOString().split('T')[0];
        dailyData[date] = (dailyData[date] || 0) + (h._count?._all || 0);
      });

      const chartData = Object.entries(dailyData).map(([date, count]) => ({
        date,
        count
      }));

      return successResponse({
        totalAppointments,
        todayAppointments,
        pendingBilling,
        todayRevenue: revenue._sum.totalAmount || 0,
        chartData
      });
    }

    if (type === 'minsa_compliance') {
      // Fetch prescriptions containing controlled substances issued by this clinic
      const controlledPrescriptions = await db.prescription.findMany({
        where: {
          clinicId,
          prescriptionLines: {
            some: {
              medicine: {
                controlType: {
                  in: ['CONTROLLED_PSYCHOTROPIC', 'CONTROLLED_NARCOTIC']
                }
              }
            }
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          doctor: {
            select: {
              name: true,
              doctorProfile: {
                select: {
                  licenseNumber: true
                }
              }
            }
          },
          fulfilledPharmacy: {
            select: {
              name: true
            }
          },
          prescriptionLines: {
            where: {
              medicine: {
                controlType: {
                  in: ['CONTROLLED_PSYCHOTROPIC', 'CONTROLLED_NARCOTIC']
                }
              }
            },
            include: {
              medicine: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Map to MINSA format
      const records = controlledPrescriptions.map(pres => {
        return {
          id: pres.id,
          date: pres.issuedAt.toISOString(),
          patientName: pres.patient?.name || 'N/A',
          patientPhone: pres.patient?.phone || 'N/A',
          doctorName: pres.doctor?.name || 'N/A',
          doctorLicense: pres.doctor?.doctorProfile?.licenseNumber || 'N/A',
          digitalSignature: pres.digitalSignature ? 'Firmada Digitalmente' : 'Firma Pendiente/Física',
          qrVerified: !!pres.qrCode,
          status: pres.status,
          fulfilledPharmacyName: pres.fulfilledPharmacy?.name || (pres.fulfilledAt ? 'Farmacia Externa/No Registrada' : 'No Entregado'),
          items: pres.prescriptionLines.map(line => ({
            medicineId: line.medicineId,
            name: line.medicine.name,
            genericName: line.medicine.genericName,
            controlType: line.medicine.controlType,
            concentration: line.medicine.concentration || 'N/A',
            quantityPrescribed: line.quantity,
            quantityFulfilled: line.quantityFulfilled,
            dosageInstructions: line.dosageInstructions
          }))
        };
      });

      // Calculate totals for MINSA clinic summary
      const totals = {
        totalPrescriptionsIssued: records.length,
        psychotropicsCount: records.reduce((acc, r) => acc + r.items.filter(i => i.controlType === 'CONTROLLED_PSYCHOTROPIC').reduce((sum, item) => sum + item.quantityPrescribed, 0), 0),
        narcoticsCount: records.reduce((acc, r) => acc + r.items.filter(i => i.controlType === 'CONTROLLED_NARCOTIC').reduce((sum, item) => sum + item.quantityPrescribed, 0), 0),
        fulfilledCount: records.filter(r => r.status === 'fulfilled' || r.status === 'partially_fulfilled').length,
        pendingCount: records.filter(r => r.status === 'active' || r.status === 'pending').length
      };

      return successResponse({
        totals,
        records
      });
    }

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Tipo de reporte no válido', 400);
  } catch (error: any) {
    console.error('Clinic Report Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al generar reporte', 500);
  }
}, { roles: ['admin', 'clinic_admin', 'receptionist', 'doctor'] });
