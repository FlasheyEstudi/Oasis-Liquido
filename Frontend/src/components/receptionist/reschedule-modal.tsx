'use client';

import { useState } from 'react';
import { 
  CalendarDays,
  CheckCircle2, 
  X,
  Loader2,
  User,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUpdateAppointment } from '@/hooks/use-api';
import { formatDate } from '@/utils/helpers';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onSuccess: () => void;
}

export function RescheduleModal({ isOpen, onClose, appointment, onSuccess }: RescheduleModalProps) {
  const updateAppointment = useUpdateAppointment();
  
  // Calculate current date_time in standard local format for datetime-local input
  const getInitialDateTime = () => {
    if (!appointment?.date_time) return '';
    try {
      const date = new Date(appointment.date_time);
      // Format to YYYY-MM-DDThh:mm
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch {
      return '';
    }
  };

  const [newDateTime, setNewDateTime] = useState(getInitialDateTime());

  // Reset input when appointment changes
  useState(() => {
    if (appointment) {
      setNewDateTime(getInitialDateTime());
    }
  });

  if (!appointment) return null;

  const handleReschedule = async () => {
    if (!newDateTime) {
      toast.warning('Selecciona una nueva fecha y hora');
      return;
    }

    const isoDate = new Date(newDateTime).toISOString();

    updateAppointment.mutate({
      id: appointment.id,
      data: {
        date_time: isoDate
      }
    }, {
      onSuccess: () => {
        toast.success('Cita reagendada exitosamente');
        onSuccess();
        onClose();
      },
      onError: (error: any) => {
        const errMsg = error?.response?.data?.message || error.message || 'Error al reagendar cita';
        toast.error(errMsg);
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="reschedule-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative border border-gray-100 dark:border-white/10"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X className="size-6" />
            </button>

            <div className="text-center mb-8">
              <div className="size-16 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 mx-auto mb-4">
                <CalendarDays className="size-10" />
              </div>
              <h3 className="text-2xl font-bold">Reagendar Cita</h3>
              <p className="text-sm text-gray-500 mt-1">Selecciona una nueva fecha y hora para el paciente</p>
            </div>

            <GlassCard className="p-4 mb-6 bg-gray-50 dark:bg-white/5 border-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="size-4 text-sky-600" />
                  <span className="font-semibold">{appointment.patient?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Clock className="size-4 text-gray-400" />
                  <span>Fecha Actual: <strong>{formatDate(appointment.date_time, "dd/MM/yyyy 'a las' HH:mm")}</strong></span>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block ml-1">Nueva Fecha y Hora</label>
                <div className="relative">
                  <Input 
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    className="h-14 font-medium text-center rounded-2xl glass-input w-full"
                    min={new Date().toISOString().split('T')[0] + 'T00:00'}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-bold"
                  onClick={onClose}
                  disabled={updateAppointment.isPending}
                >
                  Cancelar
                </Button>
                
                <Button 
                  className="flex-1 h-14 font-bold bg-sky-600 hover:bg-sky-700 shadow-xl shadow-sky-500/20 rounded-2xl"
                  disabled={updateAppointment.isPending || !newDateTime}
                  onClick={handleReschedule}
                >
                  {updateAppointment.isPending ? (
                    <Loader2 className="size-5 animate-spin mx-auto" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-5 mr-2 shrink-0" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
