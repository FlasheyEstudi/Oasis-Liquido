// Frontend/src/components/family/SendInvitation.tsx
'use client';

import { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { post } from '@/api/client';

export function SendInvitation() {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('hijo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ verificationCode: string; patientName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 max-w-lg mx-auto shadow-xl relative overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
          <Heart className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Agregar miembro familiar</h2>
          <p className="text-xs text-muted-foreground">Vincula a un dependiente (hijo, padre, etc.) para cuidar de su salud</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!successData ? (
          <motion.form
            key="invite-form"
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
          </motion.form>
        ) : (
          <motion.div
            key="invite-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-5"
          >
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">¡Código generado con éxito!</h3>
              <p className="text-xs text-muted-foreground px-4">
                Comparte este código con <strong>{successData.patientName}</strong> para que lo ingrese en su aplicación de Oasis Nicaragua y complete la vinculación familiar.
              </p>
            </div>

            {/* Code Badge */}
            <div className="bg-teal-500/5 border border-teal-500/15 rounded-2xl py-4 px-6 inline-block">
              <span className="text-3xl font-extrabold tracking-widest text-teal-600 dark:text-teal-400 block font-mono">
                {successData.verificationCode}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 block">
                Válido por 24 horas
              </span>
            </div>

            <button
              onClick={() => setSuccessData(null)}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold underline block mx-auto transition-colors"
            >
              Enviar otra invitación
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
