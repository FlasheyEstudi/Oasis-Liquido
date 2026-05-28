// Frontend/src/components/family/SendInvitation.tsx
'use client';

import { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2, AlertCircle, Heart, Copy, X, KeyRound, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { post } from '@/api/client';
import { useAuthStore } from '@/store/auth-store';

export function SendInvitation() {
  const { setNotification } = useAuthStore();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('hijo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ verificationCode: string; patientName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!email.trim()) {
      setError('Por favor ingresa el correo de tu familiar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await post<{ relation: any; verificationCode: string; patientName: string }>('/family/request', {
        email: email.trim().toLowerCase(),
        relationship,
      });

      if (response.success && response.data) {
        setSuccessData({
          verificationCode: response.data.verificationCode,
          patientName: response.data.patientName,
        });
        setEmail('');
        // Disparar la notificación toast global solicitada
        setNotification({
          type: 'success',
          message: `¡Código de vinculación generado para ${response.data.patientName}!`,
        });
      } else {
        setError('No se pudo enviar la invitación. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'Paciente no encontrado con ese correo') {
        setError('El correo ingresado no está registrado en Oasis. Pídele a tu familiar que cree su cuenta primero.');
      } else if (err.response?.data?.message === 'No puedes vincularte a ti mismo') {
        setError('No puedes vincularte a ti mismo.');
      } else {
        setError(err.response?.data?.message || 'Error al procesar la vinculación familiar.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const copyToClipboard = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.verificationCode);
    setCopied(true);
    setNotification({
      type: 'success',
      message: '¡Código copiado al portapapeles con éxito!',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="glass-card rounded-3xl p-6 md:p-8 max-w-lg mx-auto shadow-xl relative overflow-hidden">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Heart className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Agregar miembro familiar</h2>
            <p className="text-xs text-muted-foreground">Vincula a un dependiente (hijo, padre, etc.) para cuidar de su salud</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Correo electrónico del familiar
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full h-11 pl-11 pr-4 rounded-2xl text-sm text-foreground focus:outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>
          </div>

          {/* Relationship Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Parentesco / Relación
            </label>
            <select
              disabled={isSubmitting}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="glass-input w-full h-11 px-4 rounded-2xl text-sm text-foreground focus:outline-none disabled:opacity-50"
            >
              <option value="hijo">Hijo / Hija</option>
              <option value="padre">Padre / Madre</option>
              <option value="conyuge">Cónyuge / Pareja</option>
              <option value="tutor">Tutor Legal</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="glass-btn-primary w-full h-11 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando código...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar invitación familiar
              </>
            )}
          </button>
        </form>
      </div>

      {/* Premium Backdrop Blur Success Modal */}
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-[#060b0b] border border-slate-200/60 dark:border-teal-500/20 rounded-[2.5rem] p-8 max-w-md w-full text-center relative overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Decorative Liquid Glow */}
              <div className="absolute -top-20 -right-20 size-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setSuccessData(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-muted-foreground transition-colors focus:outline-none"
              >
                <X className="size-5" />
              </button>

              {/* Success Animated Badge */}
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 animate-bounce">
                  <KeyRound className="h-8 w-8" />
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-black text-foreground mb-2">
                ¡Código Generado con Éxito!
              </h3>
              <p className="text-xs text-muted-foreground px-2 leading-relaxed mb-6">
                Comparte este PIN único con <strong>{successData.patientName}</strong> para que lo ingrese en la sección de vinculación familiar de su aplicación.
              </p>

              {/* Interactive Code Click-to-Copy Area */}
              <div
                onClick={copyToClipboard}
                className="bg-teal-500/5 hover:bg-teal-500/10 active:scale-98 border border-teal-500/10 dark:border-teal-500/20 rounded-3xl py-6 px-4 mb-6 cursor-pointer transition-all relative group flex flex-col items-center justify-center"
                title="Haga clic para copiar"
              >
                <span className="text-4xl font-extrabold tracking-[0.25em] text-teal-600 dark:text-teal-400 font-mono select-all">
                  {successData.verificationCode}
                </span>
                
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-black uppercase tracking-wider mt-3 flex items-center gap-1.5 justify-center">
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      ¡Copiado con Éxito!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Haz clic para copiar PIN
                    </>
                  )}
                </span>
              </div>

              {/* Additional Context details */}
              <div className="space-y-4 mb-6 text-[11px] text-muted-foreground leading-relaxed italic bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                <p>
                  ⏳ El PIN es válido por <strong>24 horas</strong>. Una vez ingresado, la vinculación familiar quedará activa para siempre de forma segura.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSuccessData(null)}
                className="glass-btn-primary w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-teal-500/10"
              >
                Entendido, Continuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
