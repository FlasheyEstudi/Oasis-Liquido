// Frontend/src/components/family/AcceptInvitation.tsx
'use client';

import { useState } from 'react';
import { ShieldCheck, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { post } from '@/api/client';

export function AcceptInvitation() {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ supervisorName: string; supervisorEmail: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Por favor ingresa el código de 6 dígitos.');
      return;
    }

    if (cleanCode.length !== 6 || isNaN(Number(cleanCode))) {
      setError('El código debe contener exactamente 6 números.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await post<{ supervisorName: string; supervisorEmail: string }>('/family/verify', {
        code: cleanCode,
      });

      if (response.success && response.data) {
        setSuccessData({
          supervisorName: response.data.supervisorName,
          supervisorEmail: response.data.supervisorEmail,
        });
        setCode('');
      } else {
        setError('El código ingresado no es válido.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código incorrecto o expirado. Solicita un nuevo código a tu supervisor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 max-w-lg mx-auto shadow-xl relative overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Vincularme a un supervisor</h2>
          <p className="text-xs text-muted-foreground">Ingresa el código que te dio tu cuidador o familiar</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!successData ? (
          <motion.form
            key="accept-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Code Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider text-center">
                Código de vinculación de 6 dígitos
              </label>
              <div className="relative max-w-[240px] mx-auto">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  disabled={isSubmitting}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="glass-input w-full h-14 pl-12 pr-4 rounded-2xl text-xl font-mono text-center tracking-[0.4em] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/35 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-btn-primary w-full h-11 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando vinculación...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verificar y vincularme
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="accept-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-5"
          >
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">¡Vinculación completada con éxito!</h3>
              <p className="text-xs text-muted-foreground px-4">
                Ahora estás vinculado exitosamente con tu familiar/supervisor:
              </p>
            </div>

            {/* Supervisor card details */}
            <div className="glass-strong border border-border rounded-2xl py-4 px-6 text-left max-w-sm mx-auto shadow-md">
              <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                Supervisor / Cuidador
              </span>
              <span className="text-sm font-bold text-foreground block">
                {successData.supervisorName}
              </span>
              <span className="text-xs text-muted-foreground block font-mono mt-0.5">
                {successData.supervisorEmail}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground px-6 italic">
              Tu supervisor ahora puede comprar medicamentos, ver tus recordatorios de salud y programar consultas médicas en tu nombre de manera segura.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
