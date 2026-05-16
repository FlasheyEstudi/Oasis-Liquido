'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Droplets, Loader2 } from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { post, getErrorMessage } from '@/api/client';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { navigate, setNotification } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!email.trim()) {
      setApiError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setIsSubmitting(true);

    try {
      await post('/auth/forgot-password', { email });
      setIsSuccess(true);
      setNotification({ type: 'success', message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.' });
    } catch (error) {
      const msg = getErrorMessage(error);
      setApiError(msg);
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 overflow-hidden">
      <OrganicBlobs />

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <motion.div custom={0} variants={fadeInUp} className="flex flex-col items-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/25 mb-4">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>
            <p className="text-sm text-muted-foreground mt-1">Te enviaremos instrucciones por correo</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
                  <Mail className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Correo enviado</h3>
                  <p className="text-sm text-muted-foreground">
                    Si el correo existe, recibirás instrucciones para restablecer tu contraseña.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold mt-4"
                >
                  Volver al login
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* API Error */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-6"
                  >
                    {apiError}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <motion.div custom={1} variants={fadeInUp}>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-foreground mb-1.5">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div custom={2} variants={fadeInUp}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar enlace
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>

                {/* Back to login */}
                <motion.div custom={3} variants={fadeInUp} className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('login')}
                    disabled={isSubmitting}
                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors disabled:opacity-50"
                  >
                    Volver al login
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
