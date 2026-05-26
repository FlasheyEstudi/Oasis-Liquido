'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Droplets, Loader2 } from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { APP_NAME } from '@/utils/constants';
import { post, getErrorMessage } from '@/api/client';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';

import { AnimatedLogo } from '@/components/ui/animated-logo';
import type { AuthResponse } from '@/types';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { navigate, login, setNotification } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!email.trim() || !password.trim()) {
      setApiError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await post<AuthResponse['data']>('/auth/login', { email, password });

      if (response.success && response.data) {
        login(response.data.user, response.data.access_token);
      } else {
        setApiError('Error inesperado. Intenta de nuevo.');
      }
    } catch (error) {
      setApiError(getErrorMessage(error));
      setNotification({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex h-screen max-h-screen overflow-hidden items-center justify-center px-4 py-0 bg-gradient-to-tr from-slate-50 via-zinc-100 to-teal-50/20 dark:from-[#030606] dark:via-[#010203] dark:to-[#020507] transition-colors duration-500">
      <OrganicBlobs />

      {/* Futuristic Floating Lights */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md md:max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Left Panel: App Advantages - Displayed on medium screens and up */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 rounded-[2.5rem] backdrop-blur-3xl bg-teal-950/10 dark:bg-zinc-950/60 border border-white/20 dark:border-zinc-800/30 text-slate-900 dark:text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase">
                  Oasis v0.2-RC1
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-tight mb-4 bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 dark:from-teal-400 dark:via-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Eleva tu Salud Digital
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light mb-8">
                Oasis es la plataforma de salud líder en telemedicina y entrega farmacéutica en Nicaragua. Diseñado para simplificar tu vida y proteger a tu familia.
              </p>

              {/* Bullet Advantages list */}
              <div className="space-y-4">
                {[
                  { title: 'Rastreo Satelital Activo', desc: 'Sigue tus medicamentos en tiempo real por mapa interactivo.', icon: <Activity className="size-4 text-teal-600 dark:text-teal-400" /> },
                  { title: 'Firma Digital Médica', desc: 'Recetas oficiales aprobadas con firma electrónica HMAC.', icon: <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" /> },
                  { title: 'Núcleo Familiar Seguro', desc: 'Vincula familiares y dependientes con códigos de 6 dígitos.', icon: <Users className="size-4 text-cyan-600 dark:text-cyan-400" /> },
                  { title: 'Historial Centralizado', desc: 'Toda tu información clínica resguardada de forma profesional.', icon: <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" /> },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/40 dark:bg-zinc-900/40 flex items-center justify-center border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-light mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-zinc-800/30 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              <span>© {new Date().getFullYear()} Oasis Nicaragua</span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Seguro & En Línea
              </span>
            </div>
          </div>

          {/* Right Panel: The Login Form */}
          <div className="col-span-1 md:col-span-7 flex flex-col justify-between backdrop-blur-3xl bg-white/40 dark:bg-zinc-950/40 border border-white/20 dark:border-zinc-800/30 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.1),_0_24px_64px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-6 md:p-8 transition-all duration-300">
            <div>
              {/* Go Back button */}
              <button
                type="button"
                onClick={() => navigate('bienvenida')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/50 dark:bg-zinc-800/30 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-800/30 transition-all mb-4 self-start group"
              >
                <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Volver al inicio
              </button>

              {/* Logo */}
              <motion.div custom={0} variants={fadeInUp} className="flex flex-col items-center mb-4">
                <div className="relative group flex flex-col items-center">
                  <AnimatedLogo className="scale-[1.15] mb-2" showLabel={false} />
                </div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">Bienvenido de vuelta</h1>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Ingresa a tu oasis de salud</p>
              </motion.div>

              {/* API Error */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-4 py-3.5 text-xs text-red-700 dark:text-red-400 mb-6 font-medium"
                >
                  {apiError}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <motion.div custom={1} variants={fadeInUp}>
                  <label htmlFor="login-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-teal-500 transition-colors" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="tu@correo.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 dark:focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-teal-500/10 focus:outline-none transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div custom={2} variants={fadeInUp}>
                  <label htmlFor="login-password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-teal-500 transition-colors" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-11 pr-11 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 dark:focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-teal-500/10 focus:outline-none transition-all duration-300 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Forgot password */}
                <motion.div custom={3} variants={fadeInUp} className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('recuperar-cuenta')}
                    disabled={isSubmitting}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors disabled:opacity-50"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </motion.div>

                {/* Submit */}
                <motion.div custom={4} variants={fadeInUp}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      <>
                        Iniciar sesión
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Register link */}
              <motion.div custom={5} variants={fadeInUp} className="mt-5 text-center">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('registro')}
                    disabled={isSubmitting}
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors disabled:opacity-50"
                  >
                    Crear cuenta
                  </button>
                </p>
              </motion.div>
            </div>

            {/* Demo Logins */}
            <DemoLoginSection isSubmitting={isSubmitting} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DemoLoginSection({ isSubmitting }: { isSubmitting: boolean }) {
  const { login } = useAuthStore();
  const [isDemoLoading, setIsDemoLoading] = useState<string | null>(null);

  async function handleDemoLogin(role: string) {
    if (isSubmitting || isDemoLoading) return;
    setIsDemoLoading(role);
    try {
      const { demoLogin } = await import('@/api/auth');
      const data = await demoLogin(role);
      login(data.user, data.access_token);
    } catch (err) {
      console.error('Demo login failed', err);
    } finally {
      setIsDemoLoading(null);
    }
  }

  const roles = [
    { id: 'patient', label: 'Soy Paciente', icon: <Heart className="size-3.5" />, color: 'bg-teal-500/10 text-teal-600' },
    { id: 'doctor', label: 'Soy Doctor', icon: <Stethoscope className="size-3.5" />, color: 'bg-sky-500/10 text-sky-600' },
    { id: 'pharmacy_manager', label: 'Soy Farmacia', icon: <Store className="size-3.5" />, color: 'bg-emerald-500/10 text-emerald-600' },
    { id: 'delivery_driver', label: 'Soy Repartidor', icon: <Truck className="size-3.5" />, color: 'bg-amber-500/10 text-amber-600' },
  ];

  return (
    <div className="mt-6 pt-5 border-t border-border/50">
      <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground text-center mb-3">
        Acceso rápido Demo
      </p>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            disabled={isSubmitting || !!isDemoLoading}
            onClick={() => handleDemoLogin(role.id)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50",
              role.color
            )}
          >
            {isDemoLoading === role.id ? (
              <Loader2 className="size-3.5 animate-spin mx-auto" />
            ) : (
              <>
                {role.icon}
                {role.label}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

import { Heart, Stethoscope, Store, Truck, ArrowLeft, ShieldCheck, Users, Activity, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

