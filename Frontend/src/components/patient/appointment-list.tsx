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
import { QrCode } from '@/components/common/qr-code';
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
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';

const FILTER_TABS: { value: string; label: string; status?: AppointmentStatus }[] = [
  { value: 'upcoming', label: 'Próximas Citas' },
  { value: 'past', label: 'Historial' },
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
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const params = activeTab === 'cancelled' ? { status: 'cancelled' as AppointmentStatus } : undefined;
  const appointmentsQuery = useAppointments(params);
  const cancelMutation = useUpdateAppointmentStatus();

  const allAppointments = appointmentsQuery.data?.data ?? [];

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
      setNotification({ type: 'success', message: 'Consulta médica cancelada correctamente' });
      setCancelDialog(null);
      setSelectedApt(null); // Close detail modal if open
    } catch {
      setNotification({ type: 'error', message: 'No se pudo procesar la cancelación de la cita' });
    }
  };

  const canCancel = (status: AppointmentStatus) =>
    status === 'scheduled' || status === 'confirmed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2.5 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="size-5.5 text-teal-500 animate-pulse" />
            <span>Agenda de Consultas</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-455 font-semibold mt-0.5">
            Gestiona tus citas presenciales y teleconsultas médicas
          </p>
        </div>

        <Button
          onClick={() => navigate('new-appointment')}
          className="w-full sm:w-auto h-11 px-5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition-all duration-300"
        >
          <Plus className="size-4" />
          Nueva cita médica
        </Button>
      </div>

      {/* Filter Tabs — Sliding glass bar */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 bg-slate-500/[0.03] dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 p-1 rounded-2xl w-max sm:w-full">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 select-none flex-1 text-center min-w-[110px] sm:min-w-0',
                  isActive
                    ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/10 border border-teal-500/10'
                    : 'text-slate-550 dark:text-zinc-400 hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Stepper */}
      <AnimatePresence mode="wait">
        {appointmentsQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" key="loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer rounded-3xl h-40 border border-slate-200/30 dark:border-white/5 opacity-70" />
            ))}
          </div>
        ) : appointmentsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <GlassCard className="border border-slate-200 dark:border-white/5">
              <div className="flex flex-col items-center py-10 text-center space-y-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md">
                  <AlertCircle className="size-6 text-red-500 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-450">
                  {getHookErrorMessage(appointmentsQuery.error)}
                </p>
                <Button
                  className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6"
                  onClick={() => appointmentsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : appointments.length === 0 ? (
          <motion.div key="empty" {...fadeInUp}>
            <GlassCard className="border border-slate-200 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20">
              <div className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-4.5">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center">
                  <Calendar className="size-7 text-slate-400 dark:text-zinc-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white">Sin consultas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-450 font-semibold leading-relaxed">
                    {activeTab === 'upcoming'
                      ? 'No tienes citas programadas pendientes en este momento.'
                      : activeTab === 'past'
                      ? 'Tu historial de consultas médicas completadas se encuentra vacío.'
                      : 'No registras consultas canceladas anteriormente.'}
                  </p>
                </div>
                {activeTab === 'upcoming' && (
                  <Button
                    onClick={() => navigate('new-appointment')}
                    className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6 uppercase tracking-wider h-10 shadow-lg shadow-teal-500/10"
                  >
                    Agendar primera cita
                  </Button>
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {appointments.map((apt, index) => {
              const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status];
              return (
                <motion.div
                  key={apt.id}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard
                    hover
                    className="!p-5 border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950/20 shadow-xl hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between h-full rounded-[2rem] cursor-pointer"
                    onClick={() => setSelectedApt(apt)}
                  >
                    <div className="space-y-4">
                      {/* Doctor Profile Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-11 border border-teal-500/10 shrink-0">
                            <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-black">
                              {apt.doctor ? getInitials(apt.doctor.name) : 'DR'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                              Dr. {apt.doctor?.name || 'Médico'}
                            </p>
                            {apt.doctor?.doctor_profile?.specialty && (
                              <p className="text-[10px] font-black text-teal-655 dark:text-teal-400 uppercase tracking-widest mt-0.5 truncate font-bold">
                                {apt.doctor.doctor_profile.specialty}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 border',
                          statusConfig?.bgColor,
                          statusConfig?.color
                        )}>
                          {statusConfig?.label || apt.status}
                        </span>
                      </div>

                      {/* Telemetry Schedule Details */}
                      <div className="space-y-2 bg-slate-500/[0.02] dark:bg-zinc-950/20 border border-slate-200 dark:border-white/5 rounded-2xl p-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-655 dark:text-zinc-350">
                          <Clock className="size-3.5 text-teal-500 shrink-0" />
                          <span>{formatDate(apt.date_time, "dd MMM yyyy • HH:mm")}</span>
                          <span className="text-slate-350 dark:text-zinc-700">•</span>
                          <span className="font-mono text-[10px] font-black uppercase">{formatDuration(apt.duration_minutes)}</span>
                        </div>

                        {apt.clinic && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400 truncate pt-1 border-t border-slate-200/50 dark:border-white/5">
                            <Building2 className="size-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{apt.clinic.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="mt-4 pt-3 border-t border-slate-250/20 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-450 flex items-center gap-1 hover:text-teal-500">
                        Ver Detalles
                        <ChevronRight className="size-3.5" />
                      </span>

                      {canCancel(apt.status) && (
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-500/20 transition-all duration-300 select-none z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelDialog(apt);
                          }}
                        >
                          <XCircle className="size-3.5" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern High-Fidelity Appointment Detail Modal */}
      <Dialog open={!!selectedApt} onOpenChange={(open) => !open && setSelectedApt(null)}>
        <DialogContent className="rounded-[2.25rem] glass-strong border-slate-250 dark:border-white/10 max-w-sm mx-auto p-6 text-center shadow-2xl">
          <DialogHeader className="items-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="size-5 text-teal-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-550 dark:text-zinc-400">Verificación de Reserva</span>
            </div>
            <DialogTitle className="text-base font-black uppercase tracking-wider text-slate-805 dark:text-white">Ticket Clínico Digital</DialogTitle>
          </DialogHeader>

          {selectedApt && (
            <div className="flex flex-col items-center py-2 space-y-4">
              {/* Security QR Seal */}
              <div className="flex justify-center bg-slate-100 dark:bg-white rounded-[2rem] p-4 border border-slate-250/50 shadow-inner w-fit mx-auto">
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/family/verify#appointment-${selectedApt.id}`} 
                  size={150} 
                  label="TICKET"
                  className="scale-95"
                  showValue={false}
                />
              </div>

              {/* Patient and Doctor receipt */}
              <div className="w-full space-y-3 bg-slate-500/[0.02] dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 text-left">
                <div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Profesional Asignado</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">Dr. {selectedApt.doctor?.name}</p>
                  {selectedApt.doctor?.doctor_profile?.specialty && (
                    <p className="text-[10px] font-black text-teal-655 dark:text-teal-400 uppercase tracking-widest mt-0.5">{selectedApt.doctor.doctor_profile.specialty}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-white/10 pt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Horario</p>
                    <p className="text-[11px] font-black text-slate-800 dark:text-white mt-0.5">{formatDate(selectedApt.date_time, "dd MMM • HH:mm")}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">{formatDuration(selectedApt.duration_minutes)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Estado</p>
                    <div className="mt-1">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border',
                        APPOINTMENT_STATUS_CONFIG[selectedApt.status]?.bgColor,
                        APPOINTMENT_STATUS_CONFIG[selectedApt.status]?.color
                      )}>
                        {APPOINTMENT_STATUS_CONFIG[selectedApt.status]?.label || selectedApt.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApt.clinic && (
                  <div className="border-t border-slate-200 dark:border-white/5 pt-2.5">
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Sede Médica</p>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">{selectedApt.clinic.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal truncate">{selectedApt.clinic.address}</p>
                  </div>
                )}
              </div>

              {/* Diagnostic security code */}
              <div className="flex items-center gap-2 p-3 bg-teal-500/5 rounded-2xl border border-teal-500/10 text-[10px] font-bold text-slate-650 dark:text-zinc-350 text-left w-full">
                <CheckCircle className="size-4 text-teal-500 shrink-0" />
                <span>Presenta este ticket digital desde tu teléfono en recepción al llegar a la clínica.</span>
              </div>

              {/* Actions */}
              <div className="w-full flex gap-2">
                <Button
                  className="flex-1 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-300 font-black text-[10px] uppercase tracking-wider h-11 border border-slate-200 dark:border-white/5"
                  onClick={() => setSelectedApt(null)}
                >
                  Cerrar
                </Button>
                {canCancel(selectedApt.status) && (
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider h-11"
                    onClick={() => {
                      setCancelDialog(selectedApt);
                    }}
                  >
                    Cancelar Cita
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <DialogContent className="rounded-[2rem] glass-strong border-slate-200 dark:border-white/10 max-w-sm mx-auto p-6 text-center">
          <DialogHeader className="items-center">
            <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
              <ShieldAlert className="size-6 text-red-500 animate-pulse" />
            </div>
            <DialogTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-white">¿Cancelar Consulta?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-450 leading-relaxed pt-1.5">
              ¿Confirmas la cancelación definitiva de tu consulta programada con{' '}
              <strong className="text-slate-700 dark:text-white">{cancelDialog?.doctor?.name}</strong> el{' '}
              <span className="font-bold text-teal-600 dark:text-teal-400">{cancelDialog ? formatDate(cancelDialog.date_time, "dd/MM/yyyy") : ''}</span>?
              <span className="block mt-2 font-black text-red-500">Esta acción liberará el espacio médico de forma irreversible.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-6">
            <Button
              className="w-full rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-850 dark:text-zinc-200 font-black text-xs h-11 border border-slate-200 dark:border-white/5 uppercase tracking-wider"
              onClick={() => setCancelDialog(null)}
              disabled={cancelMutation.isPending}
            >
              No, mantener consulta
            </Button>
            <Button
              variant="destructive"
              className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-xs h-11 uppercase tracking-wider flex items-center justify-center gap-1.5"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Sí, cancelar cita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
