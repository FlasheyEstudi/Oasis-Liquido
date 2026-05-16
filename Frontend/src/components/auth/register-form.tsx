'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Droplets, Loader2, Check, X, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { APP_NAME } from '@/utils/constants';
import { post, getErrorMessage } from '@/api/client';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import type { Variants } from 'framer-motion';

import type { AuthResponse } from '@/types';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5 },
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

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { navigate, login, setNotification } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
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

    setIsSubmitting(true);

    try {
      const response = await post<AuthResponse['data']>('/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (response.success && response.data) {
        login(response.data.user, response.data.access_token);
      } else {
        setApiError('Error inesperado. Intenta de nuevo.');
      }
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
            <h1 className="text-2xl font-bold text-foreground">Crea tu cuenta</h1>
            <p className="text-sm text-muted-foreground mt-1">Tu oasis de salud te espera</p>
          </motion.div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <motion.div custom={1} variants={fadeInUp}>
              <label htmlFor="register-name" className="block text-sm font-medium text-foreground mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-name"
                  type="text"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div custom={2} variants={fadeInUp}>
              <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-email"
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

            {/* Role Selector */}
            <motion.div custom={3} variants={fadeInUp}>
              <label htmlFor="register-role" className="block text-sm font-medium text-foreground mb-1.5">
                Tipo de cuenta (Rol)
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <select
                  id="register-role"
                  disabled={isSubmitting}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50 appearance-none bg-transparent"
                >
                  <option value="patient" className="bg-slate-800 text-white">Paciente</option>
                  <option value="doctor" className="bg-slate-800 text-white">Médico</option>
                  <option value="pharmacy_manager" className="bg-slate-800 text-white">Farmacéutico</option>
                  <option value="delivery_driver" className="bg-slate-800 text-white">Repartidor</option>
                  <option value="receptionist" className="bg-slate-800 text-white">Recepcionista</option>
                  <option value="admin" className="bg-slate-800 text-white">Administrador</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              </div>
            </motion.div>

            {/* Password */}
            <motion.div custom={4} variants={fadeInUp}>
              <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordRequirements password={password} />
            </motion.div>

            {/* Confirm Password */}
            <motion.div custom={5} variants={fadeInUp}>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-foreground mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-confirm"
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
            <motion.div custom={5} variants={fadeInUp}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Crear cuenta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Login link */}
          <motion.div custom={6} variants={fadeInUp} className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('entrar')}
                disabled={isSubmitting}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors disabled:opacity-50"
              >
                Iniciar sesión
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
