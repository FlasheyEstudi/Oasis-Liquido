
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';
import { verifyFacilityAccess } from '@/lib/auth/access';

/**
 * GET /api/v1/pharmacies/:id/reports
 * Returns sales and inventory reports for the pharmacy
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: pharmacyId } = await context.params;

    const hasAccess = await verifyFacilityAccess(req.user.userId, req.user.role, pharmacyId, 'pharmacy');
    if (!hasAccess) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      // Basic stats for dashboard
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalSales, todaySales, lowStockCount, inventory] = await Promise.all([
        db.sale.count({ where: { pharmacyId } }),
        db.sale.aggregate({
          where: { pharmacyId, createdAt: { gte: today } },
          _sum: { totalAmount: true }
        }),
        db.inventory.count({
          where: { pharmacyId, quantity: { lte: 10 } }
        }),
        db.inventory.findMany({ where: { pharmacyId } })
      ]);

      const realInventoryValue = inventory.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

      // Time series for charts (Last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const salesHistory = await db.sale.groupBy({
        by: ['createdAt'],
        where: { pharmacyId, createdAt: { gte: sevenDaysAgo } },
        _sum: { totalAmount: true },
        orderBy: { createdAt: 'asc' }
      });

      // Post-process grouping by day since SQLite stores full timestamp
      const dailyData: Record<string, number> = {};
      salesHistory.forEach(s => {
        const date = s.createdAt.toISOString().split('T')[0];
        dailyData[date] = (dailyData[date] || 0) + (s._sum.totalAmount || 0);
      });

      const chartData = Object.entries(dailyData).map(([date, amount]) => ({
        date,
        amount
      }));

      // Calculate delivery metrics
      const completedDeliveries = await db.deliveryOrder.findMany({
        where: {
          pharmacyId,
          status: 'delivered',
          pickedUpAt: { not: null },
          deliveredAt: { not: null },
        },
        select: {
          pickedUpAt: true,
          deliveredAt: true,
        }
      });

      let totalDeliveryTimeMinutes = 0;
      let slaCompliantCount = 0;
      completedDeliveries.forEach(d => {
        const pick = new Date(d.pickedUpAt!).getTime();
        const deliv = new Date(d.deliveredAt!).getTime();
        const diffMinutes = Math.max(1, Math.round((deliv - pick) / (1000 * 60)));
        totalDeliveryTimeMinutes += diffMinutes;
        if (diffMinutes <= 45) {
          slaCompliantCount++;
        }
      });

      const avgDeliveryTime = completedDeliveries.length > 0 
        ? Math.round(totalDeliveryTimeMinutes / completedDeliveries.length) 
        : 35; // Default/SLA simulation if no completed deliveries yet

      const slaAttainment = completedDeliveries.length > 0
        ? Math.round((slaCompliantCount / completedDeliveries.length) * 100)
        : 95; // Default simulation

      return successResponse({
        totalSales,
        todaySalesAmount: todaySales._sum.totalAmount || 0,
        lowStockCount,
        inventoryValue: realInventoryValue,
        chartData,
        deliveryMetrics: {
          avgDeliveryTime,
          slaAttainment,
          activeCount: await db.deliveryOrder.count({
            where: { pharmacyId, status: { in: ['pending', 'accepted', 'picked_up', 'in_transit'] } }
          })
        }
      });
    }


    if (type === 'top_products') {
      // Find top 5 medicines sold
      const topItems = await db.saleItem.groupBy({
        by: ['medicineId'],
        where: { sale: { pharmacyId } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      });

      const itemsWithMedicine = await Promise.all(topItems.map(async (item) => {
        const medicine = await db.medicine.findUnique({ where: { id: item.medicineId } });
        return {
          ...item,
          medicine
        };
      }));

      return successResponse(itemsWithMedicine);
    }

    if (type === 'minsa_compliance') {
      // Fetch controlled substance sales for this pharmacy
      const controlledSales = await db.sale.findMany({
        where: {
          pharmacyId,
          saleItems: {
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
          prescription: {
            include: {
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
              clinic: {
                select: {
                  name: true
                }
              }
            }
          },
          saleItems: {
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
      const records = controlledSales.map(sale => {
        const hasPrescription = !!sale.prescription;
        
        return {
          id: sale.id,
          date: sale.createdAt.toISOString(),
          patientName: sale.patient?.name || 'Venta Ambulatoria',
          patientPhone: sale.patient?.phone || 'N/A',
          hasPrescription,
          prescriptionId: sale.prescriptionId || null,
          doctorName: sale.prescription?.doctor?.name || 'N/A',
          doctorLicense: sale.prescription?.doctor?.doctorProfile?.licenseNumber || 'N/A',
          clinicName: sale.prescription?.clinic?.name || 'N/A',
          digitalSignature: sale.prescription?.digitalSignature ? 'Firmada Digitalmente' : 'Firma Pendiente/Física',
          qrVerified: !!sale.prescription?.qrCode,
          items: sale.saleItems.map(item => ({
            medicineId: item.medicineId,
            name: item.medicine.name,
            genericName: item.medicine.genericName,
            controlType: item.medicine.controlType,
            concentration: item.medicine.concentration || 'N/A',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        };
      });

      // Calculate totals for MINSA book summary
      const totals = {
        totalDispensations: records.length,
        psychotropicsCount: records.reduce((acc, r) => acc + r.items.filter(i => i.controlType === 'CONTROLLED_PSYCHOTROPIC').reduce((sum, item) => sum + item.quantity, 0), 0),
        narcoticsCount: records.reduce((acc, r) => acc + r.items.filter(i => i.controlType === 'CONTROLLED_NARCOTIC').reduce((sum, item) => sum + item.quantity, 0), 0),
        withoutPrescriptionViolations: records.filter(r => !r.hasPrescription).length
      };

      return successResponse({
        totals,
        records
      });
    }

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Tipo de reporte no válido', 400);
  } catch (error: any) {
    console.error('Report Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al generar reporte', 500);
  }
}, { roles: ['admin', 'pharmacy_manager', 'pharmacy_admin'] });
