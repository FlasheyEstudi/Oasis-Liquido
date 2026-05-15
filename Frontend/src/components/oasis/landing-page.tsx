'use client';

import { useAuthStore } from '@/store/auth-store';
import { APP_TAGLINE } from '@/utils/constants';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  Calendar,
  FileText,
  Truck,
  Shield,
  Droplets,
  ArrowRight,
  Star,
  Heart,
  Clock,
  Smartphone,
  Sparkles,
  Activity,
  Pill,
  Stethoscope,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRef } from 'react';

/* ============ DATA ============ */

const features = [
  {
    icon: <Calendar className="size-6" />,
    title: 'Citas Médicas',
    desc: 'Agenda consultas con médicos cercanos en segundos. Mapa interactivo con disponibilidad en tiempo real.',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    gradient: 'from-teal-500/20 to-teal-500/0',
    span: 'lg:col-span-2',
  },
  {
    icon: <FileText className="size-6" />,
    title: 'Recetas Electrónicas',
    desc: 'Recetas digitales con código QR. Seguras, verificables, sin papel.',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    gradient: 'from-sky-500/20 to-sky-500/0',
    span: '',
  },
  {
    icon: <Pill className="size-6" />,
    title: 'Farmacias Cercanas',
    desc: 'Encuentra farmacias en el mapa con disponibilidad de medicamentos en tiempo real.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
    span: '',
  },
  {
    icon: <Truck className="size-6" />,
    title: 'Delivery a Domicilio',
    desc: 'Recibe tus medicamentos en casa. Rastreo en vivo con GPS y notificaciones en tiempo real.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    gradient: 'from-amber-500/20 to-amber-500/0',
    span: 'lg:col-span-2',
  },
  {
    icon: <Shield className="size-6" />,
    title: 'Datos Seguros',
    desc: 'Encriptación de extremo a extremo. Tu información médica, protegida siempre.',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    gradient: 'from-violet-500/20 to-violet-500/0',
    span: '',
  },
  {
    icon: <Smartphone className="size-6" />,
    title: 'Multi-plataforma',
    desc: 'Disponible en web y móvil. Tu salud, siempre a la mano.',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500/20 to-orange-500/0',
    span: '',
  },
];

const stats = [
  { value: '10K+', label: 'Pacientes', icon: <Heart className="size-4" /> },
  { value: '500+', label: 'Médicos', icon: <Stethoscope className="size-4" /> },
  { value: '24/7', label: 'Disponibilidad', icon: <Clock className="size-4" /> },
  { value: '4.9', label: 'Calificación', icon: <Star className="size-4" /> },
];

const testimonials = [
  {
    name: 'María González',
    role: 'Paciente',
    text: 'Esta plataforma cambió mi forma de gestionar mis citas médicas. Todo desde mi teléfono, sin filas.',
    avatar: 'MG',
  },
  {
    name: 'Dr. Roberto Sánchez',
    role: 'Médico General',
    text: 'Las recetas electrónicas con QR son un antes y después. Seguras y profesionales.',
    avatar: 'RS',
  },
  {
    name: 'Ana Martínez',
    role: 'Farmacéutica',
    text: 'El escaneo de QR para surtir recetas es rápido y elimina errores. Increíble.',
    avatar: 'AM',
  },
];

const benefits = [
  'Sin papel — todo digital',
  'Citas en menos de 30 segundos',
  'Recetas verificables con QR',
  'Rastreo GPS en tiempo real',
  'Historial médico siempre disponible',
  'Notificaciones inteligentes',
];

/* ============ ANIMATION VARIANTS ============ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ============ LOGO COMPONENT ============ */

function OasisLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-16',
    xl: 'size-24 sm:size-28',
  };
  return (
    <div className={`${sizes[size]} relative`}>
      <Image
        src="/oasis-logo.png"
        alt="OASIS"
        fill
        className="object-contain"
        priority={size === 'xl'}
      />
    </div>
  );
}

/* ============ COMPONENT ============ */

