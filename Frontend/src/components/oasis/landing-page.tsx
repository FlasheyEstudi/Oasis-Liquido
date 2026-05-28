'use client';

import { useAuthStore } from '@/store/auth-store';
import { APP_TAGLINE } from '@/utils/constants';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
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
  HelpCircle,
  Users,
  Compass
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { ShowcaseDashboard } from '@/components/landing/showcase-dashboard';
import { LoadingScreen } from '@/components/oasis/loading-screen';
import { CounterAnimation } from '@/components/landing/counter-animation';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';

/* ============ DATA ============ */

const features = [
  {
    icon: <Calendar className="size-6" />,
    title: 'Citas Médicas al Instante',
    desc: 'Agenda consultas con médicos colegiados y autorizados en León, Managua o Granada en segundos. Tu tranquilidad familiar es nuestra prioridad.',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    gradient: 'from-teal-500/20 to-teal-500/0',
    span: 'lg:col-span-2',
  },
  {
    icon: <FileText className="size-6" />,
    title: 'Recetas Criptográficas',
    desc: 'Recetas digitales certificadas bajo firma digital HMAC-SHA256. 100% seguras, verificables por código QR y avaladas legalmente.',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    gradient: 'from-sky-500/20 to-sky-500/0',
    span: '',
  },
  {
    icon: <Pill className="size-6" />,
    title: 'Inventario de Farmacias',
    desc: 'Localiza farmacias cercanas y confirma la disponibilidad real de tus medicamentos antes de salir. Sin viajes en vano, sin llamadas molestas.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
    span: '',
  },
  {
    icon: <Truck className="size-6" />,
    title: 'Envío Seguro a Domicilio',
    desc: 'Recibe tu tratamiento directamente en la puerta de tu hogar. Monitorea el trayecto en vivo en un mapa interactivo con rastreo satelital GPS.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    gradient: 'from-amber-500/20 to-amber-500/0',
    span: 'lg:col-span-2',
  },
  {
    icon: <Shield className="size-6" />,
    title: 'Datos Clínicos Protegidos',
    desc: 'Privacidad absoluta con encriptación de extremo a extremo y cumplimiento estricto de los estándares HIPAA de salud.',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    gradient: 'from-violet-500/20 to-violet-500/0',
    span: '',
  },
  {
    icon: <Smartphone className="size-6" />,
    title: 'Núcleo Familiar Vinculado',
    desc: 'Vincula a tus padres o hijos con un PIN seguro de 6 dígitos. Gestiona, surte y rastrea sus recetas médicas con total facilidad.',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500/20 to-orange-500/0',
    span: '',
  },
];

const stats = [
  { value: 12000, suffix: '+', label: 'Pacientes Cuidados', icon: <Heart className="size-4 text-rose-500" /> },
  { value: 620, suffix: '+', label: 'Médicos Acreditados', icon: <Stethoscope className="size-4 text-teal-500" /> },
  { value: 24, suffix: '/7', label: 'Protección Continua', icon: <Clock className="size-4 text-sky-500" /> },
  { value: 99, suffix: '%', label: 'Entregas Exitosas', icon: <CheckCircle2 className="size-4 text-[#00C2A0]" /> },
];

const testimonials = [
  {
    name: 'María González',
    role: 'Paciente Regular (León)',
    text: 'Tenía miedo de que la receta digital no fuera aceptada en mi farmacia local, pero bastó con mostrar el código QR. ¡Fue inmediato, sin filas de espera y me ahorró horas de dolor de cabeza!',
    avatar: 'MG',
  },
  {
    name: 'Dr. Roberto Sánchez',
    role: 'Médico General (Managua)',
    text: 'La adherencia al tratamiento de mis pacientes aumentó un 40% desde que usamos Oasis. La receta firmada digitalmente con HMAC da total certeza legal y profesionalismo.',
    avatar: 'RS',
  },
  {
    name: 'Ana Martínez',
    role: 'Farmacéutica Autorizada (Granada)',
    text: 'Validar recetas con Oasis redujo a cero los errores humanos en el despacho. El paciente se siente seguro y a nosotros nos da una tranquilidad operativa absoluta.',
    avatar: 'AM',
  },
  {
    name: 'Carlos Ortiz',
    role: 'Tutor de Adultos Mayores',
    text: 'Vincular la cuenta de mis padres me permite gestionar sus medicamentos crónicos desde mi trabajo. El delivery satelital GPS es espectacular, sé exactamente cuándo llega la medicina.',
    avatar: 'CO',
  },
];

