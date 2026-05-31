'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Droplets,
  Loader2,
  Check,
  X,
  ShieldAlert,
  Building,
  Store,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useInvitation, useAcceptInvitation, getHookErrorMessage } from '@/hooks/use-api';
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

export function AcceptInvitationForm() {
  const { navigate, setNotification, selectedItemId } = useAuthStore();
  const token = selectedItemId || '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch invitation details
  const { data: invitation, isLoading, error } = useInvitation(token, !!token);
  const acceptInvite = useAcceptInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      setApiError('Por favor completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      setApiError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setApiError('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.');
      return;
    }

    try {
      await acceptInvite.mutateAsync({
        token,
        name: name.trim(),
        password: password.trim(),
      });
      setIsSuccess(true);
      setNotification({ type: 'success', message: '¡Cuenta activada! Bienvenido a OASIS.' });
    } catch (err) {
      const msg = getHookErrorMessage(err) || 'Error al aceptar la invitación';
      setApiError(msg);
      setNotification({ type: 'error', message: msg });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'doctor':
        return { label: 'Médico / Doctor', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' };
      case 'receptionist':
        return { label: 'Recepcionista', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' };
      case 'cashier':
        return { label: 'Cajero', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' };
      case 'delivery_driver':
        return { label: 'Repartidor', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' };
      default:
        return { label: role, color: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 overflow-y-auto">
      <OrganicBlobs />

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <motion.div custom={0} variants={fadeInUp} className="flex flex-col items-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/25 mb-4">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Invitación de Empleo</h1>
            <p className="text-sm text-muted-foreground mt-1">Completa tu registro para unirte al equipo</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center flex flex-col items-center justify-center gap-3"
              >
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                <p className="text-sm text-muted-foreground">Validando enlace de invitación...</p>
              </motion.div>
            ) : error || !invitation ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6 space-y-4"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                  <ShieldAlert className="h-7 w-7 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Enlace no válido o expirado</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Esta invitación ha expirado, ya ha sido utilizada, o el token de seguridad es incorrecto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('bienvenida')}
                  className="glass-btn-secondary w-full h-11 rounded-full text-sm font-semibold mt-4"
                >
                  Volver a Inicio
                </button>
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">¡Cuenta activada con éxito!</h3>
                  <p className="text-sm text-muted-foreground">
                    Has completado tu registro. Ya puedes iniciar sesión con tu correo electrónico y la contraseña que has creado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('entrar')}
                  className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold mt-4"
                >
                  Ir al Login
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Offer Details */}
                <div className="rounded-2xl bg-teal-500/5 border border-teal-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    {invitation.clinic ? (
                      <Building className="size-5 text-teal-500 shrink-0" />
                    ) : (
                      <Store className="size-5 text-sky-500 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                        Sede de Trabajo
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {invitation.clinic?.name || invitation.pharmacy?.name || 'Sede OASIS'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/10 pt-2.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                        Correo de Registro
                      </span>
                      <span className="text-xs text-foreground font-medium">{invitation.email}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getRoleBadge(invitation.role).color}`}>
                      {getRoleBadge(invitation.role).label}
                    </span>
                  </div>
                </div>

                {/* API Error */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
                  >
                    {apiError}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="invite-name" className="block text-xs font-semibold text-foreground mb-1.5">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="invite-name"
                        type="text"
                        placeholder="Dr. Carlos Mendoza"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="invite-password" className="block text-xs font-semibold text-foreground mb-1.5">
                      Establecer Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="invite-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordRequirements password={password} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="invite-confirm" className="block text-xs font-semibold text-foreground mb-1.5">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="invite-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={acceptInvite.isPending}
                    className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                  >
                    {acceptInvite.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Activando cuenta...
                      </>
                    ) : (
                      <>
                        Activar Cuenta y Perfil
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
