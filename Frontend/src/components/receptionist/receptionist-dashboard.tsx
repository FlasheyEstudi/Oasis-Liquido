'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  useUpdateAppointmentStatus,
  getHookErrorMessage,
  useClinicReport
} from '@/hooks/use-api';
import { formatDate, getInitials, formatCurrency } from '@/utils/helpers';
import { APPOINTMENT_STATUS_CONFIG, ROLE_COLORS } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  DollarSign,
  Receipt,
  TrendingUp,
  Activity,
  Calendar,
  CalendarDays,
  Clock,
  Stethoscope,
  CheckCircle2,
  PlayCircle,
  XCircle,
  UserCheck
} from 'lucide-react';
import { ClinicBillingModal } from './billing-modal';
import { PatientRegistrationModal } from './registration-modal';
import { AnalyticsCard } from '@/components/common/analytics-card';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function ReceptionistDashboard() {
  const { user, setNotification, navigate } = useAuthStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const clinicId = user?.receptionist_profile?.clinic_id || '';
  const firstName = user?.name?.split(' ')[0] || 'Recepcionista';

  const [billingOpen, setBillingOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const {
    data: reportResult,
    isLoading: reportLoading,
    refetch: refetchReport
  } = useClinicReport(clinicId, 'summary', !!clinicId);

  const report = reportResult?.data ?? { totalAppointments: 0, todayRevenue: 0, chartData: [] };

  const today = new Date();
  const todayStr = formatDate(today.toISOString(), "EEEE, dd 'de' MMMM 'de' yyyy");

  // React Query hooks
  const {
    data: appointmentsResult,
    isLoading,
    error,
    refetch,
  } = useAppointments({ clinic_id: clinicId, limit: 50 });

  const updateAppointmentStatus = useUpdateAppointmentStatus();

  const appointments = appointmentsResult?.data ?? [];

  // Stats
  const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
  const inProgress = appointments.filter((a) => a.status === 'in_progress').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  const handleStatusUpdate = (appointmentId: string, newStatus: 'confirmed' | 'in_progress' | 'cancelled') => {
    setUpdatingId(appointmentId);
    updateAppointmentStatus.mutate(
      { id: appointmentId, data: { status: newStatus } },
      {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Estado actualizado correctamente' });
          refetch();
        },
        onError: () => {
          setNotification({ type: 'error', message: 'Error al actualizar estado' });
        },
        onSettled: () => {
          setUpdatingId(null);
        },
      }
    );
  };

  if (isLoading || reportLoading) {
    return (
      <div className="bento-grid p-4 md:p-6">
        <div className="col-span-8"><div className="shimmer rounded-3xl h-36" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
        <div className="col-span-12"><div className="shimmer rounded-3xl h-28" /></div>
        <div className="col-span-12"><div className="shimmer rounded-3xl h-64" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Activity className="size-12 text-red-500/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{getHookErrorMessage(error) || 'Error al cargar citas'}</p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm font-medium">Reintentar</button>
      </div>
    );
  }

  return (
    <motion.div className="bento-grid p-4 md:p-6" variants={stagger} initial="initial" animate="animate">
      {/* Clinic Stats — col-span-8 */}
      <motion.div className="col-span-8" variants={fadeUp}>
        <AnalyticsCard
          title="Flujo de Pacientes"
          subtitle="Citas agendadas (Últimos 7 días)"
          data={report.chartData}
          dataKey="count"
          xAxisKey="date"
          type="bar"
          color="#3b82f6"
          currentValue={report.totalAppointments}
          percentageChange={5}
        />
      </motion.div>

      {/* Revenue Summary — col-span-4 */}
      <motion.div className="col-span-4" variants={fadeUp}>
        <GlassCard className="h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <TrendingUp className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(report.todayRevenue)}</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Pendiente de Cobro</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{report.pendingBilling} citas</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Welcome Card — col-span-12 */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Hola, {firstName}</h1>
              <p className="text-sm text-muted-foreground">{todayStr}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold">
              <UserCheck className="size-3.5" />
              Sincronizado con Clínica
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Quick Cards */}
      <motion.div className="col-span-4" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-sky-500/10">
              <CalendarDays className="size-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{scheduled}</p>
              <p className="text-xs text-muted-foreground">Por confirmar</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick Actions — col-span-12 */}
      <motion.div className="col-span-8" variants={fadeUp}>
        <GlassCard>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: UserPlus, label: 'Registrar Walk-in', count: '+', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400', onClick: () => setRegistrationOpen(true) },
              { icon: CheckCircle2, label: 'Confirmar', count: scheduled, iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600 dark:text-sky-400', onClick: () => {} },
              { icon: PlayCircle, label: 'En consulta', count: inProgress, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400', onClick: () => {} },
              { icon: DollarSign, label: 'Por Cobrar', count: completed, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400', onClick: () => {} },
            ].map((action) => (
              <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-2 rounded-2xl p-4 glass-input hover:bg-teal-500/5 transition-all">
                <div className={cn('flex size-11 items-center justify-center rounded-full', action.iconBg)}>
                  <action.icon className={cn('size-5', action.iconColor)} />
                </div>
                <span className="text-xs font-medium text-muted-foreground leading-tight text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Patient Check-in / Today's Appointments — col-span-12 */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Citas de Hoy</h3>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}>
                {confirmed} confirmadas
              </span>
            </div>
          </div>
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CalendarDays className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
              <p className="text-sm text-muted-foreground">Tu oasis de salud te espera</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
              <AnimatePresence>
                {appointments.map((apt) => {
                  const isUpdatingThis = updatingId === apt.id;
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl glass hover:bg-teal-500/5 transition-colors"
                    >
                      {/* Time & Avatar */}
                      <div className="flex items-center gap-3 sm:w-40">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-500">
                          <span className="text-xs font-semibold text-white">
                            {apt.patient ? getInitials(apt.patient.name) : 'P'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{formatDate(apt.date_time, 'HH:mm')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{apt.duration_minutes} min</p>
                        </div>
                      </div>

                      {/* Patient & Doctor */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {apt.patient?.name || 'Paciente'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Stethoscope className="size-3" />
                          <span>{apt.doctor?.name || 'Médico'}</span>
                        </div>
                        {apt.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{apt.notes}</p>
                        )}
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={apt.status} type="appointment" />

                        {apt.status === 'scheduled' && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                            disabled={isUpdatingThis}
                            className="glass-btn-primary rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="size-3" />
                            Confirmar
                          </motion.button>
                        )}

                        {apt.status === 'confirmed' && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusUpdate(apt.id, 'in_progress')}
                            disabled={isUpdatingThis}
                            className="glass-btn-primary rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            <PlayCircle className="size-3" />
                            Iniciar
                          </motion.button>
                        )}

                        {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                            disabled={isUpdatingThis}
                            className="rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15 hover:bg-red-500/15 transition-all disabled:opacity-50"
                          >
                            <XCircle className="size-3" />
                            Cancelar
                          </motion.button>
                        )}
                        {apt.status === 'completed' && !apt.sale && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setSelectedApt(apt); setBillingOpen(true); }}
                            className="rounded-full px-4 py-1 text-xs font-bold flex items-center gap-1 bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all"
                          >
                            <Receipt className="size-3" />
                            Cobrar
                          </motion.button>
                        )}

                        {apt.status === 'completed' && apt.sale && (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="size-3" />
                            Facturado
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </motion.div>

      <ClinicBillingModal 
        isOpen={billingOpen} 
        onClose={() => setBillingOpen(false)} 
        appointment={selectedApt} 
        onSuccess={() => { refetch(); refetchReport(); }}
      />

      <PatientRegistrationModal
        isOpen={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
      />
    </motion.div>
  );
}