const benefits = [
  '100% digital — Di adiós al papel y las pérdidas',
  'Citas médicas coordinadas en 30 segundos',
  'Firma digital médica con validez nacional',
  'Códigos QR encriptados e inviolables',
  'Rastreo GPS satelital de entregas en vivo',
  'Historial médico y familiar unificado',
];

function OasisLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'scale-90',
    md: 'scale-100',
    lg: 'scale-125',
    xl: 'scale-150 sm:scale-175',
  };
  return (
    <div className={`relative group ${sizes[size]} transition-all duration-500 flex items-center justify-center`}>
      {/* Floating neon aura behind the logo */}
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-teal-500/30 via-cyan-500/30 to-sky-500/30 opacity-0 blur-2xl group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
      
      <AnimatedLogo priority={size === 'xl'} showLabel={false} />
    </div>
  );
}

function getCardBackBullets(title: string): string[] {
  switch (title) {
    case 'Citas Médicas al Instante':
      return [
        'Conexión segura 24/7 con doctores',
        'Generación de receta al instante',
        'Videollamadas cifradas de extremo a extremo'
      ];
    case 'Recetas Criptográficas':
      return [
        'Firmas criptográficas únicas HMAC',
        'QR escaneable en cualquier farmacia',
        'Total respaldo y validez legal MINSA'
      ];
    case 'Inventario de Farmacias':
      return [
        'Stock y precios en vivo',
        'Búsqueda inteligente por cercanía',
        'Cotizaciones instantáneas sin llamadas'
      ];
    case 'Envío Seguro a Domicilio':
      return [
        'Repartidores certificados por Oasis',
        'Geolocalización satelital en mapa',
        'Entrega inmediata en Managua y León'
      ];
    case 'Datos Clínicos Protegidos':
      return [
        'Cifrado militar AES-256',
        'Cumplimiento de estándares HIPAA',
        'Acceso exclusivo bajo consentimiento'
      ];
    case 'Núcleo Familiar Vinculado':
      return [
        'Suma a dependientes en un clic',
        'Emparejamiento seguro por PIN de 6 dígitos',
        'Gestión coordinada de recetas'
      ];
    default:
      return ['Alta disponibilidad', 'Soporte prioritario', 'Seguridad garantizada'];
  }
}

/* ============ MAIN COMPONENT ============ */

