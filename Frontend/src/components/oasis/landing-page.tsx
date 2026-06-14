'use client';

import { useAuthStore } from '@/store/auth-store';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
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
  CheckCircle2,
  HelpCircle,
  Users,
  Compass,
  QrCode,
  MapPin,
  Search,
  Check,
  CheckCircle,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { LoadingScreen } from '@/components/oasis/loading-screen';
import { CounterAnimation } from '@/components/landing/counter-animation';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

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
        'Total respaldo y garantía de seguridad OASIS'
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
  const [registerInput, setRegisterInput] = useState('');
  const [tiltCard, setTiltCard] = useState<Record<number, { x: number; y: number }>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingLog, setLoadingLog] = useState('Iniciando Oasis...');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor' | 'pharmacy' | 'delivery'>('patient');

  // Mascot Companion states
  const [showCompanionBubble, setShowCompanionBubble] = useState(true);
  const [companionMessage, setCompanionMessage] = useState(
    '¡Hola! Soy Oasis, tu compañero virtual de salud. Estoy aquí para guiarte por la plataforma. ¡Haz clic en las opciones de abajo para simular diferentes herramientas!'
  );
  
  // Doctor Signature Simulation
  const [docPin, setDocPin] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Pharmacy simulation
  const [searchDrug, setSearchDrug] = useState('');
  const [pharmacyStock] = useState([
    { name: 'Amoxicilina 500mg', stock: 18, price: 'C$ 85.00', status: 'Disponible' },
    { name: 'Paracetamol 500mg', stock: 120, price: 'C$ 12.00', status: 'Alto Stock' },
    { name: 'Ibuprofeno 400mg', stock: 0, price: 'C$ 34.00', status: 'Agotado' },
    { name: 'Losartán 50mg', stock: 45, price: 'C$ 95.00', status: 'Disponible' },
  ]);

  // Delivery simulation
  const [deliveryProgress, setDeliveryProgress] = useState(0);

  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect dark mode
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    if (typeof window === 'undefined') return;
    
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMoveGlobal);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      observer.disconnect();
    };
  }, []);

  // Companion Options configuration
  const defaultCompanionOptions: {
    label: string;
    msg: string;
    role: string | null;
    scroll: string | null;
  }[] = [
    {
      label: '🔑 Simular Criptografía (Doctor)',
      msg: '¡He configurado el simulador en la vista de Médico! Desplázate hacia arriba, ingresa un PIN de 4 dígitos (ej: 1234) en el recuadro del simulador y presiona "Firmar" para ver la firma HMAC-SHA256 en acción.',
      role: 'doctor',
      scroll: 'inicio'
    },
    {
      label: '📍 Rastrear Delivery GPS',
      msg: '¡Simulando el mapa GPS satelital! He seleccionado la pestaña "Delivery" en nuestro simulador interactivo para que veas la geolocalización en tiempo real.',
      role: 'delivery',
      scroll: 'inicio'
    },
    {
      label: '💊 Consultar Inventario Médico',
      msg: '¡Modo Farmacia activo! Escribe el nombre de un medicamento en la barra de búsqueda del simulador (como "Paracetamol") para verificar existencias al instante.',
      role: 'pharmacy',
      scroll: 'inicio'
    },
    {
      label: '👨‍👩‍👧 Proteger mi Familia',
      msg: '¡Vista de Paciente configurada! Observa el Pasaporte Digital único y el PIN de 6 dígitos que permite vincular dependientes de forma segura.',
      role: 'patient',
      scroll: 'inicio'
    },
    {
      label: '✨ ¿Qué es el Sello Oasis?',
      msg: 'El Sello de Confianza Oasis garantiza recetas electrónicas 100% legales mediante criptografía avanzada, telemedicina inmediata y resguardo estricto bajo normas HIPAA.',
      role: null,
      scroll: 'sello-oasis'
    }
  ];

  const [companionOptions, setCompanionOptions] = useState(defaultCompanionOptions);

  const handleCompanionOptionClick = (opt: typeof defaultCompanionOptions[0]) => {
    if (opt.role) {
      setActiveRole(opt.role as any);
    }
    setCompanionMessage(opt.msg);
    
    if (opt.scroll) {
      scrollToSection(opt.scroll);
    }
    
    // Switch companion options to a "volver a opciones principales" helper
    setCompanionOptions([
      {
        label: '🔙 Volver a opciones',
        msg: '¿Qué otra función interactiva te gustaría explorar hoy? Elige una de las opciones de mi lista.',
        role: null,
        scroll: null
      },
      ...defaultCompanionOptions.filter(o => o.label !== opt.label).slice(0, 3)
    ]);
  };

  const resetCompanion = () => {
    setShowCompanionBubble(true);
    setCompanionMessage(
      '¡Hola! Soy Oasis, tu compañero virtual de salud. Estoy aquí para guiarte por la plataforma. ¡Haz clic en las opciones de abajo para simular diferentes herramientas!'
    );
    setCompanionOptions(defaultCompanionOptions);
  };

  // Listen to scroll to update companion messages contextually
  useEffect(() => {
    const handleScrollContext = () => {
      const scrollPos = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollPos / docHeight;

      if (progress > 0.8) {
        setCompanionMessage('¿Tienes alguna duda sobre Oasis? Revisa las Preguntas Frecuentes aquí mismo, o regístrate hoy gratis.');
      } else if (progress > 0.5) {
        setCompanionMessage('¡Estos son nuestros testimonios reales! Médicos, farmacéuticos y pacientes de León y Managua ya usan Oasis.');
      } else if (progress > 0.3) {
        setCompanionMessage('Aquí puedes explorar el Ecosistema Bento. Toca cualquier tarjeta para revelar sus especificaciones técnicas.');
      }
    };

    window.addEventListener('scroll', handleScrollContext);
    return () => window.removeEventListener('scroll', handleScrollContext);
  }, []);

  // Auto animate GPS progress
  useEffect(() => {
    if (activeRole !== 'delivery') return;
    const interval = setInterval(() => {
      setDeliveryProgress((prev) => (prev >= 100 ? 0 : prev + 5));
    }, 600);
    return () => clearInterval(interval);
  }, [activeRole]);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotateX = -(y / (rect.height / 2)) * 6;
    const rotateY = (x / (rect.width / 2)) * 6;
    
    setTiltCard(prev => ({
      ...prev,
      [idx]: { x: rotateX, y: rotateY }
    }));
  };

  const handleCardMouseLeave = (idx: number) => {
    setTiltCard(prev => ({
      ...prev,
      [idx]: { x: 0, y: 0 }
    }));
  };

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Pre-loader timeline
  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowSplash(false);
          }, 800);
          return 100;
        }

        const step = Math.floor(Math.random() * 12) + 4;
        const next = Math.min(100, prev + step);

        if (next < 25) {
          setLoadingLog('Cargando módulos de salud cuántica...');
        } else if (next < 50) {
          setLoadingLog('Verificando criptografía de recetas HMAC...');
        } else if (next < 75) {
          setLoadingLog('Conectando GPS satelital en vivo...');
        } else if (next < 95) {
          setLoadingLog('Desplegando interfaces líquidas 2026...');
        } else {
          setLoadingLog('¡Listo! Iniciando Oasis...');
        }

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [showSplash]);

  // SCROLL-DRIVEN PARALLAX
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 100]), { stiffness: 120, damping: 25 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 50], 
    isDark 
      ? ['rgba(3, 6, 6, 0)', 'rgba(3, 6, 6, 0.85)'] 
      : ['rgba(250, 250, 250, 0)', 'rgba(250, 250, 250, 0.7)']
  );
  const navShadow = useTransform(scrollY, [0, 50], ['none', '0 10px 30px -10px rgba(0, 194, 160, 0.08)']);

  const scrollToSection = (id: string) => {
    if (id === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleStartPrefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerInput.trim()) return;
    localStorage.setItem('oasis_prefill_auth', registerInput.trim());
    navigate('registro');
  };

  const handleDoctorSign = () => {
    if (docPin.length !== 4) return;
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setIsSigned(true);
      setCompanionMessage('¡Excelente! Has simulado la emisión de una receta. Observa cómo el algoritmo generó una firma digital inviolable.');
    }, 1500);
  };

  const resetDoctorSign = () => {
    setDocPin('');
    setIsSigned(false);
  };

  return (
    <>
      <LoadingScreen isVisible={showSplash} />

      <div ref={containerRef} className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#030606] text-slate-800 dark:text-slate-100 overflow-x-hidden relative transition-colors duration-300">
      
        {/* Satelital Blueprint HUD Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-15 dark:opacity-[0.06] pointer-events-none z-0" />
        <div className="absolute top-[12%] inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/15 to-transparent pointer-events-none z-0" />
        <div className="absolute bottom-[25%] inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent pointer-events-none z-0" />
        
        {/* Liquid Glass Blob Shaders */}
        <div className="liquid-blob top-[5%] right-[-10%] size-[600px] z-0" />
        <div className="liquid-blob bottom-[10%] left-[-15%] size-[500px] z-0" style={{ animationDelay: '-4s' }} />
        <div className="liquid-blob top-[40%] left-[30%] size-[400px] z-0" style={{ animationDelay: '-8s' }} />

        {/* Interactive Cursor Shimmer Blob */}
        <motion.div
          className="fixed size-[450px] rounded-full bg-teal-400/5 dark:bg-teal-500/[0.03] blur-[120px] pointer-events-none z-0 hidden lg:block"
          animate={{
            x: mousePos.x - 225,
            y: mousePos.y - 225,
          }}
          transition={{ type: 'spring', damping: 45, stiffness: 220 }}
        />

        {/* ============ SCROLL PROGRESS BAR ============ */}
        <motion.div 
          className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-[#5FF3B8] to-sky-500 z-[999] origin-left"
          style={{ scaleX: scrollYProgress }}
        />

        {/* ============ STICKY PREMIUM HEADER ============ */}
        <motion.header
          style={{
            backgroundColor: !mounted
              ? 'transparent'
              : (typeof window !== 'undefined' && window.innerWidth < 768
                  ? (isDark ? 'rgba(3, 6, 6, 0.9)' : 'rgba(250, 250, 250, 0.8)')
                  : navBg),
            boxShadow: !mounted ? 'none' : navShadow,
          }}
          className="sticky top-0 z-[100] w-full backdrop-blur-md transition-all duration-300 border-b border-slate-200/20 dark:border-white/5"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('inicio')}>
              <AnimatedLogo className="scale-90" showLabel={true} />
            </div>

            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <span onClick={() => scrollToSection('inicio')} className="hover:text-teal-500 transition-colors cursor-pointer">Inicio</span>
              <span onClick={() => scrollToSection('ecosistema')} className="hover:text-teal-500 transition-colors cursor-pointer">Ecosistema</span>
              <span onClick={() => scrollToSection('sello-oasis')} className="hover:text-teal-500 transition-colors cursor-pointer font-extrabold text-teal-600 dark:text-teal-400">Sello Oasis</span>
              <span onClick={() => scrollToSection('testimonios')} className="hover:text-teal-500 transition-colors cursor-pointer">Testimonios</span>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <ThemeToggle className="scale-90" />
              
              <button
                onClick={() => navigate('entrar')}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 hover:text-teal-500 transition-colors cursor-pointer"
              >
                Entrar
              </button>
              
              <button
                onClick={() => navigate('registro')}
                className="hidden sm:inline-flex px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-teal-500/10 active:scale-95 transition-all cursor-pointer border border-teal-400/20 shrink-0 whitespace-nowrap"
              >
                Registrarse
              </button>
            </div>
          </div>
        </motion.header>

        {/* ============ HERO SECTION ============ */}
        <section id="inicio" ref={heroRef} className="relative z-10 py-16 lg:py-24 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[85vh]">
          
          {/* Left column: Persuasive text block */}
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="flex-1 space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-teal-500/10 border border-teal-500/20 shadow-inner">
              <Sparkles className="size-4 text-teal-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">
                Rediseño Ultra-Moderno 2026
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-slate-800 dark:text-white">
              Salud digital en{' '}
              <span className="bg-gradient-to-r from-teal-500 via-[#00E5C0] to-cyan-500 bg-clip-text text-transparent block sm:inline">
                Nicaragua
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-500 dark:text-zinc-400 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
              Conectamos pacientes, médicos, farmacias y repartidores en un ecosistema fluido, dinámico y 100% libre de papel. Seguridad criptográfica y geolocalización satelital activa.
            </p>

            {/* Prefill Input box */}
            <form onSubmit={handleStartPrefill} className="flex flex-col sm:flex-row items-stretch gap-2.5 max-w-md mx-auto lg:mx-0 p-1.5 rounded-2xl bg-white/70 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-800/60 backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.04)]">
              <div className="flex-grow flex items-center px-3 gap-2">
                <Sparkles className="size-4.5 text-teal-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Ingresa tu correo o celular..."
                  value={registerInput}
                  onChange={(e) => setRegisterInput(e.target.value)}
                  className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none py-2"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer transition-all border border-teal-400/10"
              >
                Empezar Gratis
                <ArrowRight className="size-4" />
              </button>
            </form>

            {/* Trust bullet badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-2 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-teal-500" />
                Firma HMAC Criptográfica
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-teal-500" />
                GPS Satelital Activo
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-teal-500" />
                Asistente Virtual Oasis
              </span>
            </div>
          </motion.div>

          {/* Right column: Interactive Ecosistema Simulator Command Center */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full max-w-[500px]"
          >
            <div className="clay-card rounded-[2.5rem] p-6 relative overflow-hidden border-2 border-white/20 dark:border-white/5 shadow-2xl flex flex-col gap-6 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-2xl">
              
              {/* Interactive role selector tabs */}
              <div className="flex items-center justify-between p-1 rounded-2xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/40 dark:border-zinc-800/40 relative z-10">
                {[
                  { id: 'patient', label: 'Paciente', icon: <Users className="size-3.5" /> },
                  { id: 'doctor', label: 'Médico', icon: <Stethoscope className="size-3.5" /> },
                  { id: 'pharmacy', label: 'Farmacia', icon: <Pill className="size-3.5" /> },
                  { id: 'delivery', label: 'Delivery', icon: <Truck className="size-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveRole(tab.id as any);
                      // Update mascot context on switch
                      if (tab.id === 'doctor') {
                        setCompanionMessage('Has seleccionado la simulación de Médico. Escribe un PIN de 4 dígitos abajo en el formulario para emitir una receta con firma digital.');
                      } else if (tab.id === 'delivery') {
                        setCompanionMessage('Vista de Delivery. Observa cómo el repartidor avanza en el mapa GPS satelital en tiempo real camino al domicilio.');
                      } else if (tab.id === 'pharmacy') {
                        setCompanionMessage('Vista de Inventario. Puedes filtrar por nombre de fármaco (ej. Amoxicilina o Paracetamol) para comprobar stock.');
                      } else {
                        setCompanionMessage('Vista de Paciente. Aquí se muestra tu Pasaporte Digital QR y el PIN de vinculación familiar para tus dependientes.');
                      }
                    }}
                    className={cn(
                      "flex-grow flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 relative cursor-pointer",
                      activeRole === tab.id
                        ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/40 dark:border-zinc-700/30"
                        : "text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300"
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Display active portal frame */}
              <div className="relative min-h-[290px] flex flex-col justify-between z-10">
                <AnimatePresence mode="wait">
                  
                  {/* Paciente Simulator */}
                  {activeRole === 'patient' && (
                    <motion.div
                      key="patient_sim"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="flex flex-col gap-4 flex-grow justify-between"
                    >
                      <div className="rounded-2xl p-4 bg-white/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/40 shadow-sm flex items-center gap-4 relative overflow-hidden">
                        <div className="relative size-16 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center p-2 text-white shadow-lg flex-shrink-0">
                          <QrCode className="size-8 text-white animate-pulse" />
                        </div>
                        <div className="flex-grow space-y-1">
                          <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                            PASAPORTE DIGITAL
                          </span>
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">María González Castro</h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                            ID: #PA-12845-NI • Verificado
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/30 dark:border-zinc-800/30 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500 dark:text-zinc-400">Vincular Dependiente (PIN):</span>
                          <span className="font-mono font-black text-teal-500">492 841</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-zinc-800/40" />
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal font-light">
                          Vincule a sus hijos o familiares para gestionar sus recetas y entregas en un único panel clínico consolidado.
                        </p>
                      </div>

                      <button 
                        onClick={() => navigate('registro')}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white font-black text-xs uppercase tracking-wider border border-slate-200/50 dark:border-zinc-700/50 hover:bg-teal-500 hover:text-white cursor-pointer transition-colors"
                      >
                        Registrarme como Paciente
                      </button>
                    </motion.div>
                  )}

                  {/* Médico Simulator */}
                  {activeRole === 'doctor' && (
                    <motion.div
                      key="doctor_sim"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="flex flex-col gap-4 flex-grow justify-between"
                    >
                      <div className="rounded-2xl p-4 bg-white/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/40 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="size-4.5 text-teal-500" />
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Emitir Receta HMAC</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400">
                            <p className="font-extrabold uppercase text-[8px] tracking-wider">Medicamento</p>
                            <p className="font-black text-slate-800 dark:text-white mt-0.5">Amoxicilina 500mg</p>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400">
                            <p className="font-extrabold uppercase text-[8px] tracking-wider">Frecuencia</p>
                            <p className="font-black text-slate-800 dark:text-white mt-0.5">Cada 8 horas</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {isSigned ? (
                          <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3 text-emerald-600 dark:text-emerald-400"
                          >
                            <Shield className="size-5 text-emerald-500 flex-shrink-0" />
                            <div className="flex-grow">
                              <p className="text-[10px] font-black uppercase tracking-wide">Receta Firmada Digitalmente</p>
                              <p className="text-[8px] font-mono opacity-80 mt-0.5">HMAC-SHA256: 9b1deb4d...a29f</p>
                            </div>
                            <button onClick={resetDoctorSign} className="text-[8px] uppercase tracking-widest font-black text-slate-400 hover:text-rose-500 cursor-pointer">
                              Reset
                            </button>
                          </motion.div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="Introduce PIN (4 dígitos)..."
                              maxLength={4}
                              value={docPin}
                              onChange={(e) => setDocPin(e.target.value.replace(/\D/g, ''))}
                              className="flex-grow p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-center font-bold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            />
                            <button
                              onClick={handleDoctorSign}
                              disabled={docPin.length !== 4 || isSigning}
                              className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                            >
                              {isSigning ? 'Cifrando...' : 'Firmar'}
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-[9px] text-slate-400 dark:text-zinc-500 text-center font-light leading-snug">
                        La firma de Oasis se genera mediante HMAC-SHA256 garantizando que la receta médica digital emitida es legal, única e inalterable.
                      </p>
                    </motion.div>
                  )}

                  {/* Farmacia Simulator */}
                  {activeRole === 'pharmacy' && (
                    <motion.div
                      key="pharmacy_sim"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="flex flex-col gap-3.5 flex-grow justify-between"
                    >
                      <div className="p-1 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 flex items-center gap-2">
                        <Search className="size-3.5 text-slate-400 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar medicamento (ej. Amoxicilina)..."
                          value={searchDrug}
                          onChange={(e) => setSearchDrug(e.target.value)}
                          className="bg-transparent border-none text-[10px] font-semibold text-slate-800 dark:text-white focus:outline-none py-2 flex-grow"
                        />
                      </div>

                      <div className="space-y-1.5">
                        {pharmacyStock
                          .filter(drug => drug.name.toLowerCase().includes(searchDrug.toLowerCase()))
                          .slice(0, 3)
                          .map((drug) => (
                            <div key={drug.name} className="flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-zinc-800/30 border border-slate-200/30 dark:border-zinc-800/30 text-[10px]">
                              <span className="font-extrabold text-slate-700 dark:text-zinc-300">{drug.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-400">{drug.price}</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full font-black text-[7px] uppercase",
                                  drug.stock > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                )}>
                                  {drug.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>

                      <button
                        onClick={() => navigate('registro')}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white font-black text-xs uppercase tracking-wider border border-slate-200/50 dark:border-zinc-700/50 hover:bg-teal-500 hover:text-white cursor-pointer transition-colors"
                      >
                        Registrar mi Farmacia
                      </button>
                    </motion.div>
                  )}

                  {/* Repartidor Simulator */}
                  {activeRole === 'delivery' && (
                    <motion.div
                      key="delivery_sim"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="flex flex-col gap-4 flex-grow justify-between"
                    >
                      <div className="rounded-2xl h-28 bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/40 relative overflow-hidden flex items-center justify-center shadow-sm">
                        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:12px_12px] opacity-15" />
                        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M 40,80 Q 140,20 220,90 T 360,30"
                            fill="none"
                            stroke="rgba(0,194,160,0.2)"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 40,80 Q 140,20 220,90 T 360,30"
                            fill="none"
                            stroke="#00C2A0"
                            strokeWidth="3"
                            strokeDasharray="8 6"
                            strokeLinecap="round"
                          />
                        </svg>

                        <motion.div
                          className="absolute size-6 bg-teal-500 rounded-full border border-white dark:border-zinc-900 shadow-md flex items-center justify-center z-10"
                          style={{
                            left: `${Math.min(92, Math.max(5, deliveryProgress))}%`,
                            top: `${48 + Math.sin(deliveryProgress / 10) * 15}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <Compass className="size-3 text-white rotate-45 animate-pulse" />
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40">
                          <p className="font-extrabold text-slate-400 dark:text-zinc-500 uppercase text-[8px]">Vehículo</p>
                          <p className="font-black mt-0.5">Moto - LE-2495</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40">
                          <p className="font-extrabold text-slate-400 dark:text-zinc-500 uppercase text-[8px]">Progreso</p>
                          <p className="font-mono font-black mt-0.5 text-teal-500">{deliveryProgress}%</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40">
                          <p className="font-extrabold text-slate-400 dark:text-zinc-500 uppercase text-[8px]">ETA</p>
                          <p className="font-black mt-0.5">4 min</p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('registro')}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white font-black text-xs uppercase tracking-wider border border-slate-200/50 dark:border-zinc-700/50 hover:bg-teal-500 hover:text-white cursor-pointer transition-colors"
                      >
                        Registrarme como Repartidor
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
              
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
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">Verificado por OASIS AURA</span>
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

        {/* ============ STATS SECTION ============ */}
        <section className="relative z-10 py-16 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black">
              El impacto de{' '}
              <span className="bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent">
                Oasis en Cifras
              </span>
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 font-light text-sm">Logros alcanzados por la comunidad de salud digital de Nicaragua.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Pacientes Cuidados', value: 12000, suffix: '+', icon: <Heart className="size-5 text-rose-500" />, desc: 'Salud asistida y protegida 24/7' },
              { label: 'Médicos Acreditados', value: 620, suffix: '+', icon: <Stethoscope className="size-5 text-teal-500" />, desc: 'Firma digital médica activa' },
              { label: 'Farmacias Afiliadas', value: 150, suffix: '+', icon: <Pill className="size-5 text-sky-500" />, desc: 'Catálogo de stock digitalizado' },
              { label: 'Entregas Concretadas', value: 99.8, suffix: '%', icon: <Truck className="size-5 text-amber-500" />, desc: 'Surtido inmediato a domicilio' },
            ].map((stat) => (
              <div key={stat.label} className="clay-card rounded-3xl p-6 flex flex-col items-center text-center hover:scale-[1.03] transition-all duration-300 bg-white/40 dark:bg-white/[0.02] border border-slate-200/30 dark:border-zinc-800/40">
                <div className="size-11 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/40 flex items-center justify-center shadow-md">
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-4 font-mono">
                  <CounterAnimation value={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="text-xs font-black text-slate-700 dark:text-zinc-300 mt-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-light leading-relaxed">{stat.desc}</p>
              </div>
            ))}
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
                Guía del Ecosistema
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
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-teal-500/30 via-emerald-500/30 to-cyan-500/30 -translate-y-1/2 pointer-events-none" />

            {[
              { step: '01', title: 'Regístrate Gratis', desc: 'Crea tu cuenta de paciente, médico, farmacia o repartidor de forma digital en segundos.', icon: <Users className="size-5 text-teal-600 dark:text-teal-400" /> },
              { step: '02', title: 'Receta Criptográfica', desc: 'Consulta con el médico, obtén tu receta firmada con HMAC y tu código QR de validación.', icon: <FileText className="size-5 text-emerald-600 dark:text-emerald-400" /> },
              { step: '03', title: 'Despacho y Rastreo', desc: 'Surte tus recetas, retira en sede o monitorea la entrega con geolocalización GPS satelital en vivo.', icon: <Truck className="size-5 text-cyan-600 dark:text-cyan-400" /> },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className="clay-card rounded-[2.5rem] p-8 flex flex-col justify-between items-center text-center relative z-10 group hover:scale-[1.03] transition-all duration-300 bg-white/40 dark:bg-white/[0.02] border border-slate-200/30 dark:border-zinc-800/40"
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

        {/* ============ BENTO FEATURE GRID ============ */}
        <section id="ecosistema" className="relative z-10 py-20 px-4">
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
                <span className="bg-gradient-to-r from-teal-500 to-[#00E5C0] bg-clip-text text-transparent">
                  elimina fricciones
                </span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
                Diseñado con Bento boxes inteligentes que se expanden al interactuar.
              </p>
            </motion.div>

            {/* Asymmetric bento box */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => {
                const isFlipped = !!flippedCards[i];
                return (
                  <div 
                    key={feature.title} 
                    onClick={() => toggleCard(i)}
                    onMouseMove={(e) => handleCardMouseMove(e, i)}
                    onMouseLeave={() => handleCardMouseLeave(i)}
                    className={cn(
                      "cursor-pointer group relative h-[320px] sm:h-[300px] w-full [perspective:1000px] select-none",
                      feature.span
                    )}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <motion.div
                      animate={{ 
                        rotateY: isFlipped ? 180 : (tiltCard[i]?.y || 0),
                        rotateX: isFlipped ? 0 : (tiltCard[i]?.x || 0),
                        scale: isFlipped ? 1.02 : 1,
                      }}
                      transition={{ 
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                      }}
                      className="absolute inset-0 [transform-style:preserve-3d] h-full w-full"
                    >
                      {/* FRONT SIDE */}
                      <div 
                        className={cn(
                          "absolute inset-0 w-full h-full clay-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden bg-white/40 dark:bg-white/[0.02] backdrop-blur-md transition-all duration-300 ease-in-out border border-slate-200/30 dark:border-zinc-800/40",
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

        {/* ============ TESTIMONIALS SECTION ============ */}
        <section id="testimonios" className="relative z-10 py-20 px-4 bg-slate-100/40 dark:bg-white/[0.01] border-y border-slate-200/50 dark:border-white/5 overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-black">
                Experiencias de{' '}
                <span className="bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent">
                  nuestra comunidad
                </span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">Escucha la voz de quienes confían su bienestar familiar en Oasis.</p>
            </motion.div>

            <div className="relative flex flex-col items-center">
              <div className="w-full relative min-h-[260px] sm:min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="clay-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between bg-white/50 dark:bg-zinc-900/10 border border-slate-200/30 dark:border-zinc-800/40 shadow-sm"
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

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                          className="size-8 rounded-full border border-slate-200/50 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer font-bold text-sm"
                          aria-label="Anterior testimonio"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                          className="size-8 rounded-full border border-slate-200/50 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer font-bold text-sm"
                          aria-label="Siguiente testimonio"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

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
        <section id="sello-oasis" className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Visual Frame */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="clay-card rounded-[2.5rem] p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] border-2 border-white/20 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-2xl">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <AnimatedLogo size="xl" showLabel={true} />
                  
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-6 right-6 clay-card rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                  >
                    <Shield className="size-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-wide">Verificado por OASIS</span>
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute bottom-6 left-6 clay-card rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-teal-500/20 bg-teal-500/5 text-teal-600 dark:text-teal-400"
                  >
                    <Droplets className="size-4 text-[#00C2A0] animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-wide">100% Sin Papel</span>
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
                  <span className="bg-gradient-to-r from-teal-500 to-[#00E5C0] bg-clip-text text-transparent">Nicaragua</span>
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
                      className="flex items-center gap-3 clay-card rounded-2xl px-5 py-4 hover:bg-teal-500/5 transition-colors border border-slate-200/30 dark:border-zinc-800/40 bg-white/40 dark:bg-white/[0.02]"
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
              className="clay-card rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden bg-white/40 dark:bg-zinc-950/20 border border-slate-200/30 dark:border-zinc-800/40 backdrop-blur-2xl"
            >
              <div className="absolute -top-24 -right-24 size-64 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 size-64 bg-gradient-to-tr from-sky-500/10 to-transparent rounded-full pointer-events-none" />

              <div className="flex justify-center mb-8">
                <AnimatedLogo size="lg" showLabel={true} />
              </div>

              <h2 className="text-3xl sm:text-5xl font-black mb-4 relative z-10 text-slate-800 dark:text-white leading-tight">
                Toma el control de tu salud familiar hoy
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto relative z-10 font-light text-sm sm:text-base">
                Únete gratis a la red de salud digital más segura, rápida y de mayor cobertura de Nicaragua. Tu bienestar está a un solo toque de distancia.
              </p>
              <div className="relative z-10 flex flex-col items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('registro')}
                  className="clay-btn rounded-2xl px-12 py-5 text-lg uppercase tracking-wider font-black shadow-2xl shadow-teal-500/20 cursor-pointer bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                >
                  Empezar a cuidar de mi familia
                  <ArrowRight className="size-5.5 ml-2 inline" />
                </motion.button>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1.5 justify-center mt-2">
                  <CheckCircle2 className="size-3.5 text-teal-500" />
                  Registro 100% gratuito • Sin permanencia • Verificación OASIS
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

        {/* ============ DYNAMIC INTERACTIVE COMPANION (MASCOT) ============ */}
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3 pointer-events-none select-none">
          <AnimatePresence>
            {showCompanionBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 24 }}
                className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 dark:bg-zinc-950/95 border-2 border-teal-500/20 dark:border-teal-500/20 backdrop-blur-xl p-4.5 shadow-[0_12px_40px_rgba(20,184,166,0.25)] space-y-3.5"
              >
                {/* Companion Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Oasis Asistente
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowCompanionBubble(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Companion Message Text */}
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
                  {companionMessage}
                </p>
                
                {/* Companion Interactive Option Buttons */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {companionOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleCompanionOptionClick(opt)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-teal-500/5 hover:bg-teal-500/10 dark:bg-teal-500/[0.03] dark:hover:bg-teal-500/10 border border-teal-500/10 hover:border-teal-500/30 text-[10px] font-black uppercase text-slate-700 dark:text-zinc-300 transition-all hover:translate-x-1 cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Mascot Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (showCompanionBubble) {
                setShowCompanionBubble(false);
              } else {
                resetCompanion();
              }
            }}
            className="pointer-events-auto relative group flex items-center justify-center size-14 sm:size-16 rounded-full bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-500 text-white shadow-[0_8px_30px_rgba(20,184,166,0.3)] hover:shadow-[0_8px_30px_rgba(20,184,166,0.5)] transition-all cursor-pointer border border-teal-300/30"
          >
            {/* Holographic Glowing Effects */}
            <div className="absolute -inset-1.5 rounded-full border border-teal-400/30 animate-ping pointer-events-none opacity-40" />
            <div className="absolute -inset-3.5 rounded-full border border-teal-400/15 animate-pulse pointer-events-none opacity-30" style={{ animationDuration: '3s' }} />
            
            {/* Interactive speech bubble trigger on hover */}
            <div className="absolute -top-1 -right-1 bg-teal-500 text-white rounded-full size-4.5 flex items-center justify-center border border-white dark:border-zinc-950 shadow-md font-bold text-[9px] animate-bounce">
              !
            </div>
            
            {/* Mascot Image */}
            <div className="relative size-10 sm:size-11 overflow-hidden rounded-full bg-teal-950/20 flex items-center justify-center">
              <Image
                src="/images/nuevo-logo-y-mascota/mascota.png"
                alt="Mascota Oasis"
                width={56}
                height={56}
                priority
                className="object-contain hover:scale-110 transition-transform duration-300"
              />
            </div>
          </motion.button>
        </div>

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
        <div className="inline-flex items-center gap-2 rounded-full clay-card px-4 py-2 mb-4 border border-teal-500/20 bg-teal-500/5">
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
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
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
