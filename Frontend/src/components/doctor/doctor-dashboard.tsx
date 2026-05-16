'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useReviews,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, getInitials } from '@/utils/helpers';
import { APPOINTMENT_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { ErrorBlock } from '@/components/common/error-block';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  CheckCircle2,
  HourglassIcon,
  Play,
  ChevronRight,
  Activity,
  Star,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { QrCode } from '@/components/common/qr-code';

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-2xl', className)} />;
}

export function DoctorDashboard() {
  const { user, navigate, setNotification } = useAuthStore();
  const startMutation = useUpdateAppointmentStatus();

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = formatDate(new Date().toISOString(), "EEEE d 'de' MMMM, yyyy");

  const appointmentsQuery = useAppointments({ date_from: today });
  const appointments = appointmentsQuery.data?.data ?? [];

  const { data: reviewsData, isLoading: reviewsLoading } = useReviews({ targetId: user?.id, targetType: 'doctor' });
  const reviews = reviewsData?.data || [];

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await startMutation.mutateAsync({
        id: appointmentId,
        data: { status: 'in_progress' },
      });
      setNotification({ type: 'success', message: 'Consulta iniciada' });
      navigate('consulta', appointmentId);
    } catch {
      setNotification({ type: 'error', message: 'No se pudo iniciar la consulta' });
    }
  };

  const stats = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    pending: appointments.filter(
      (a) => a.status === 'scheduled' || a.status === 'confirmed'
    ).length,
    inProgress: appointments.filter((a) => a.status === 'in_progress').length,
  };

  const nextAppointment = appointments.find(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  );

  if (appointmentsQuery.isLoading) {
    return (
      <div className="bento-grid p-4 md:p-6">
        <ShimmerBlock className="col-span-8 h-36" />
        <ShimmerBlock className="col-span-4 h-36" />
        <ShimmerBlock className="col-span-6 h-64" />
        <ShimmerBlock className="col-span-6 h-64" />
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorBlock
          message={getHookErrorMessage(appointmentsQuery.error)}
          onRetry={() => appointmentsQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="bento-grid p-4 md:p-6">
      {/* Welcome Card - col-span-8 */}
      <GlassCard className="col-span-8">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-foreground"
            >
              Buenos días, Dr/a. {user?.name?.split(' ').pop() || 'Doctor'}
            </motion.h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Calendar className="size-4" />
              {todayFormatted}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-teal-500/10">
                  <Stethoscope className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {stats.total} citas hoy
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {stats.completed} completadas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10">
                  <HourglassIcon className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {stats.pending} pendientes
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {stats.inProgress > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="hidden md:flex flex-col items-end gap-2"
              >
                <Button
                  className="glass-btn-primary rounded-full px-4 text-sm"
                  onClick={() => {
                    const active = appointments.find((a) => a.status === 'in_progress');
                    if (active) navigate('consulta', active.id);
                  }}
                >
                  Continuar consulta
                </Button>
              </motion.div>
            )}
            <div className="group relative cursor-pointer" onClick={() => navigate('perfil')}>
              <div className="absolute -inset-2 bg-gradient-to-r from-teal-500 to-sky-500 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
              <div className="relative glass-strong rounded-3xl p-2 border border-white/20 shadow-2xl transition-transform group-hover:scale-105">
                <QrCode 
                  value={`doctor-id-${user?.id}`} 
                  size={90} 
                  label="DR. ID"
                  className="bg-white rounded-2xl"
                  showValue={false}
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Next Appointment - col-span-4 */}
      <GlassCard className="col-span-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Próxima cita
        </h3>
        {nextAppointment ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                  {nextAppointment.patient?.name
                    ? getInitials(nextAppointment.patient.name)
                    : 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {nextAppointment.patient?.name || 'Paciente'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDate(nextAppointment.date_time, 'HH:mm')}
                  <span>•</span>
                  <span>{nextAppointment.duration_minutes} min</span>
                </div>
              </div>
            </div>
            <Button
              className="glass-btn-primary w-full rounded-full text-sm"
              disabled={startMutation.isPending}
              onClick={() => handleStartConsultation(nextAppointment.id)}
            >
              {startMutation.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Play className="size-3.5 mr-1" />
                  Iniciar consulta
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <Calendar className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Sin citas pendientes
            </p>
          </div>
        )}
      </GlassCard>

      {/* Patient Queue - col-span-6 */}
      <GlassCard className="col-span-6">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Pacientes de hoy
        </h3>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Stethoscope className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No tienes citas programadas para el día de hoy
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
            {appointments.map((appointment) => {
              const canStart =
                appointment.status === 'scheduled' ||
                appointment.status === 'confirmed';
              const timeStr = appointment.date_time
                ? formatDate(appointment.date_time, 'HH:mm')
                : '--:--';

              return (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl p-3 cursor-pointer',
                    'transition-all duration-200 hover:bg-teal-500/5',
                    appointment.status === 'in_progress' && 'bg-amber-500/5',
                    appointment.status === 'completed' && 'opacity-60',
                  )}
                  onClick={() => navigate('consulta', appointment.id)}
                >
                  {/* Time */}
                  <div className="flex min-w-[56px] flex-col items-center">
                    <span className="text-lg font-bold text-foreground">
                      {timeStr}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {appointment.duration_minutes} min
                    </span>
                  </div>

                  <div className="h-8 w-px bg-border" />

                  {/* Patient */}
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                      {appointment.patient?.name
                        ? getInitials(appointment.patient.name)
                        : 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {appointment.patient?.name || 'Paciente'}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Building2 className="size-3" />
                      <span className="truncate">
                        {appointment.clinic?.name || 'Clínica'}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appointment.status} type="appointment" />
                    {canStart && (
                      <Button
                        size="sm"
                        className="glass-btn-primary rounded-full h-7 px-3 text-xs"
                        disabled={startMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartConsultation(appointment.id);
                        }}
                      >
                        <Play className="size-3 mr-0.5" />
                        Iniciar
                      </Button>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground/40" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Quick Actions - col-span-6 */}
      <GlassCard className="col-span-6">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const next = appointments.find(
                (a) => a.status === 'scheduled' || a.status === 'confirmed'
              );
              if (next) {
                handleStartConsultation(next.id);
              } else {
                setNotification({ type: 'info', message: 'No hay citas pendientes' });
              }
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl p-5',
              'glass-input cursor-pointer transition-all duration-200',
              'hover:bg-teal-500/10 hover:border-teal-500/30',
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-teal-500/10">
              <Play className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-sm font-medium text-foreground">Iniciar consulta</span>
          </button>

          <button
            onClick={() => navigate('recetas')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl p-5',
              'glass-input cursor-pointer transition-all duration-200',
              'hover:bg-sky-500/10 hover:border-sky-500/30',
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-sky-500/10">
              <Activity className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-sm font-medium text-foreground">Ver recetas emitidas</span>
          </button>
        </div>
      </GlassCard>

      {/* Recent Reviews - col-span-12 */}
      <GlassCard className="col-span-12 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Star className="size-4 text-amber-500" />
            Opiniones de Pacientes
          </h3>
          <span className="text-xs text-muted-foreground">Últimas 30 días</span>
        </div>
        
        {reviewsLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Cargando opiniones...</div>
        ) : reviews.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Star className="size-8 text-muted-foreground/20" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Aún no has recibido reseñas de tus pacientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="p-4 rounded-2xl border bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("size-3.5", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDate(review.createdAt, 'MMM d, yyyy')}</span>
                </div>
                <p className="text-sm italic text-foreground leading-relaxed font-medium">"{review.comment}"</p>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-teal-500/10 flex items-center justify-center text-[10px] font-black text-teal-600">
                    {review.user?.name?.charAt(0)}
                  </div>
                  <span className="text-xs text-muted-foreground">{review.user?.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
