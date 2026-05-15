
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

/**
 * GET /api/v1/pharmacies/:id/reports
 * Returns sales and inventory reports for the pharmacy
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: pharmacyId } = await context.params;

    // Verify access
    if (req.user.role === 'pharmacy_manager' || req.user.role === 'pharmacy_admin') {
      const profile = await db.pharmacyManagerProfile.findUnique({
        where: { userId: req.user.userId },
      });
      if (!profile || profile.pharmacyId !== pharmacyId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes acceso a esta farmacia', 403);
      }
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

      return successResponse({
        totalSales,
        todaySalesAmount: todaySales._sum.totalAmount || 0,
        lowStockCount,
        inventoryValue: realInventoryValue,
        chartData
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

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Tipo de reporte no válido', 400);
  } catch (error: any) {
    console.error('Report Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al generar reporte', 500);
  }
}, { roles: ['admin', 'pharmacy_manager', 'pharmacy_admin'] });
