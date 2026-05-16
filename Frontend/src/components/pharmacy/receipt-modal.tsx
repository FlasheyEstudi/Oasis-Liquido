'use client';

import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Receipt,
  Scissors,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewModal } from '@/components/oasis/review-modal';
import { toast } from 'sonner';
import { getApiUrl, getAccessToken } from '@/api/client';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  const { user } = useAuthStore();
  const [showReview, setShowReview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!sale) return null;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${getApiUrl()}/sales/${sale.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${sale.id.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Recibo descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar el recibo');
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine if we should show review button (only for patients or if handed to patient)
  const canReview = sale.patientId && user?.role !== 'pharmacy_manager';

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="receipt-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
          >
            {/* Top Pattern */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-sky-500 to-purple-500" />
            
            <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="size-6" />
            </button>

            <div className="text-center mb-10">
              <div className="size-20 bg-teal-500/10 rounded-3xl flex items-center justify-center text-teal-600 mx-auto mb-4 border border-teal-500/20">
                <CheckCircle2 className="size-10" />
              </div>
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">¡Venta Exitosa!</h3>
              <p className="text-sm text-zinc-500 mt-2 font-medium">Su comprobante está listo</p>
            </div>

            {/* Receipt Content */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl p-8 shadow-inner border border-zinc-200 dark:border-zinc-800 relative">
              {/* Serrated edge effect simulation */}
              <div className="absolute -bottom-3 left-0 w-full flex justify-around">
                 {Array(20).fill(0).map((_, i) => (
                   <div key={i} className="size-6 bg-zinc-50 dark:bg-zinc-900 rounded-full -mt-3" />
                 ))}
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Oasis Aura</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{sale.pharmacy?.name || 'Farmacia Central'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Recibo</p>
                  <p className="text-sm font-mono font-bold">#{sale.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 py-6 space-y-4">
                {sale.saleItems?.map((item: any, index: number) => (
                  <div key={item.id || `item-${index}`} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{item.medicine?.name}</p>
                      <p className="text-xs text-zinc-500">x{item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-zinc-900 dark:border-white pt-6 flex justify-between items-center">
                <span className="text-lg font-bold uppercase tracking-widest">Total</span>
                <span className="text-3xl font-black text-teal-600">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-block p-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
                   <div className="size-24 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://oasis-aura.com/#verify-sale-${sale.id}`)}`} 
                        alt="QR Code" 
                        className="size-full object-contain"
                      />
                   </div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-4 font-bold uppercase tracking-[0.2em]">Gracias por confiar en Oasis</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-12">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Download className="size-5" />
                )}
                Descargar PDF
              </Button>
              {sale.patientId ? (
                <Button 
                  className="h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold flex items-center gap-2 hover:opacity-90 shadow-xl"
                  onClick={() => setShowReview(true)}
                >
                  Calificar Servicio
                </Button>
              ) : (
                <Button 
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold flex items-center gap-2"
                  onClick={onClose}
                >
                  Nueva Venta
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <ReviewModal 
        key="review-modal-inner"
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        targetName={sale.pharmacy?.name || 'Farmacia'}
        targetType="pharmacy"
        onSubmit={(r, c) => {
          console.log('Review submitted:', r, c);
          toast.success('¡Gracias por tu reseña!');
        }}
      />
    </AnimatePresence>
  );
}
