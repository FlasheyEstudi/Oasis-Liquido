'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  usePrescriptions,
  useDeliveryOrders,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, formatDuration, getInitials } from '@/utils/helpers';
import { APP_NAME, APPOINTMENT_STATUS_CONFIG, PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  MapPin,
  Truck,
  Plus,
  Clock,
  Pill,
  QrCode,
  ChevronRight,
  Activity,
  AlertCircle,
  Package,
  Sun,
  Moon,
  CloudSun,
} from 'lucide-react';

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Buenos días', icon: <Sun className="size-5 text-amber-400" /> };
  if (hour < 18) return { text: 'Buenas tardes', icon: <CloudSun className="size-5 text-orange-400" /> };
  return { text: 'Buenas noches', icon: <Moon className="size-5 text-sky-400" /> };
}

export function PatientHome() {
  const { user, navigate } = useAuthStore();

  const appointmentsQuery = useAppointments({ limit: 5 });
  const prescriptionsQuery = usePrescriptions({ limit: 5 });
  const deliveriesQuery = useDeliveryOrders({ status: 'pending' });

  const appointments = appointmentsQuery.data?.data ?? [];
  const prescriptions = prescriptionsQuery.data?.data ?? [];
  const pendingDeliveries = deliveriesQuery.data?.data ?? [];

  const isLoading =
    appointmentsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    deliveriesQuery.isLoading;

  const hasError =
    appointmentsQuery.isError ||
    prescriptionsQuery.isError ||
    deliveriesQuery.isError;

  const firstName = user?.name?.split(' ')[0] || 'Paciente';
  const greeting = getGreeting();

  const upcomingCount = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  ).length;

  const activePrescriptions = prescriptions.filter(
    (p) => p.status === 'active' || p.status === 'partially_fulfilled'
  ).length;

  // Next appointment (earliest upcoming)
  const nextAppointment = appointments
    .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())[0];

  const totalAppointments = appointments.length;

  if (isLoading) {
    return (
      <div className="bento-grid">
        <div className="col-span-8"><div className="shimmer rounded-3xl h-40" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-40" /></div>
        <div className="col-span-12"><div className="shimmer rounded-3xl h-20" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
      </div>
    );
  }

  if (hasError) {
    const errorMessages = [
      appointmentsQuery.isError ? getHookErrorMessage(appointmentsQuery.error) : null,
      prescriptionsQuery.isError ? getHookErrorMessage(prescriptionsQuery.error) : null,
      deliveriesQuery.isError ? getHookErrorMessage(deliveriesQuery.error) : null,
    ].filter(Boolean).join('. ');

    return (
      <GlassCard className="col-span-12">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <Activity className="size-7 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessages || 'No se pudieron cargar los datos. Intenta de nuevo.'}
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              appointmentsQuery.refetch();
              prescriptionsQuery.refetch();
              deliveriesQuery.refetch();
            }}
          >
            Reintentar
          </Button>
        </div>
      </GlassCard>
    );
  }

  const today = new Date();
  const dateStr = formatDate(today.toISOString(), "EEEE d 'de' MMMM, yyyy");

  return (
    <div className="bento-grid">
      {/* Welcome Card - col-span-8 */}
      <GlassCard className="col-span-12 lg:col-span-8 bg-gradient-to-br from-teal-500/10 to-sky-500/10">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {greeting.icon}
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                {greeting.text}, {firstName}
              </h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold">{dateStr}</p>
            
            {/* Urgent Task for Seniors */}
            {nextAppointment && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 mt-4 animate-pulse">
                <AlertCircle className="size-8 text-amber-600" />
                <div>
                  <p className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-widest">Atención Necesaria</p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">Tienes una cita hoy a las {formatDate(nextAppointment.date_time, 'HH:mm')}</p>
                </div>
              </div>
            )}
          </div>
          <Avatar className="size-20 shrink-0 border-4 border-white/50 shadow-xl">
            <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-2xl font-black">
              {getInitials(user?.name || 'Paciente')}
            </AvatarFallback>
          </Avatar>
        </div>
      </GlassCard>

      {/* Next Appointment Card - col-span-4 */}
      <GlassCard className="col-span-12 lg:col-span-4" hover={!!nextAppointment} onClick={nextAppointment ? () => navigate('appointments') : undefined}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-teal-500/10">
            <Calendar className="size-4 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Próxima Cita</h3>
        </div>
        {nextAppointment ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground truncate">
              {nextAppointment.doctor?.name || 'Médico'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{formatDate(nextAppointment.date_time, "dd MMM • HH:mm")}</span>
            </div>
            {nextAppointment.clinic && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">{nextAppointment.clinic.name}</span>
              </div>
            )}
            <div className="pt-1">
              <span className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.bgColor,
                APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.color
              )}>
                {APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.label || nextAppointment.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <Calendar className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Sin citas próximas</p>
            <Button
              size="sm"
              className="glass-btn-primary rounded-full h-7 text-xs mt-2"
              onClick={(e) => { e.stopPropagation(); navigate('new-appointment'); }}
            >
              Agendar
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Quick Actions Row - col-span-12 */}
      <GlassCard className="col-span-12 !p-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Agendar cita', icon: Plus, page: 'new-appointment' as const, color: 'teal' },
            { label: 'Ver recetas', icon: FileText, page: 'prescriptions' as const, color: 'sky' },
            { label: 'Farmacias', icon: MapPin, page: 'pharmacy-map' as const, color: 'amber' },
            { label: 'Delivery', icon: Truck, page: 'order-tracking' as const, color: 'teal' },
          ].map((action) => (
            <motion.button
              key={action.page}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl py-4 px-2 transition-colors',
                action.color === 'teal' && 'bg-teal-500/10 hover:bg-teal-500/15 text-teal-600 dark:text-teal-400',
                action.color === 'sky' && 'bg-sky-500/10 hover:bg-sky-500/15 text-sky-600 dark:text-sky-400',
                action.color === 'amber' && 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400',
              )}
              onClick={() => navigate(action.page)}
            >
              <action.icon className="size-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Recent Prescriptions - col-span-6 */}
      <GlassCard className="col-span-12 md:col-span-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-teal-500/10">
              <Pill className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Recetas Recientes</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-600 dark:text-teal-400 text-xs h-7 rounded-full"
            onClick={() => navigate('prescriptions')}
          >
            Ver todas <ChevronRight className="size-3 ml-0.5" />
          </Button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {prescriptions.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <FileText className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Sin recetas registradas</p>
            </div>
          ) : (
            prescriptions.slice(0, 4).map((presc) => (
              <motion.div
                key={presc.id}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('prescription-detail', presc.id)}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                  <QrCode className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {presc.doctor?.name || 'Médico'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(presc.issue_date, 'dd MMM yyyy')}</span>
                    <span>•</span>
                    <span>{presc.lines?.length || 0} med.</span>
                  </div>
                </div>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0',
                  PRESCRIPTION_STATUS_CONFIG[presc.status]?.bgColor,
                  PRESCRIPTION_STATUS_CONFIG[presc.status]?.color
                )}>
                  {PRESCRIPTION_STATUS_CONFIG[presc.status]?.label || presc.status}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Stats Mini Card - col-span-6 */}
      <GlassCard className="col-span-12 md:col-span-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-7 items-center justify-center rounded-full bg-sky-500/10">
            <Activity className="size-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Resumen</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Total Appointments */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl bg-teal-500/8 dark:bg-teal-500/10 p-4 cursor-pointer"
            onClick={() => navigate('appointments')}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalAppointments}</p>
            <p className="text-xs text-muted-foreground">Citas totales</p>
            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-1">
              {upcomingCount} próxima{upcomingCount !== 1 ? 's' : ''}
            </p>
          </motion.div>

          {/* Active Prescriptions */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl bg-amber-500/8 dark:bg-amber-500/10 p-4 cursor-pointer"
            onClick={() => navigate('prescriptions')}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{activePrescriptions}</p>
            <p className="text-xs text-muted-foreground">Recetas activas</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
              {prescriptions.length} total
            </p>
          </motion.div>

          {/* Pending Deliveries */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl bg-sky-500/8 dark:bg-sky-500/10 p-4 cursor-pointer"
            onClick={() => navigate('order-tracking')}
          >
            <div className="flex items-center gap-2 mb-2">
              <Truck className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{pendingDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Pedidos activos</p>
          </motion.div>

          {/* Quick CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl bg-emerald-500/8 dark:bg-emerald-500/10 p-4 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => navigate('new-appointment')}
          >
            <div className="flex size-10 items-center justify-center rounded-full glass-btn-primary mb-2">
              <Plus className="size-5 text-white" />
            </div>
            <p className="text-xs font-medium text-foreground">Nueva cita</p>
          </motion.div>
        </div>
      </GlassCard>
    </div>
  );
}
