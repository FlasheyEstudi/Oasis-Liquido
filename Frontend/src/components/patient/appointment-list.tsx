'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  useUpdateAppointmentStatus,
  getHookErrorMessage,
  useCreateReview,
} from '@/hooks/use-api';
import type { Appointment, AppointmentStatus } from '@/types';
import { formatDate, formatDuration, getInitials } from '@/utils/helpers';
import { APPOINTMENT_STATUS_CONFIG } from '@/utils/constants';
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
import { ReviewModal } from '@/components/oasis/review-modal';
import { toast } from 'sonner';
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
  CheckCircle,
} from 'lucide-react';

const FILTER_TABS: { value: string; label: string; status?: AppointmentStatus }[] = [
  { value: 'upcoming', label: 'Próximas Citas' },
  { value: 'past', label: 'Historial' },
  { value: 'cancelled', label: 'Canceladas', status: 'cancelled' },
];

const fadeInUp: any = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function AppointmentList() {
  const { navigate, setNotification, isElderlyMode } = useAuthStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelDialog, setCancelDialog] = useState<Appointment | null>(null);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [reviewApt, setReviewApt] = useState<Appointment | null>(null);

  const params = activeTab === 'cancelled' ? { status: 'cancelled' as AppointmentStatus } : undefined;
  const appointmentsQuery = useAppointments(params);
  const cancelMutation = useUpdateAppointmentStatus();
  const createReviewMutation = useCreateReview();

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
    <div className={cn(
      "space-y-6 max-w-4xl mx-auto pb-20 relative overflow-visible px-1 sm:px-0",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[10%] left-[-10%] size-80 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-dashed border-slate-200/50 dark:border-white/5 transition-colors duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 font-serif">
            <Sparkles className="size-5.5 text-teal-500 shrink-0" />
            <span>Agenda de Consultas</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-455 font-bold mt-1 tracking-wide">
            Gestiona tus citas presenciales y teleconsultas médicas
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('new-appointment')}
          className="w-full sm:w-auto h-11 px-6 rounded-[16px_50px_16px_50px] bg-gradient-to-r from-teal-500 via-teal-450 to-cyan-550 hover:from-teal-600 hover:to-cyan-650 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[inset_0_3px_6px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.15),0_10px_25px_rgba(20,184,166,0.2)] transition-all duration-300 border-none"
        >
          <Plus className="size-4 shrink-0" />
          Nueva cita médica
        </motion.button>
      </div>

      {/* Filter Tabs — Flowing capsule container, no horizontal scroll */}
      <div className="w-full">
        <div className="flex flex-wrap gap-1.5 bg-white/40 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-[24px_12px_24px_12px] w-full backdrop-blur-xl">
          {FILTER_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.value;
            return (
              <motion.button
                key={tab.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  borderRadius: idx % 2 === 0
                    ? '16px 8px 14px 8px'
                    : '8px 16px 8px 14px'
                }}
                className={cn(
                  'px-3.5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 select-none flex-1 text-center min-w-[95px] sm:min-w-0 border',
                  isActive
                    ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/15'
                    : 'text-slate-550 dark:text-zinc-400 border-transparent hover:bg-white/10 hover:text-slate-800 dark:hover:text-white'
                )}
              >
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content Stepper */}
      <AnimatePresence mode="wait">
        {appointmentsQuery.isLoading ? (
          <div className="space-y-4" key="loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer rounded-2xl h-24 border border-slate-200/30 dark:border-white/5 opacity-70" />
            ))}
          </div>
        ) : appointmentsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[40px_16px_32px_16px] p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center py-10 text-center space-y-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md">
                  <AlertCircle className="size-6 text-red-500 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-455 leading-relaxed">
                  {getHookErrorMessage(appointmentsQuery.error)}
                </p>
                <Button
                  className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6"
                  onClick={() => appointmentsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </motion.div>
        ) : appointments.length === 0 ? (
          <motion.div key="empty" {...fadeInUp}>
            <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 sm:rounded-[80px_40px_32px_120px] rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-4.5">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center">
                  <Calendar className="size-7 text-slate-400 dark:text-zinc-550" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white font-serif">Sin consultas</h3>
                  <p className="text-xs text-slate-550 dark:text-zinc-450 font-bold leading-relaxed">
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
            </div>
          </motion.div>
        ) : (
          /* CARDLESS TIMELINE FEED PANEL */
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 sm:rounded-[40px_16px_40px_16px] rounded-3xl backdrop-blur-md overflow-hidden p-2 sm:p-4 shadow-xl"
          >
            <div className="divide-y divide-dashed divide-slate-200/60 dark:divide-white/5">
              {appointments.map((apt, index) => {
                const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status];
                
                // Set color of neon vertical accent bar
                const accentColor = 
                  apt.status === 'completed' ? 'bg-indigo-500' :
                  apt.status === 'cancelled' ? 'bg-red-500' :
                  'bg-teal-500';

                return (
                  <motion.div
                    key={apt.id}
                    variants={fadeInUp}
                    transition={{ delay: index * 0.02 }}
                    className="py-5 px-3 sm:px-5 hover:bg-slate-500/[0.03] dark:hover:bg-white/[0.02] cursor-pointer transition-all duration-200 relative flex flex-col md:flex-row md:items-center justify-between gap-4 group rounded-2xl"
                    onClick={() => setSelectedApt(apt)}
                  >
                    {/* Glowing neon status timeline accent on the left margin */}
                    <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full transition-transform duration-300 group-hover:scale-y-110", accentColor)} />

                    {/* Left side details */}
                    <div className="flex items-center gap-4 min-w-0 pl-2">
                      <Avatar className="size-11 sm:size-12 border border-slate-200 dark:border-white/5 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className="bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-xs font-black font-serif">
                          {apt.doctor ? getInitials(apt.doctor.name) : 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate font-serif group-hover:text-teal-500 transition-colors">
                            Dr. {apt.doctor?.name || 'Médico'}
                          </p>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 border scale-95 shadow-sm',
                            statusConfig?.bgColor,
                            statusConfig?.color
                          )}>
                            {statusConfig?.label || apt.status}
                          </span>
                        </div>
                        {apt.doctor?.doctor_profile?.specialty && (
                          <p className="text-[9px] sm:text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-0.5">
                            {apt.doctor.doctor_profile.specialty}
                          </p>
                        )}
                        {apt.clinic && (
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-bold mt-1.5 flex items-center gap-1">
                            <Building2 className="size-3 text-sky-400 shrink-0" />
                            <span className="truncate">{apt.clinic.name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side telemetry info */}
                    <div className="flex items-center justify-between md:justify-end gap-5 pl-2 md:pl-0 border-t md:border-t-0 border-dashed border-slate-200 dark:border-white/5 pt-3.5 md:pt-0">
                      <div className="text-left md:text-right font-bold text-[11px] text-slate-655 dark:text-zinc-350 space-y-0.5">
                        <div className="flex items-center md:justify-end gap-1.5">
                          <Clock className="size-3.5 text-teal-500 shrink-0" />
                          <span>{formatDate(apt.date_time, "dd MMM yyyy • HH:mm")}</span>
                        </div>
                        <p className="font-mono text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">
                          DURACIÓN: {formatDuration(apt.duration_minutes)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {apt.status === 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-[9px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-500/20 transition-all duration-200 cursor-pointer"
                            onClick={() => setReviewApt(apt)}
                          >
                            <Sparkles className="size-3" />
                            Calificar
                          </motion.button>
                        )}
                        {canCancel(apt.status) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
                            onClick={() => setCancelDialog(apt)}
                          >
                            <XCircle className="size-3" />
                            Cancelar
                          </motion.button>
                        )}
                        <span className="size-8 rounded-full bg-slate-500/5 hover:bg-teal-500/10 text-slate-400 hover:text-teal-500 transition-colors flex items-center justify-center shrink-0" onClick={() => setSelectedApt(apt)}>
                          <ChevronRight className="size-4.5" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern High-Fidelity Appointment Detail Modal */}
      <Dialog open={!!selectedApt} onOpenChange={(open) => !open && setSelectedApt(null)}>
        <DialogContent className="sm:rounded-[2.5rem] rounded-3xl bg-zinc-950/90 border-zinc-800 max-w-md mx-auto p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Ticket Clínico Digital</DialogTitle>
          </DialogHeader>

          {selectedApt && (
            <div className="flex flex-col items-center py-2 space-y-6">
              {/* Boarding Pass Ticket */}
              <div className="w-full flex flex-col items-stretch space-y-0 text-left bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl relative">
                
                {/* Top Section */}
                <div className="p-6 space-y-5">
                  {/* Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/25">
                        <ShieldCheck className="size-3" /> Verificado
                      </span>
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border',
                      APPOINTMENT_STATUS_CONFIG[selectedApt.status]?.bgColor,
                      APPOINTMENT_STATUS_CONFIG[selectedApt.status]?.color
                    )}>
                      {APPOINTMENT_STATUS_CONFIG[selectedApt.status]?.label || selectedApt.status}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14 border border-zinc-850 shrink-0 shadow-sm">
                      <AvatarFallback className="bg-teal-500/5 text-teal-400 text-xs font-black font-serif">
                        {getInitials(selectedApt.doctor?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-zinc-550 uppercase tracking-widest leading-none">Médico Tratante</p>
                      <p className="text-sm font-black text-white mt-1.5 truncate font-serif">Dr. {selectedApt.doctor?.name}</p>
                      {selectedApt.doctor?.doctor_profile?.specialty && (
                        <p className="text-[9px] font-black text-teal-450 uppercase tracking-widest mt-0.5">{selectedApt.doctor.doctor_profile.specialty}</p>
                      )}
                    </div>
                  </div>

                  {/* Schedule & Clinic Details Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-zinc-850/60">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-550 uppercase tracking-widest leading-none">Fecha y hora</p>
                      <p className="text-xs font-bold text-zinc-200 mt-1">{formatDate(selectedApt.date_time, "dd 'de' MMMM")}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{formatDate(selectedApt.date_time, "HH:mm")} hrs • {formatDuration(selectedApt.duration_minutes)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-550 uppercase tracking-widest leading-none">Consultorio</p>
                      <p className="text-xs font-bold text-zinc-200 mt-1 truncate">{selectedApt.clinic?.name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold truncate leading-none mt-1">{selectedApt.clinic?.address}</p>
                    </div>
                  </div>
                </div>

                {/* Perforated separator (punch holes) */}
                <div className="relative h-4 w-full flex items-center justify-center pointer-events-none select-none my-0.5">
                  <div className="w-full border-t-2 border-dashed border-zinc-800" />
                  <div className="absolute left-0 -translate-x-1/2 size-6 rounded-full bg-zinc-950 border border-zinc-800" />
                  <div className="absolute right-0 translate-x-1/2 size-6 rounded-full bg-zinc-950 border border-zinc-800" />
                </div>

                {/* Bottom Section - QR pass focused */}
                <div className="p-6 flex flex-col items-center text-center space-y-4 bg-zinc-950/20">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em]">Pase de Entrada QR</p>
                  
                  {/* QR container */}
                  <div className="relative bg-white p-4 rounded-2xl shadow-xl overflow-hidden shrink-0">
                    {/* Scanner glow animation */}
                    <motion.div 
                      animate={{ top: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-teal-500/25 to-transparent z-10 pointer-events-none"
                    />
                    <div className="relative flex items-center justify-center overflow-hidden p-1 bg-white">
                      <QrCode 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify#appointment-${selectedApt.id}`} 
                        size={130} 
                        className="!p-0"
                        showValue={false}
                      />
                    </div>
                    
                    {/* Corners */}
                    <div className="absolute top-2 left-2 size-3.5 border-t-2 border-l-2 border-teal-500/60 rounded-tl" />
                    <div className="absolute top-2 right-2 size-3.5 border-t-2 border-r-2 border-teal-500/60 rounded-tr" />
                    <div className="absolute bottom-2 left-2 size-3.5 border-b-2 border-l-2 border-teal-500/60 rounded-bl" />
                    <div className="absolute bottom-2 right-2 size-3.5 border-b-2 border-r-2 border-teal-500/60 rounded-br" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-teal-400 tracking-[0.2em]">Escánear en Recepción</p>
                    <p className="text-[9px] text-zinc-450 max-w-[250px] font-semibold leading-normal">
                      Muestra este pase al llegar a la clínica para confirmar tu asistencia al instante.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full flex gap-3 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs h-11 border border-zinc-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedApt(null)}
                >
                  Cerrar
                </motion.button>
                {selectedApt.status === 'completed' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 rounded-full bg-teal-650 hover:bg-teal-700 text-white font-bold text-xs h-11 border-none shadow-md cursor-pointer transition-colors"
                    onClick={() => {
                      setReviewApt(selectedApt);
                      setSelectedApt(null);
                    }}
                  >
                    Calificar Consulta
                  </motion.button>
                )}
                {canCancel(selectedApt.status) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-11 border-none shadow-md cursor-pointer transition-colors"
                    onClick={() => {
                      setCancelDialog(selectedApt);
                    }}
                  >
                    Cancelar Cita
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <DialogContent className="sm:rounded-[40px_16px_40px_16px] rounded-3xl glass-strong border-slate-200 dark:border-white/10 max-w-sm mx-auto p-6 text-center">
          <DialogHeader className="items-center">
            <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
              <ShieldAlert className="size-6 text-red-500 animate-pulse animate-spin-slow" />
            </div>
            <DialogTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-white font-serif">¿Cancelar Consulta?</DialogTitle>
            <DialogDescription className="text-xs text-slate-550 dark:text-zinc-455 leading-relaxed pt-1.5">
              ¿Confirmas la cancelación definitiva de tu consulta programada con{' '}
              <strong className="text-slate-800 dark:text-white">Dr. {cancelDialog?.doctor?.name}</strong> el{' '}
              <span className="font-bold text-teal-600 dark:text-teal-400">{cancelDialog ? formatDate(cancelDialog.date_time, "dd/MM/yyyy") : ''}</span>?
              <span className="block mt-2 font-black text-red-500 uppercase tracking-wide">Esta acción liberará el espacio médico de forma irreversible.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2.5 mt-6 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-[16px_50px_16px_50px] bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-850 dark:text-zinc-200 font-black text-[10px] h-11 border border-slate-200/50 dark:border-white/5 uppercase tracking-widest cursor-pointer"
              onClick={() => setCancelDialog(null)}
              disabled={cancelMutation.isPending}
            >
              No, mantener consulta
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-[50px_16px_50px_16px] bg-red-500 hover:bg-red-655 text-white font-black text-[10px] h-11 uppercase tracking-widest flex items-center justify-center gap-1.5 border-none shadow-md cursor-pointer"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Sí, cancelar cita'}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reviewApt && (
        <ReviewModal
          isOpen={!!reviewApt}
          onClose={() => setReviewApt(null)}
          targetName={reviewApt.doctor?.name || 'Médico'}
          targetType="doctor"
          onSubmit={async (rating, comment) => {
            if (!reviewApt.doctor?.id) {
              toast.error('No se pudo encontrar el ID del médico');
              return;
            }
            try {
              await createReviewMutation.mutateAsync({
                targetId: reviewApt.doctor.id,
                targetType: 'doctor',
                rating,
                comment,
              });
              toast.success('¡Gracias por calificar la atención del médico!');
            } catch (err: any) {
              const errMsg = err?.response?.data?.message || err?.message || 'Error al enviar la calificación';
              toast.error(errMsg);
            }
          }}
        />
      )}
    </div>
  );
}
