'use client';

import { useState } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  X,
  Loader2,
  User,
  Stethoscope
} from 'lucide-react';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClinicBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onSuccess: () => void;
}

export function ClinicBillingModal({ isOpen, onClose, appointment, onSuccess }: ClinicBillingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState('500'); // Default consultation fee
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  if (!appointment) return null;

  const handleProcessBilling = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/v1/clinics/${appointment.clinicId}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointment.id,
          patient_id: appointment.patientId,
          items: [
            { medicine_id: 'service-consultation', quantity: 1, unit_price: parseFloat(amount) }
          ],
          total_amount: parseFloat(amount),
          is_delivery: false
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Cobro procesado exitosamente');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error?.message || 'Error al procesar cobro');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="size-6" />
            </button>

            <div className="text-center mb-8">
              <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <Receipt className="size-10" />
              </div>
              <h3 className="text-2xl font-bold">Procesar Cobro</h3>
              <p className="text-sm text-gray-500 mt-1">Generación de recibo por consulta médica</p>
            </div>

            <GlassCard className="p-4 mb-6 bg-gray-50 dark:bg-white/5 border-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="size-4 text-emerald-600" />
                  <span className="font-medium">{appointment.patient?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Stethoscope className="size-4 text-blue-600" />
                  <span>Dr. {appointment.doctor?.name}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Servicio</span>
                  <span className="text-sm font-semibold">Consulta General</span>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block ml-1">Monto a Cobrar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                  <Input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 h-16 text-3xl font-bold text-emerald-600 text-center rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    paymentMethod === 'cash' 
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                      : "border-gray-100 bg-gray-50 text-gray-400"
                  )}
                >
                  <Banknote className="size-6" />
                  <span className="text-xs font-bold uppercase">Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    paymentMethod === 'card' 
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                      : "border-gray-100 bg-gray-50 text-gray-400"
                  )}
                >
                  <CreditCard className="size-6" />
                  <span className="text-xs font-bold uppercase">Tarjeta</span>
                </button>
              </div>

              <Button 
                className="w-full h-16 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 rounded-2xl"
                disabled={isProcessing || !amount}
                onClick={handleProcessBilling}
              >
                {isProcessing ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-6 mr-2" />
                    Finalizar Cobro
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
