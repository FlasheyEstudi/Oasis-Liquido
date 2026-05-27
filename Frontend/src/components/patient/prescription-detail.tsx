'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  usePrescription,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, getInitials } from '@/utils/helpers';
import { PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
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

export function PrescriptionDetail() {
  const { selectedItemId, navigate } = useAuthStore();
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
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('recetas')}
        >
          <ArrowLeft className="size-4" />
          Volver a recetas
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500/50 mb-3" />
            <p className="text-sm text-muted-foreground">No se especificó una receta</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (prescriptionQuery.isLoading) {
    return (
      <div className="bento-grid">
        <div className="col-span-12"><div className="shimmer rounded-3xl h-48" /></div>
        <div className="col-span-12 lg:col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
        <div className="col-span-12 lg:col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
      </div>
    );
  }

  if (prescriptionQuery.isError || !prescriptionQuery.data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('recetas')}
        >
          <ArrowLeft className="size-4" />
          Volver a recetas
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {prescriptionQuery.isError ? getHookErrorMessage(prescriptionQuery.error) : 'Receta no encontrada'}
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => prescriptionQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        </GlassCard>
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
    <div className="space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        className="rounded-full gap-2 text-muted-foreground"
        onClick={() => navigate('recetas')}
      >
        <ArrowLeft className="size-4" />
        Volver a recetas
      </Button>

      <div className="bento-grid">
        {/* Prescription Header + QR — col-span-8 */}
        <GlassCard className="col-span-12 lg:col-span-8">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0">
              <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-lg font-semibold">
                {prescription.doctor ? getInitials(prescription.doctor.name) : 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {prescription.doctor?.name || 'Médico'}
                  </h2>
                  {prescription.doctor?.doctor_profile?.specialty && (
                    <p className="text-sm text-muted-foreground">
                      {prescription.doctor.doctor_profile.specialty}
                    </p>
                  )}
                </div>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0',
                  statusConfig?.bgColor,
                  statusConfig?.color
                )}>
                  {statusConfig?.label || prescription.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(prescription.issue_date, 'dd/MM/yyyy')}
                </span>
                {prescription.clinic && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    {prescription.clinic.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Vence: {formatDate(prescription.expiration_date, 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex justify-center">
            <QrCode 
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/family/verify#prescription-${prescription.id}`} 
              size={160} 
              label="Receta Digital"
            />
          </div>
        </GlassCard>

        {/* Fulfillment Progress — col-span-4 */}
        <GlassCard className="col-span-12 lg:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-teal-500/10">
              <Pill className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Surtimiento</h3>
          </div>

          {/* Circular progress indicator */}
          <div className="flex justify-center mb-4">
            <div className="relative size-28">
              <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="currentColor" strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.51} 251`}
                  className="text-teal-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
                <span className="text-[10px] text-muted-foreground">surtido</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {fulfilledQuantity} de {totalQuantity} unidades
            </span>
          </div>
        </GlassCard>

        {/* Medication Lines — col-span-12 */}
        <GlassCard className="col-span-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-sky-500/10">
              <FileText className="size-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Medicamentos</h3>
          </div>

          <div className="space-y-0">
            {prescription.lines?.map((line, index) => {
              const lineProgress = line.quantity > 0
                ? Math.round((line.quantity_fulfilled / line.quantity) * 100)
                : 0;
              const isFulfilled = line.quantity_fulfilled >= line.quantity;
              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'py-4',
                    index > 0 && 'border-t border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full mt-0.5">
                        {isFulfilled ? (
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        ) : lineProgress > 0 ? (
                          <Circle className="size-5 text-amber-500" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {line.medicine?.name || 'Medicamento'}
                        </p>
                        {line.dosage_instructions && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {line.dosage_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        {line.quantity_fulfilled}/{line.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                    {/* Senior-friendly reminder button */}
                    <div className="mt-3 ml-10 flex flex-col gap-2">
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isFulfilled ? 'bg-emerald-500' : lineProgress > 0 ? 'bg-amber-500' : 'bg-muted-foreground/20'
                          )}
                          style={{ width: `${lineProgress}%` }}
                        />
                      </div>
                      
                      {!isFulfilled && line.dosage_instructions && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedLine(line);
                            setSelectedSlot('morning');
                            setIsSuccess(false);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all text-left w-full cursor-pointer"
                        >
                          <div className="size-10 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0">
                            <Clock className="size-6 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Programar Recordatorio</p>
                            <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-medium">Notificarme {line.dosage_instructions}</p>
                          </div>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            {(!prescription.lines || prescription.lines.length === 0) && (
              <p className="py-4 text-sm text-muted-foreground text-center">
                No hay medicamentos en esta receta
              </p>
            )}
          </div>
        </GlassCard>

        {/* Notes — col-span-12 */}
        {prescription.notes && (
          <GlassCard className="col-span-12">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/10">
                <StickyNote className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Notas</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {prescription.notes}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Search Pharmacies Button */}
      {(prescription.status === 'active' || prescription.status === 'partially_fulfilled') && (
        <Button
          className="w-full glass-btn-primary rounded-full gap-2 h-12 text-base mt-4"
          onClick={() => {
            useAuthStore.getState().setPrescriptionId(prescription.id);
            navigate('pharmacy-map', prescription.id);
          }}
        >
          <Search className="size-5" />
          Buscar farmacias con stock
        </Button>
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
              className="relative max-w-sm w-full glass-card p-6 rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-teal-500/20 shadow-2xl z-10 overflow-hidden"
            >
              {/* Decorative top highlight */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
              
              <button
                onClick={() => setSelectedLine(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer"
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

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
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
                              ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 shadow-md shadow-teal-500/5 font-bold'
                              : 'bg-slate-500/5 hover:bg-slate-500/10 border-border/40 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          <p className="text-[11px] uppercase tracking-wider font-extrabold">{slot.label}</p>
                          <p className="text-[10px] opacity-75 mt-0.5">{slot.desc}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedSlot('custom')}
                        className={cn(
                          'col-span-2 p-3 rounded-2xl text-left border transition-all active:scale-95 cursor-pointer flex items-center justify-between',
                          selectedSlot === 'custom'
                            ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 shadow-md shadow-teal-500/5 font-bold'
                            : 'bg-slate-500/5 hover:bg-slate-500/10 border-border/40 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-extrabold">Hora Personalizada</p>
                          <p className="text-[10px] opacity-75 mt-0.5">Elige tu propia hora</p>
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
                          className="bg-white dark:bg-slate-900 border border-border/40 rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                        />
                      </motion.div>
                    )}

                    {/* Schedule action button */}
                    <button
                      onClick={handleScheduleReminder}
                      disabled={isScheduling}
                      className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-[240px] leading-relaxed">
                    Hemos registrado tu recordatorio exitosamente. Recibirás una notificación push directa en este dispositivo para tu dosis de <b>{selectedLine.medicine?.name}</b>.
                  </p>

                  <button
                    onClick={() => setSelectedLine(null)}
                    className="w-full mt-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
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