export function OasisLandingPage() {
  const { navigate } = useAuthStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 120]), { stiffness: 100 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden relative">
      {/* Organic Blobs */}
      <div className="blob-1" />
      <div className="blob-2" />
      <div className="blob-3" />

      {/* ============ NAVBAR ============ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      >
        <div className="max-w-6xl mx-auto">
          <div className="glass-strong rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <OasisLogo size="md" />
            </motion.div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:block h-6 w-px bg-border mx-1" />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('login')}
                className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Iniciar sesión
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('register')}
                className="glass-btn-primary rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
              >
                Comenzar
                <ArrowRight className="size-3.5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ============ HERO SECTION ============ */}
      <section ref={heroRef} className="relative z-10 pt-32 sm:pt-40 pb-16 px-4">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 mb-8"
          >
            <Sparkles className="size-4 text-teal-500" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
              Tu refugio de salud digital
            </span>
          </motion.div>

          {/* Logo as the hero mark — no redundant text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-6"
          >
            <OasisLogo size="xl" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-4 font-light"
          >
            {APP_TAGLINE}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Citas médicas, recetas electrónicas con QR, farmacias en el mapa y delivery a domicilio.
            Todo en un solo lugar, diseñado para tu calma.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('register')}
              className="glass-btn-primary rounded-2xl px-8 py-3.5 text-base font-semibold flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              Comenzar ahora
              <ArrowRight className="size-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('login')}
              className="glass rounded-2xl px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 hover:shadow-md transition-all flex items-center gap-2"
            >
              <Play className="size-4 text-teal-500" />
              Iniciar sesión
            </motion.button>
          </motion.div>

          {/* Benefits pills */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {benefits.slice(0, 4).map((benefit) => (
              <motion.span
                key={benefit}
                variants={itemVariants}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 glass rounded-full px-3 py-1.5"
              >
                <CheckCircle2 className="size-3 text-teal-500" />
                {benefit}
              </motion.span>
            ))}
          </motion.div>

          </motion.div>
      </section>

      {/* ============ STATS SECTION ============ */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center justify-center gap-1.5 mb-2"
                  >
                    <span className="text-slate-400">{stat.icon}</span>
                    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      {stat.value}
                    </span>
                  </motion.div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FEATURES BENTO GRID ============ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4"
            >
              <Activity className="size-3.5 text-teal-500" />
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Funcionalidades
              </span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Todo lo que necesitas, en un{' '}
              <span className="bg-gradient-to-r from-teal-600 to-sky-500 bg-clip-text text-transparent">
                solo lugar
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Diseñado para ser tu refugio digital de salud. Cada función piensa en tu bienestar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, transition: { duration: 0.25, type: 'spring', stiffness: 200 } }}
                className={cn(
                  'glass rounded-3xl p-6 cursor-pointer group relative overflow-hidden',
                  feature.span
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500', feature.gradient)} />

                <div className="relative z-10">
                  <div className={cn('size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110', feature.bg, feature.color)}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>

                  <div className="flex items-center gap-1 mt-4 text-teal-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                    <span className="text-xs font-semibold">Explorar</span>
                    <ChevronRight className="size-3" />
                  </div>
                </div>

                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute top-0 left-[-100%] w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-700" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENEFITS SECTION ============ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left - Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="glass-strong rounded-3xl p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full" />
                <OasisLogo size="xl" />
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-4 right-4 glass rounded-2xl px-3 py-2 flex items-center gap-2"
                >
                  <Shield className="size-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Verificado</span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-4 left-4 glass rounded-2xl px-3 py-2 flex items-center gap-2"
                >
                  <Droplets className="size-3.5 text-teal-500" />
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">100% Digital</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right - Benefits list */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por qué elegir{' '}
                <span className="bg-gradient-to-r from-teal-600 to-sky-500 bg-clip-text text-transparent">esta plataforma</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                No es solo otra app de salud. Es tu refugio digital donde cada detalle está diseñado para darte paz mental.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 glass rounded-2xl px-4 py-3 group hover:bg-teal-500/5 dark:hover:bg-teal-500/5 transition-colors"
                  >
                    <div className="size-8 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="size-4 text-teal-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Lo que dicen nuestros{' '}
              <span className="bg-gradient-to-r from-teal-600 to-sky-500 bg-clip-text text-transparent">usuarios</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass rounded-3xl p-6 group"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-10 sm:p-14 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 size-60 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full" />
            <div className="absolute -bottom-20 -left-20 size-60 bg-gradient-to-tr from-sky-500/10 to-transparent rounded-full" />

            <div className="flex justify-center mb-6">
              <OasisLogo size="lg" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative">
              Tu oasis de salud te espera
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 relative">
              Únete a miles de personas que ya encontraron su refugio digital de salud.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('register')}
              className="glass-btn-primary rounded-2xl px-10 py-4 text-lg font-semibold inline-flex items-center gap-2 shadow-xl shadow-teal-500/20 relative"
            >
              Crear cuenta gratuita
              <ArrowRight className="size-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 mt-auto border-t border-border px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <OasisLogo size="sm" />
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle className="scale-90" />
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} OASIS
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
