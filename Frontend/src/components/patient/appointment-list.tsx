'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  useUpdateAppointmentStatus,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { Appointment, AppointmentStatus } from '@/types';
import { formatDate, formatDuration, getInitials } from '@/utils/helpers';
import { APPOINTMENT_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  XCircle,
  Building2,
  AlertCircle,
} from 'lucide-react';

const FILTER_TABS: { value: string; label: string; status?: AppointmentStatus }[] = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Pasadas' },
  { value: 'cancelled', label: 'Canceladas', status: 'cancelled' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AppointmentList() {
  const { navigate, setNotification } = useAuthStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelDialog, setCancelDialog] = useState<Appointment | null>(null);

  // Build query params based on active tab
  const params = activeTab === 'cancelled' ? { status: 'cancelled' as AppointmentStatus } : undefined;
  const appointmentsQuery = useAppointments(params);
  const cancelMutation = useUpdateAppointmentStatus();

  const allAppointments = appointmentsQuery.data?.data ?? [];

  // Client-side filter for upcoming/past
  const appointments = activeTab === 'upcoming'
    ? allAppointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'in_progress')
    : activeTab === 'past'
    ? allAppointments.filter((a) => a.status === 'completed')
    : allAppointments;

  const handleCancel = async () => {
    if (!cancelDialog) return;
    try {
      await cancelMutation.mutateAsync({
        id: cancelDialog.id,
        data: { status: 'cancelled' },
      });
      setNotification({ type: 'success', message: 'Cita cancelada correctamente' });
      setCancelDialog(null);
    } catch {
      setNotification({ type: 'error', message: 'No se pudo cancelar la cita' });
    }
  };

  const canCancel = (status: AppointmentStatus) =>
    status === 'scheduled' || status === 'confirmed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h2
          {...fadeInUp}
          className="text-xl font-bold text-foreground"
        >
          Mis Citas
        </motion.h2>
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Button
            onClick={() => navigate('new-appointment')}
            className="glass-btn-primary rounded-full gap-2 h-9"
          >
            <Plus className="size-4" />
            Nueva cita
          </Button>
        </motion.div>
      </div>

      {/* Filter Tabs — Glass pills */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab, i) => (
          <motion.button
            key={tab.value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-medium transition-all',
              activeTab === tab.value
                ? 'glass-btn-primary text-white'
                : 'glass text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {appointmentsQuery.isLoading ? (
          <div className="bento-grid" key="loading">
            <div className="col-span-6"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-6"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
          </div>
        ) : appointmentsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <GlassCard>
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 mb-4">
                  <AlertCircle className="size-7 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {getHookErrorMessage(appointmentsQuery.error)}
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => appointmentsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : appointments.length === 0 ? (
          <motion.div key="empty" {...fadeInUp}>
            <GlassCard>
              <div className="flex flex-col items-center py-12 text-center">
                <Calendar className="size-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-semibold mb-1">Sin citas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'upcoming'
                    ? 'Tu oasis de salud te espera'
                    : activeTab === 'past'
                    ? 'No tienes citas completadas aún'
                    : 'No tienes citas canceladas'}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('new-appointment')}
                    className="glass-btn-primary rounded-full px-6 py-2 text-sm font-medium"
                  >
                    Agendar cita
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bento-grid"
          >
            {appointments.map((apt, index) => {
              const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status];
              return (
                <motion.div
                  key={apt.id}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.04 }}
                  className="col-span-6 lg:col-span-4"
                >
                  <GlassCard
                    hover
                    className="!p-4"
                    onClick={() => navigate('appointment-detail', apt.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11 shrink-0">
                        <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold">
                          {apt.doctor ? getInitials(apt.doctor.name) : 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {apt.doctor?.name || 'Médico'}
                            </p>
                            {apt.doctor?.doctor_profile?.specialty && (
                              <p className="text-xs text-muted-foreground">
                                {apt.doctor.doctor_profile.specialty}
                              </p>
                            )}
                          </div>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0',
                            statusConfig?.bgColor,
                            statusConfig?.color
                          )}>
                            {statusConfig?.label || apt.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDate(apt.date_time, "dd MMM yyyy • HH:mm")}
                          </span>
                          <span>•</span>
                          <span>{formatDuration(apt.duration_minutes)}</span>
                        </div>

                        {apt.clinic && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="size-3" />
                            {apt.clinic.name}
                          </p>
                        )}

                        {canCancel(apt.status) && (
                          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                              onClick={() => setCancelDialog(apt)}
                            >
                              <XCircle className="size-3.5" />
                              Cancelar cita
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <DialogContent className="rounded-3xl glass-strong border-border">
          <DialogHeader>
            <DialogTitle>¿Cancelar cita?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar tu cita con{' '}
              <strong>{cancelDialog?.doctor?.name || 'el médico'}</strong> el{' '}
              {cancelDialog ? formatDate(cancelDialog.date_time, "dd/MM/yyyy 'a las' HH:mm") : ''}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setCancelDialog(null)}
              disabled={cancelMutation.isPending}
            >
              No, mantener
            </Button>
            <Button
              variant="destructive"
              className="rounded-full gap-2"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