export function OasisLandingPage() {
  const { navigate } = useAuthStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingLog, setLoadingLog] = useState('Iniciando Oasis...');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto rotate testimonials
  useEffect(() => {
    if (showSplash) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showSplash]);

  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowSplash(false);
          }, 800); // Elegant delay for reveal transition
          return 100;
        }

        const step = Math.floor(Math.random() * 12) + 4;
        const next = Math.min(100, prev + step);

        // Update logs based on progress threshold
        if (next < 25) {
          setLoadingLog('Cargando módulos de salud cuántica...');
        } else if (next < 50) {
          setLoadingLog('Verificando criptografía de recetas HMAC...');
        } else if (next < 75) {
          setLoadingLog('Conectando GPS satelital en vivo...');
        } else if (next < 95) {
          setLoadingLog('Desplegando interfaces líquidas 2026...');
        } else {
          setLoadingLog('¡Listo! Iniciando Oasis Aura...');
        }

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [showSplash]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 130]), { stiffness: 120, damping: 25 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Transform page scroll progress for header blur styling
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 50], ['rgba(250, 250, 250, 0)', 'rgba(250, 250, 250, 0.7)']);
  const navDarkBg = useTransform(scrollY, [0, 50], ['rgba(5, 5, 5, 0)', 'rgba(5, 5, 5, 0.7)']);
  const navShadow = useTransform(scrollY, [0, 50], ['none', '0 10px 30px -10px rgba(0, 194, 160, 0.08)']);

  return (
    <>
      <LoadingScreen isVisible={showSplash} />

      <div ref={containerRef} className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#030606] text-slate-800 dark:text-slate-100 overflow-x-hidden relative transition-colors duration-300">
      
      {/* 2026 Satelital Blueprint HUD Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-15 dark:opacity-[0.06] pointer-events-none z-0" />
      <div className="absolute top-[12%] inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/15 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-[25%] inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent pointer-events-none z-0" />
      
      {/* 2026 Liquid Glass Blob Shaders */}
      <div className="liquid-blob top-[5%] right-[-10%] size-[600px] z-0" />
      <div className="liquid-blob bottom-[10%] left-[-15%] size-[500px] z-0" style={{ animationDelay: '-4s' }} />
      <div className="liquid-blob top-[40%] left-[30%] size-[400px] z-0" style={{ animationDelay: '-8s' }} />

      {/* ============ SCROLL PROGRESS BAR ============ */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-[#5FF3B8] to-sky-500 z-[999] origin-left"
        style={{ scaleX: useSpring(scrollYProgress, { stiffness: 200, damping: 30 }) }}
      />

      {/* ============ STICKY PREMIUM HEADER ============ */}
      <motion.nav
        style={{
          boxShadow: navShadow,
        }}
        className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 pt-4 transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between border border-slate-200/50 dark:border-white/5 backdrop-blur-md bg-white/40 dark:bg-white/[0.02]">
            {/* Brand Logo & Kinetic Title - scaled responsibly on mobile */}
            <div className="scale-90 sm:scale-100 origin-left">
              <AnimatedLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            </div>

            {/* Actions Panel */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle className="scale-90 sm:scale-100" />
              <div className="hidden sm:block h-6 w-px bg-slate-300/40 dark:bg-white/10 mx-1" />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('entrar')}
                className="hidden sm:block text-sm font-semibold text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Ingresar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('registro')}
                className="clay-btn rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Comenzar
                <ArrowRight className="size-3 sm:size-3.5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ============ HERO SECTION ============ */}
      <section ref={heroRef} className="relative z-10 pt-36 sm:pt-44 pb-20 px-4 lg:px-8">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Left Column: Text & Actions */}
          <div className="lg:col-span-7 text-left flex flex-col items-start">
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-8 glass border border-teal-500/20"
            >
              <Sparkles className="size-4 text-[#00C2A0] animate-pulse" />
              <span className="text-xs font-black tracking-widest uppercase text-teal-600 dark:text-teal-400">
                Ecosistema de Salud Digital 2026
              </span>
            </motion.div>

            {/* Kinetic variable typography header */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1] text-slate-800 dark:text-white">
              La salud en Nicaragua,{' '}
              <span className="bg-gradient-to-r from-teal-500 via-[#00E5C0] to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,194,160,0.15)] animate-pulse">
                diseñada para tu calma
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-xl font-light leading-relaxed text-left"
            >
              Consigue tus recetas digitales en 30 segundos, conéctate con médicos colegiados y rastrea tus medicamentos en vivo con GPS satelital. Sin filas, sin pérdidas de recetas y con la tranquilidad absoluta que tu familia merece en Nicaragua.
            </motion.p>

            {/* Interactive CTAs with Von Restorff effect & Emotional hooks */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-3 w-full sm:w-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('registro')}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 via-[#00C2A0] to-emerald-500 text-white shadow-xl shadow-teal-500/25 rounded-2xl px-8 py-4.5 text-base uppercase font-extrabold tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-teal-400/20"
              >
                Cuidar de mi salud gratis
                <ArrowRight className="size-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('entrar')}
                className="w-full sm:w-auto bg-white/40 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-2xl px-8 py-4.5 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="size-4 text-[#00C2A0] fill-current" />
                Ingresar al portal
              </motion.button>
            </motion.div>

            {/* Persuasive trust-anchoring microcopy */}
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold mb-7 flex items-center gap-1.5 justify-start">
              <Shield className="size-3.5 text-teal-500 shrink-0" />
              Tus datos clínicos están encriptados y protegidos por ley. Registro 100% gratuito.
            </p>

            {/* Scrolling pill badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-2.5"
            >
              {benefits.slice(0, 3).map((benefit) => (
                <span
                  key={benefit}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/5 rounded-xl px-3 py-1.5 shadow-sm"
                >
                  <CheckCircle2 className="size-3.5 text-[#00C2A0]" />
                  {benefit}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Premium Interactive HUD Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ShowcaseDashboard />
          </div>
        </motion.div>
      </section>

      {/* ============ TRUST & CREDIBILITY BAR ============ */}
      <section className="relative z-10 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-4 border border-teal-500/10 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md flex flex-wrap items-center justify-center gap-6 sm:gap-12 shadow-sm">
            <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Respaldo y Seguridad:</span>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-teal-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">Acreditación Legal MINSA</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">Cumplimiento HIPAA Privacidad</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-sky-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">Firma Criptográfica HMAC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENTO STATS SECTION ============ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="clay-card rounded-3xl p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="text-center group"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="scale-110">{stat.icon}</span>
                    <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                      <CounterAnimation value={stat.value} suffix={stat.suffix} />
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA SECTION ============ */}
      <section className="relative z-10 py-20 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full clay-card px-4 py-2 mb-4">
            <Compass className="size-4 text-teal-500" />
            <span className="text-xs font-black tracking-widest uppercase text-teal-600 dark:text-teal-400">
              Guía del Usuario
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Tu salud en{' '}
            <span className="bg-gradient-to-r from-teal-500 via-[#00E5C0] to-cyan-500 bg-clip-text text-transparent">
              tres simples pasos
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Diseñamos un flujo intuitivo para que accedas a telemedicina y medicamentos sin demoras.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for large screens */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-teal-500/30 via-emerald-500/30 to-cyan-500/30 -translate-y-1/2 pointer-events-none" />

          {[
            { step: '01', title: 'Regístrate en Segundos', desc: 'Elige tu cuenta de paciente, farmacia, clínica o repartidor de forma gratuita.', icon: <Users className="size-5 text-teal-600 dark:text-teal-400" /> },
            { step: '02', title: 'Consulta & Receta QR', desc: 'Conéctate con tu doctor, obtén tu receta HMAC certificada y recibe tu código QR.', icon: <FileText className="size-5 text-emerald-600 dark:text-emerald-400" /> },
            { step: '03', title: 'Rastreo Activo o Retiro', desc: 'Sigue la entrega con geolocalización satelital en vivo o retira en la sede.', icon: <Truck className="size-5 text-cyan-600 dark:text-cyan-400" /> },
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12 }}
              className="clay-card rounded-[2.5rem] p-8 flex flex-col justify-between items-center text-center relative z-10 group hover:scale-[1.03] transition-all duration-300"
            >
              <div className="size-16 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 flex items-center justify-center shadow-lg group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
                <span className="group-hover:hidden">{item.icon}</span>
                <span className="hidden group-hover:block font-black text-lg text-white">{item.step}</span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white group-hover:text-teal-500 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ Bento Asymmetric Grid ============ */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full clay-card px-4 py-2 mb-4">
              <Activity className="size-4 text-[#00C2A0]" />
              <span className="text-xs font-black tracking-widest uppercase text-teal-600 dark:text-teal-400">
                Servicios del Ecosistema
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Un flujo digital que{' '}
              <span className="kinetic-pulse">
                elimina fricciones
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Diseñado con Bento boxes inteligentes que se expanden al interactuar.
            </p>
          </motion.div>

          {/* Asymmetric Broken bento box */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const isFlipped = !!flippedCards[i];
              return (
                <div 
                  key={feature.title} 
                  onClick={() => toggleCard(i)}
                  className={cn(
                    "cursor-pointer group relative h-[320px] sm:h-[300px] w-full [perspective:1000px] select-none",
                    feature.span
                  )}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 [transform-style:preserve-3d]"
                  >
                    {/* FRONT SIDE */}
                    <div 
                      className={cn(
                        "absolute inset-0 w-full h-full clay-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden bg-white/40 dark:bg-white/[0.02] backdrop-blur-md transition-all duration-300 ease-in-out",
                        isFlipped ? "opacity-0 pointer-events-none z-0 scale-95" : "opacity-100 z-10 scale-100"
                      )}
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none', feature.gradient)} />
                      <div className="relative z-10 space-y-4">
                        <div className={cn('size-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-md', feature.bg, feature.color)}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-extrabold group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                          {feature.desc}
                        </p>
                      </div>
                      <div className="relative z-10 flex items-center gap-1 text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                        <span>Tocar para ver detalles</span>
                        <ChevronRight className="size-3.5" />
                      </div>
                    </div>

                    {/* BACK SIDE */}
                    <div 
                      className={cn(
                        "absolute inset-0 w-full h-full clay-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-zinc-950/95 border border-teal-500/20 shadow-[0_0_24px_rgba(20,184,166,0.1)] transition-all duration-300 ease-in-out",
                        isFlipped ? "opacity-100 z-10 scale-100" : "opacity-0 pointer-events-none z-0 scale-95"
                      )}
                      style={{ 
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden' 
                      }}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('size-8 rounded-xl flex items-center justify-center', feature.bg, feature.color)}>
                            {feature.icon}
                          </div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{feature.title}</h4>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-zinc-800/80" />
                        <ul className="space-y-2.5 text-left">
                          {getCardBackBullets(feature.title).map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                              <CheckCircle2 className="size-4 text-teal-500 flex-shrink-0" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                        <span>Tocar para volver</span>
                        <ChevronRight className="size-3.5 rotate-180" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS CAROUSEL SECTION ============ */}
      <section className="relative z-10 py-20 px-4 bg-slate-100/40 dark:bg-white/[0.01] border-y border-slate-200/50 dark:border-white/5 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black">
              Experiencias de{' '}
              <span className="kinetic-pulse">
                nuestra comunidad
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">Escucha la voz de quienes confían su bienestar familiar en Oasis.</p>
          </motion.div>

          {/* Carousel container with slide transitions */}
          <div className="relative flex flex-col items-center">
            <div className="w-full relative min-h-[260px] sm:min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="clay-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 mb-5 justify-center sm:justify-start">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="size-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed italic font-light text-center sm:text-left">
                      &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/40 dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="size-11 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                        {testimonials[activeTestimonial].avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{testimonials[activeTestimonial].name}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">{testimonials[activeTestimonial].role}</p>
                      </div>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                        className="size-8 rounded-full border border-slate-200/50 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        aria-label="Anterior testimonio"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                        className="size-8 rounded-full border border-slate-200/50 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        aria-label="Siguiente testimonio"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Indicator dots */}
            <div className="flex gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                    activeTestimonial === idx 
                      ? "w-6 bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" 
                      : "w-1.5 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400"
                  )}
                  aria-label={`Ir al testimonio ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ACCORDION SECTION ============ */}
      <FaqSection />

      {/* ============ DETAILED BENEFITS SECTION ============ */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="clay-card rounded-[2.5rem] p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] border-2 border-white/20">
                <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <OasisLogo size="xl" />
                
                {/* Floatings badge tags */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-6 right-6 clay-card rounded-2xl px-4 py-2.5 flex items-center gap-2"
                >
                  <Shield className="size-4 text-emerald-500" />
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">MINSA Verificado</span>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-6 left-6 clay-card rounded-2xl px-4 py-2.5 flex items-center gap-2"
                >
                  <Droplets className="size-4 text-[#00C2A0] animate-bounce" />
                  <span className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-wide">100% Sin Papel</span>
                </motion.div>
              </div>
            </motion.div>

            {/* List */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                La transformación de la salud en{' '}
                <span className="kinetic-pulse">Nicaragua</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                Cada detalle interactivo ha sido refinado para minimizar la carga cognitiva del personal médico y el paciente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 clay-card rounded-2xl px-5 py-4 hover:bg-teal-500/5 transition-colors"
                  >
                    <div className="size-9 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="size-4 text-[#00C2A0]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ============ FINAL CTA SECTION ============ */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="clay-card rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 size-64 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-64 bg-gradient-to-tr from-sky-500/10 to-transparent rounded-full pointer-events-none" />

            <div className="flex justify-center mb-8">
              <OasisLogo size="lg" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black mb-4 relative z-10 text-slate-800 dark:text-white leading-tight">
              Toma el control de tu salud familiar hoy
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto relative z-10 font-light text-sm sm:text-base">
              Únete gratis a la red de salud digital más segura, rápida y humanizada de Nicaragua. Tu bienestar está a un solo toque de distancia.
            </p>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('registro')}
                className="clay-btn rounded-2xl px-12 py-5 text-lg uppercase tracking-wider font-black shadow-2xl shadow-teal-500/20"
              >
                Empezar a cuidar de mi familia
                <ArrowRight className="size-5.5" />
              </motion.button>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1.5 justify-center mt-2">
                <CheckCircle2 className="size-3.5 text-teal-500" />
                Registro 100% gratuito • Sin permanencia • Cumplimiento MINSA
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 mt-auto border-t border-slate-200/50 dark:border-white/5 px-4 py-10 bg-white/20 dark:bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <AnimatedLogo className="scale-90" />
            </div>

            <div className="flex items-center gap-6">
              <ThemeToggle className="scale-95" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                © {new Date().getFullYear()} OASIS AURA. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

/* ============ FAQ ACCORDION COMPONENT ============ */
function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Cómo funciona la vinculación del núcleo familiar?',
      a: 'Desde tu panel de paciente, ingresa a "Familiares" y escribe el código de 6 dígitos que se genera en la cuenta de tu dependiente. Una vez vinculado, podrás solicitar entregas de recetas para ellos y monitorear su estado de salud.',
    },
    {
      q: '¿Tienen validez legal las recetas electrónicas?',
      a: 'Sí. Las recetas electrónicas generadas en Oasis Nicaragua están provistas de una firma digital criptográfica única HMAC y un código QR único que puede ser verificado de forma segura por cualquier farmacia o sede autorizada.',
    },
    {
      q: '¿Cómo rastreo la entrega de mis medicamentos?',
      a: 'Una vez que la farmacia despacha tu pedido, se te asignará un repartidor. Podrás acceder al mapa en tiempo real que utiliza geolocalización por GPS satelital y ver exactamente por dónde viene tu medicina en el mapa interactivo.',
    },
    {
      q: '¿Tiene algún costo para los pacientes?',
      a: 'Registrarse y agendar citas médicas a través de Oasis es completamente gratuito. Únicamente pagarás por las consultas médicas específicas y los medicamentos adquiridos.',
    },
  ];

  return (
    <section className="relative z-10 py-20 px-4 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 rounded-full clay-card px-4 py-2 mb-4">
          <HelpCircle className="size-4 text-[#00C2A0]" />
          <span className="text-xs font-black tracking-widest uppercase text-teal-600 dark:text-teal-400">
            Preguntas Frecuentes
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black mb-4">
          Resolvemos tus{' '}
          <span className="bg-gradient-to-r from-teal-500 via-[#00E5C0] to-cyan-500 bg-clip-text text-transparent">
            dudas frecuentes
          </span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
          Descubre respuestas directas sobre el uso del ecosistema Oasis de salud.
        </p>
      </motion.div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="clay-card rounded-[1.5rem] overflow-hidden border border-slate-200/50 dark:border-zinc-800/30 transition-all duration-300 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{faq.q}</span>
                <span className={cn(
                  "size-6 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 flex items-center justify-center font-bold text-xs text-slate-500 dark:text-zinc-400 transition-transform duration-300",
                  isOpen && "rotate-45 text-teal-500 border-teal-500/30 bg-teal-500/5"
                )}>
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-light border-t border-slate-100 dark:border-zinc-900/60 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
