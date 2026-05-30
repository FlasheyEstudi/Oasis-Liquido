'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Droplets, Loader2, ArrowLeft, Heart, Stethoscope, Store, Truck, ShieldCheck, Users, Activity, Sparkles } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { useAuthStore } from '@/store/auth-store';
import { auth } from '@/lib/firebase-config';
import { APP_NAME } from '@/utils/constants';
import { post, getErrorMessage } from '@/api/client';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { cn } from '@/lib/utils';
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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { navigate, login, setNotification } = useAuthStore();

  // Desktop Mouse Perspective Tilt states
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Scale rotation to max 8 degrees for smooth natural physical drift
    const rotateX = -(y / (rect.height / 2)) * 8;
    const rotateY = (x / (rect.width / 2)) * 8;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  async function handleGoogleLogin() {
    setApiError(null);
    setIsGoogleSubmitting(true);

    try {
      if (!auth) {
        // En desarrollo local sin credenciales Firebase reales, usar el bypass seguro del backend
        console.warn('Firebase Auth no inicializado. Usando token de desarrollo.');
        const response = await post<AuthResponse['data']>('/auth/firebase-login', {
          idToken: 'mock-token-wendellflashey2023',
        });
        if (response.success && response.data) {
          login(response.data.user, response.data.access_token);
          setNotification({ type: 'success', message: 'Ingreso rápido de desarrollo exitoso' });
        }
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await post<AuthResponse['data']>('/auth/firebase-login', { idToken });

      if (response.success && response.data) {
        login(response.data.user, response.data.access_token);
      } else {
        setApiError('Error al iniciar sesión con Google.');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user')) {
        return;
      }
      console.error('Google Sign-In Error:', error);
      setApiError(getErrorMessage(error));
      setNotification({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

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
    <div className="relative flex h-screen max-h-screen overflow-hidden items-center justify-center px-4 py-0 bg-gradient-to-tr from-slate-50 via-zinc-100 to-teal-50/20 dark:from-[#030606] dark:via-[#010203] dark:to-[#020507] transition-colors duration-500 select-none">
      <OrganicBlobs />

      {/* Futuristic Floating Aura Lights */}
      <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-teal-500/5 rounded-full blur-[110px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-cyan-500/5 rounded-full blur-[110px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial="hidden"
        animate="visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="relative z-10 w-full max-w-md md:max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Left Panel: App Advantages - Displayed on medium screens and up */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 rounded-[2.5rem] backdrop-blur-3xl bg-teal-950/10 dark:bg-zinc-950/60 border border-white/20 dark:border-zinc-800/30 text-slate-900 dark:text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div style={{ transform: 'translateZ(30px)' }}>
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

            <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-zinc-800/30 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-medium" style={{ transform: 'translateZ(10px)' }}>
              <span>© {new Date().getFullYear()} Oasis Nicaragua</span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Seguro & En Línea
              </span>
            </div>
          </div>

          {/* Right Panel: The Login Form */}
          <div className="col-span-1 md:col-span-7 flex flex-col justify-between backdrop-blur-3xl bg-white/40 dark:bg-zinc-950/40 border border-white/20 dark:border-zinc-800/30 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.1),_0_24px_64px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-6 md:p-8 transition-all duration-300">
            <div style={{ transform: 'translateZ(40px)' }}>
              {/* Go Back button */}
              <button
                type="button"
                onClick={() => navigate('bienvenida')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/50 dark:bg-zinc-800/30 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-800/30 transition-all mb-4 self-start group cursor-pointer"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
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
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </motion.div>

                {/* Submit - Rebuilt to Claymorphic Primary */}
                <motion.div custom={4} variants={fadeInUp}>
                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="clay-btn-primary w-full h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 relative transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
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

                {/* Google Sign-in Button */}
                <motion.div custom={4.5} variants={fadeInUp}>
                  <button
                    type="button"
                    disabled={isSubmitting || isGoogleSubmitting}
                    onClick={handleGoogleLogin}
                    className="w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-900/60 text-slate-800 dark:text-zinc-200 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm relative overflow-hidden"
                  >
                    {isGoogleSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                    )}
                    <span>Continuar con Google</span>
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
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Crear cuenta
                  </button>
                </p>
              </motion.div>
            </div>

            {/* Demo Logins Section */}
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
    { id: 'patient', label: 'Soy Paciente', icon: <Heart className="size-3.5" />, color: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] font-bold' },
    { id: 'doctor', label: 'Soy Doctor', icon: <Stethoscope className="size-3.5" />, color: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] font-bold' },
    { id: 'pharmacy_manager', label: 'Soy Farmacia', icon: <Store className="size-3.5" />, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] font-bold' },
    { id: 'delivery_driver', label: 'Soy Repartidor', icon: <Truck className="size-3.5" />, color: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] font-bold' },
  ];

  return (
    <div className="mt-6 pt-5 border-t border-slate-200/40 dark:border-zinc-800/30" style={{ transform: 'translateZ(20px)' }}>
      <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 dark:text-zinc-500 text-center mb-3">
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
              "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 cursor-pointer",
              role.color
            )}
          >
            {isDemoLoading === role.id ? (
              <Loader2 className="size-3.5 animate-spin mx-auto text-teal-500" />
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
