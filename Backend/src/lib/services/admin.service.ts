// OASIS - Admin Service
// Dashboard stats for admin users

import { db } from '@/lib/db';

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats() {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalPrescriptions,
    appointmentsToday,
    pendingDeliveries,
    lowStockItems,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'patient' } }),
    db.user.count({ where: { role: 'doctor' } }),
    db.appointment.count(),
    db.prescription.count(),
    // Appointments today
    db.appointment.count({
      where: {
        dateTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    // Pending deliveries
    db.deliveryOrder.count({
      where: { status: { in: ['pending', 'assigned', 'picked_up', 'in_transit'] } },
    }),
    // Low stock items (items where quantity <= minStock)
    db.inventory.count({
      where: { quantity: { lte: 5 } }, // Simplified for SQLite
    }),
  ]);

  return {
    total_users: totalUsers,
    total_patients: totalPatients,
    total_doctors: totalDoctors,
    total_appointments: totalAppointments,
    total_prescriptions: totalPrescriptions,
    appointments_today: appointmentsToday,
    pending_deliveries: pendingDeliveries,
    low_stock_items: lowStockItems,
  };
}
