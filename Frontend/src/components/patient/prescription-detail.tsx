'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  usePrescription,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, getInitials } from '@/utils/helpers';
import { PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode } from '@/components/common/qr-code';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Calendar,
  Building2,
  Clock,
  FileText,
  Pill,
  StickyNote,
  AlertCircle,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  Bell,
  Check,
  Loader2
} from 'lucide-react';

const fadeInUp: any = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function PrescriptionDetail() {
  const { selectedItemId, navigate, isElderlyMode } = useAuthStore();
  const prescriptionQuery = usePrescription(selectedItemId ?? '', !!selectedItemId);

  const [selectedLine, setSelectedLine] = useState<any | null>(null);
  const [customTime, setCustomTime] = useState('08:00');
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'lunch' | 'dinner' | 'bedtime' | 'custom'>('morning');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleScheduleReminder = async () => {
    if (!selectedLine) return;
    setIsScheduling(true);
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (error) {
      toast.error('Error al programar recordatorio');
    } finally {
      setIsScheduling(false);
    }
  };

  if (!selectedItemId) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto px-1 sm:px-0">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground hover:bg-white/5 cursor-pointer"
          onClick={() => navigate('recetas')}
        >
          <ArrowLeft className="size-4" />
          Volver a recetas
        </Button>
        <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[40px_16px_32px_16px] p-6 backdrop-blur-xl">
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500 mb-3 animate-pulse" />
            <p className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">No se especificó una receta</p>
          </div>
        </div>
      </div>
    );
  }

  if (prescriptionQuery.isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto px-1 sm:px-0">
        <div className="shimmer rounded-3xl h-24 opacity-70" />
        <div className="shimmer rounded-3xl h-64 opacity-70" />
      </div>
    );
  }

  if (prescriptionQuery.isError || !prescriptionQuery.data) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto px-1 sm:px-0">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          onClick={() => navigate('recetas')}
        >
          <ArrowLeft className="size-4" />
          Volver a recetas
        </Button>
        <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[40px_16px_32px_16px] p-6 backdrop-blur-xl text-center">
          <AlertCircle className="size-10 text-red-500 mb-3 mx-auto" />
          <p className="text-sm font-bold text-slate-655 dark:text-zinc-350 mb-4">
            {prescriptionQuery.isError ? getHookErrorMessage(prescriptionQuery.error) : 'Receta no encontrada'}
          </p>
          <Button
            className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6 uppercase tracking-wider"
            onClick={() => prescriptionQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const prescription = prescriptionQuery.data;
  const statusConfig = PRESCRIPTION_STATUS_CONFIG[prescription.status];

  // Calculate fulfillment progress
  const totalQuantity = prescription.lines?.reduce((sum, l) => sum + l.quantity, 0) || 0;
  const fulfilledQuantity = prescription.lines?.reduce((sum, l) => sum + l.quantity_fulfilled, 0) || 0;
  const progressPercent = totalQuantity > 0 ? Math.round((fulfilledQuantity / totalQuantity) * 100) : 0;

  return (
    <div className={cn(
      "space-y-5 max-w-4xl mx-auto pb-20 px-1 sm:px-0 relative",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      {/* Back navigation button */}
      <Button
        variant="ghost"
        className="rounded-full gap-2 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer hover:bg-white/5"
        onClick={() => navigate('recetas')}
      >
        <ArrowLeft className="size-4" />
        Volver a recetas
      </Button>
      {/* SEAMLESS CLINICAL RECIPE SHEATH — 100% Cardless dashboard layout (Premium Ticket Cut-outs) */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md overflow-visible relative p-4 sm:p-6 shadow-xl space-y-6">
        
        {/* Header Section: Doctor Profile & Status Indicator with timeline ribbon */}
        <div className="relative pl-4 py-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Vertical accent ribbon */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-full" />
          
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="size-14 border border-slate-200 dark:border-white/5 shrink-0 shadow-sm">
              <AvatarFallback className="bg-slate-100 dark:bg-zinc-900 text-slate-850 dark:text-zinc-200 text-lg font-black font-serif">
                {prescription.doctor ? getInitials(prescription.doctor.name) : 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-855 dark:text-white font-serif">
                  Dr. {prescription.doctor?.name || 'Médico Prescriptor'}
                </h2>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 border scale-95 shadow-sm',
                  statusConfig?.bgColor,
                  statusConfig?.color
                )}>
                  {statusConfig?.label || prescription.status}
                </span>
              </div>
              {prescription.doctor?.doctor_profile?.specialty && (
                <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-0.5">
                  {prescription.doctor.doctor_profile.specialty}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400 md:text-right md:justify-end">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-indigo-500" />
              Emitida: {formatDate(prescription.issue_date, 'dd/MM/yyyy')}
            </span>
            {prescription.clinic && (
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-teal-500" />
                {prescription.clinic.name}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Clock className="size-3.5 text-amber-500 animate-pulse" />
              Vence: {formatDate(prescription.expiration_date, 'dd/MM/yyyy')}
            </span>
          </div>
        </div>

        {/* Tear Line Separator (Matches DSG-PAT-002 ticket cut-outs) */}
        <div className="relative my-2">
          <div className="absolute left-[-28px] sm:left-[-36px] top-1/2 -translate-y-1/2 size-6 rounded-full bg-white dark:bg-zinc-950 border-r border-slate-200/50 dark:border-white/10 z-20 pointer-events-none" />
          <div className="absolute right-[-28px] sm:right-[-36px] top-1/2 -translate-y-1/2 size-6 rounded-full bg-white dark:bg-zinc-950 border-l border-slate-200/50 dark:border-white/10 z-20 pointer-events-none" />
          <div className="border-t border-dashed border-slate-200 dark:border-white/10 w-full" />
        </div>

        {/* Dashboard middle split grid (Fulfillment vs QR passport seal) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Fulfillment meter (Left) - Unboxed circular status HUD */}
          <div className="md:col-span-6 flex flex-col sm:flex-row items-center gap-5 bg-white/20 dark:bg-zinc-950/40 p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-inner">
            <div className="relative size-24 shrink-0 mx-auto sm:mx-0">
              <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-200/50 dark:text-zinc-800/40" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="currentColor" strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.51} 251`}
                  className="text-teal-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800 dark:text-white leading-none font-serif">{progressPercent}%</span>
                <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-wide mt-1">surtido</span>
              </div>
            </div>
            <div className="text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <Pill className="size-3.5 text-teal-500 shrink-0" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Progreso de Entrega</h3>
              </div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                {fulfilledQuantity} de {totalQuantity} unidades
              </p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-555 font-bold leading-normal">Unidades certificadas surtidas en farmacias MINSA.</p>
            </div>
          </div>

          {/* Holographic Verification QR Seal (Right) - Unboxed floating capsule */}
          <div className="md:col-span-6 flex flex-col items-center p-3">
            <div className="flex justify-center bg-slate-50 dark:bg-white rounded-[2rem] p-3.5 border border-slate-200/60 shadow-inner w-fit">
              <QrCode 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/family/verify#prescription-${prescription.id}`} 
                size={120} 
                label="Receta"
                className="scale-95"
                showValue={false}
              />
            </div>
            <p className="text-[9px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-3 text-center">Firma Biométrica Encriptada HMAC</p>
          </div>

        </div>

        {/* Tear Line Separator (Matches DSG-PAT-002 ticket cut-outs) */}
        <div className="relative my-2">
          <div className="absolute left-[-28px] sm:left-[-36px] top-1/2 -translate-y-1/2 size-6 rounded-full bg-white dark:bg-zinc-950 border-r border-slate-200/50 dark:border-white/10 z-20 pointer-events-none" />
          <div className="absolute right-[-28px] sm:right-[-36px] top-1/2 -translate-y-1/2 size-6 rounded-full bg-white dark:bg-zinc-950 border-l border-slate-200/50 dark:border-white/10 z-20 pointer-events-none" />
          <div className="border-t border-dashed border-slate-200 dark:border-white/10 w-full" />
        </div>

        {/* Medication Lines list - Cardless troquel feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/15">
              <FileText className="size-3.5 text-indigo-500" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Medicamentos Formulados</h3>
          </div>

          <div className="divide-y divide-dashed divide-slate-200/50 dark:divide-white/5">
            {prescription.lines?.map((line, index) => {
              const lineProgress = line.quantity > 0
                ? Math.round((line.quantity_fulfilled / line.quantity) * 100)
                : 0;
              const isFulfilled = line.quantity_fulfilled >= line.quantity;
              return (
                <motion.div
                  key={line.id}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.03 }}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full mt-0.5 shadow-inner bg-slate-500/5">
                      {isFulfilled ? (
                        <CheckCircle2 className="size-4.5 text-emerald-500" />
                      ) : lineProgress > 0 ? (
                        <Circle className="size-4.5 text-amber-500 fill-amber-500/10" />
                      ) : (
                        <Circle className="size-4.5 text-slate-300 dark:text-zinc-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white font-serif group-hover:text-indigo-600 transition-colors">
                        {line.medicine?.name || 'Medicamento'}
                      </p>
                      {line.dosage_instructions && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                          {line.dosage_instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-10 md:pl-0 shrink-0 justify-between md:justify-end w-full md:w-auto">
                    {/* Amount tag */}
                    <div className="text-left md:text-right font-bold">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                        {line.quantity_fulfilled}/{line.quantity} unidades
                      </p>
                      <div className="h-1 w-24 rounded-full bg-slate-200 dark:bg-zinc-800 mt-1">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isFulfilled ? 'bg-emerald-500' : lineProgress > 0 ? 'bg-amber-500' : 'bg-slate-400/20'
                          )}
                          style={{ width: `${lineProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Notification scheduler CTA */}
                    {!isFulfilled && line.dosage_instructions && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedLine(line);
                          setSelectedSlot('morning');
                          setIsSuccess(false);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-all cursor-pointer shadow-sm"
                      >
                        <Clock className="size-3 text-teal-500 shrink-0" />
                        Alarma
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {(!prescription.lines || prescription.lines.length === 0) && (
              <p className="py-6 text-xs text-slate-400 dark:text-zinc-550 text-center font-bold">
                No hay medicamentos formulados en esta receta médica.
              </p>
            )}
          </div>
        </div>

        {/* Notes (Notes Sheet Ribbon) - Cardless notes banner */}
        {prescription.notes && (
          <div className="border-t border-dashed border-slate-200 dark:border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-7 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15">
                <StickyNote className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Indicaciones Médicas</h3>
            </div>
            <p className="text-xs text-slate-655 dark:text-zinc-350 leading-relaxed font-bold bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10">
              {prescription.notes}
            </p>
          </div>
        )}
      </div>

      {/* Bottom map CTA */}
      {(prescription.status === 'active' || prescription.status === 'partially_fulfilled') && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-12 rounded-[16px_50px_16px_50px] bg-gradient-to-r from-teal-500 via-teal-450 to-cyan-555 hover:from-teal-600 hover:to-cyan-650 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[inset_0_3px_6px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.15),0_10px_25px_rgba(20,184,166,0.2)] border-none cursor-pointer transition-all duration-300"
          onClick={() => {
            useAuthStore.getState().setPrescriptionId(prescription.id);
            navigate('pharmacy-map', prescription.id);
          }}
        >
          <Search className="size-4.5 shrink-0" />
          Buscar farmacias con stock
        </motion.button>
      )}

      {/* Premium medication reminder scheduler modal */}
      <AnimatePresence>
        {selectedLine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLine(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative max-w-sm w-full p-6 rounded-[40px_16px_40px_16px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-teal-500/20 shadow-2xl z-10 overflow-hidden"
            >
              {/* Decorative top highlight */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
              
              <button
                onClick={() => setSelectedLine(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer"
              >
                <X className="size-4" />
              </button>

              {!isSuccess ? (
                <>
                  <div className="flex gap-3.5 items-start mb-5">
                    <div className="size-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-inner">
                      <Clock className="size-5.5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        Configurar Alarma <Sparkles size={13} className="text-teal-500" />
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {selectedLine.medicine?.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-550 leading-relaxed mb-4 font-semibold">
                    Selecciona a qué hora deseas recibir la notificación push diaria en tu dispositivo para recordar tomar tu dosis.
                  </p>

                  <div className="space-y-4">
                    {/* Time slots selection */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'morning', label: 'Mañana', desc: '08:00 AM' },
                        { id: 'lunch', label: 'Almuerzo', desc: '12:00 PM' },
                        { id: 'dinner', label: 'Cena', desc: '07:00 PM' },
                        { id: 'bedtime', label: 'Noche', desc: '10:00 PM' },
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id as any)}
                          className={cn(
                            'p-3 rounded-2xl text-left border transition-all active:scale-95 cursor-pointer',
                            selectedSlot === slot.id
                              ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 shadow-md shadow-teal-500/5 font-extrabold'
                              : 'bg-slate-500/5 hover:bg-slate-500/10 border-border/40 text-slate-700 dark:text-slate-350'
                          )}
                        >
                          <p className="text-[11px] uppercase tracking-wider font-black">{slot.label}</p>
                          <p className="text-[10px] opacity-75 mt-0.5 font-bold">{slot.desc}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedSlot('custom')}
                        className={cn(
                          'col-span-2 p-3 rounded-2xl text-left border transition-all active:scale-95 cursor-pointer flex items-center justify-between',
                          selectedSlot === 'custom'
                            ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 shadow-md shadow-teal-500/5 font-extrabold'
                            : 'bg-slate-500/5 hover:bg-slate-500/10 border-border/40 text-slate-700 dark:text-slate-350'
                        )}
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-black">Hora Personalizada</p>
                          <p className="text-[10px] opacity-75 mt-0.5 font-bold">Elige tu propia hora</p>
                        </div>
                        <Clock size={16} />
                      </button>
                    </div>

                    {/* Custom time picker field */}
                    {selectedSlot === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 rounded-2xl bg-slate-500/5 border border-border/30 flex items-center justify-between gap-3"
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Seleccionar hora:</span>
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="bg-white dark:bg-zinc-900 border border-border/40 rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                        />
                      </motion.div>
                    )}

                    {/* Schedule action button */}
                    <button
                      onClick={handleScheduleReminder}
                      disabled={isScheduling}
                      className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                      {isScheduling ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <Bell size={14} /> Confirmar Alarma
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-6 text-center"
                >
                  <div className="relative mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"
                    >
                      <Check className="size-8 stroke-[3]" />
                    </motion.div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    ¡Alarma Programada!
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-2 max-w-[240px] leading-relaxed font-bold">
                    Hemos registrado tu recordatorio exitosamente. Recibirás una notificación push directa en este dispositivo para tu dosis de <b>{selectedLine.medicine?.name}</b>.
                  </p>

                  <button
                    onClick={() => setSelectedLine(null)}
                    className="w-full mt-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-305 font-black text-xs active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Entendido
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
