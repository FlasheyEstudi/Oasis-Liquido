'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, Droplets, Loader2, Check, X } from 'lucide-react';

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

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Al menos 1 mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Al menos 1 número', met: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1.5 text-xs">
          {check.met ? (
            <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          ) : (
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={check.met ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ResetPasswordForm() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { navigate, setNotification } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setApiError('Por favor completa todos los campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setApiError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setApiError('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.');
      return;
    }

    setIsSubmitting(true);

    try {
      await post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setIsSuccess(true);
      setNotification({ type: 'success', message: 'Contraseña restablecida exitosamente.' });
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
            <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
            <p className="text-sm text-muted-foreground mt-1">Establece tu nueva contraseña</p>
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
                  <Check className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Contraseña actualizada</h3>
                  <p className="text-sm text-muted-foreground">
                    Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold mt-4"
                >
                  Ir a login
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
                  {/* Token */}
                  <motion.div custom={1} variants={fadeInUp}>
                    <label htmlFor="reset-token" className="block text-sm font-medium text-foreground mb-1.5">
                      Código de verificación
                    </label>
                    <input
                      id="reset-token"
                      type="text"
                      placeholder="Ingresa el código recibido"
                      disabled={isSubmitting}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="glass-input w-full h-11 px-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                    />
                  </motion.div>

                  {/* New Password */}
                  <motion.div custom={2} variants={fadeInUp}>
                    <label htmlFor="reset-new-password" className="block text-sm font-medium text-foreground mb-1.5">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordRequirements password={newPassword} />
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div custom={3} variants={fadeInUp}>
                    <label htmlFor="reset-confirm" className="block text-sm font-medium text-foreground mb-1.5">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="reset-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div custom={4} variants={fadeInUp}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Restableciendo...
                        </>
                      ) : (
                        <>
                          Restablecer
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>

                {/* Back to login */}
                <motion.div custom={5} variants={fadeInUp} className="mt-6 text-center">
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
