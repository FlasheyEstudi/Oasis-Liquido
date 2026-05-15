
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

/**
 * GET /api/v1/clinics/:id/reports
 * Returns consultation and billing reports for the clinic
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id: clinicId } = await context.params;

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

    return errorResponse(ErrorCodes.BAD_REQUEST, 'Tipo de reporte no válido', 400);
  } catch (error: any) {
    console.error('Clinic Report Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al generar reporte', 500);
  }
}, { roles: ['admin', 'clinic_admin', 'receptionist', 'doctor'] });
