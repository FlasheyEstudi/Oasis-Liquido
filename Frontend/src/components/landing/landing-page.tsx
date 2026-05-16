'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CalendarDays,
  Pill,
  MapPin,
  Truck,
  Shield,
  Users,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

// --- Animated Counter ---
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}

// --- Floating Particles ---
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-emerald-200/30"
          style={{
            width: Math.random() * 60 + 20,
            height: Math.random() * 60 + 20,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// --- Feature Card ---
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm group">
        <CardContent className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Testimonial Card ---
function TestimonialCard({ name, role, text, delay }: { name: string; role: string; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed italic">&ldquo;{text}&rdquo;</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
              {name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Step Card ---
function StepCard({ step, icon: Icon, title, description, delay }: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="flex gap-4 items-start"
    >
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
        {step < 3 && <div className="w-0.5 h-8 bg-emerald-200 mt-2" />}
      </div>
      <div className="pb-6">
        <div className="text-xs font-semibold text-emerald-600 mb-1">Paso {step}</div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Landing Page
// ============================================
export function LandingPage() {
  const navigate = useAuthStore((s) => s.navigate);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: CalendarDays,
      title: 'Citas Médicas',
      description: 'Agenda consultas presenciales y virtuales con médicos de distintas especialidades de forma rápida y sencilla.',
    },
    {
      icon: Pill,
      title: 'Farmacia a Domicilio',
      description: 'Solicita tus medicamentos con receta electrónica y recíbelos en la puerta de tu casa con seguimiento en tiempo real.',
    },
    {
      icon: MapPin,
      title: 'Farmacias Cercanas',
      description: 'Encuentra la farmacia más cercana con disponibilidad de tus medicamentos usando nuestro mapa interactivo.',
    },
    {
      icon: Stethoscope,
      title: 'Recetas Electrónicas',
      description: 'Recibe recetas digitales con código QR que puedes presentar en cualquier farmacia de la red.',
    },
    {
      icon: Truck,
      title: 'Entrega Rastreada',
      description: 'Sigue tu pedido en el mapa en tiempo real, desde la farmacia hasta la puerta de tu hogar.',
    },
    {
      icon: Shield,
      title: 'Datos Seguros',
      description: 'Tu información médica está protegida con los más altos estándares de seguridad y privacidad.',
    },
  ];

  const testimonials = [
    {
      name: 'María González',
      role: 'Paciente',
      text: 'Poder agendar mis citas y recibir mis medicamentos en casa ha cambiado mi vida. Ya no tengo que hacer filas en la farmacia.',
    },
    {
      name: 'Dr. Roberto Sánchez',
      role: 'Médico General',
      text: 'Las recetas electrónicas con QR facilitan muchísimo el trabajo. Mis pacientes pueden surtir sus medicamentos sin problemas.',
    },
    {
      name: 'Ana Martínez',
      role: 'Farmacéutica',
      text: 'El sistema de inventario y surtido de recetas es muy eficiente. Podemos atender más pacientes con menos errores.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      {/* Navbar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                OASIS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-sm text-gray-700 hover:text-emerald-600"
                onClick={() => navigate('login')}
              >
                Iniciar Sesión
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-200"
                onClick={() => navigate('register')}
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        <FloatingParticles />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6"
              >
                <CheckCircle2 className="h-4 w-4" />
                Plataforma de salud integral
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                Tu salud,{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  conectada
                </span>{' '}
                como nunca
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                Gestiona citas médicas, recetas electrónicas y entregas de farmacia desde un solo lugar.
                Una red clínica y farmacéutica pensada para ti.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 h-12 px-8 text-base"
                  onClick={() => navigate('register')}
                >
                  Comenzar ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => navigate('login')}
                >
                  Ya tengo cuenta
                </Button>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12 grid grid-cols-3 gap-8"
              >
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                    <AnimatedCounter end={50} suffix="+" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Médicos</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                    <AnimatedCounter end={30} suffix="+" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Farmacias</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                    <AnimatedCounter end={10} suffix="K+" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pacientes</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Illustration / Card Stack */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">Próxima cita</p>
                          <p className="text-xs text-gray-500">Dra. Carmen Ortiz</p>
                        </div>
                        <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          Confirmada
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Fecha</span>
                          <span className="font-medium text-gray-900">15 Jun 2026</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Hora</span>
                          <span className="font-medium text-gray-900">09:00 AM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Clínica</span>
                          <span className="font-medium text-gray-900">OASIS Centro</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Floating prescription card */}
                <motion.div
                  className="absolute -right-4 -top-4 z-10"
                  animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm w-56">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-semibold text-gray-900">Receta #R-001</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Losartán 50mg</p>
                        <p>Omeprazol 20mg</p>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-600">Activa</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Floating delivery card */}
                <motion.div
                  className="absolute -left-4 -bottom-4 z-10"
                  animate={{ y: [0, -6, 0], rotate: [0, -1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm w-52">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-semibold text-gray-900">Entrega en camino</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          initial={{ width: '40%' }}
                          animate={{ width: ['40%', '75%', '40%'] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5">Llegada aprox. 15 min</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              ¿Cómo{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                funciona
              </span>
              ?
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              En tres simples pasos, accede a toda la red de salud desde tu dispositivo
            </p>
          </motion.div>

          <div className="max-w-xl mx-auto">
            <StepCard
              step={1}
              icon={Users}
              title="Crea tu cuenta"
              description="Regístrate como paciente, médico o farmacéutico y accede a la plataforma."
              delay={0.1}
            />
            <StepCard
              step={2}
              icon={CalendarDays}
              title="Agenda y consulta"
              description="Busca médicos, agenda citas y gestiona tus consultas de forma fácil."
              delay={0.2}
            />
            <StepCard
              step={3}
              icon={Truck}
              title="Recibe en casa"
              description="Solicita tus medicamentos con receta electrónica y recíbelos en tu puerta."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-emerald-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Todo lo que{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                necesitas
              </span>
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Una plataforma completa para gestionar tu salud y la de tus seres queridos
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Lo que dicen nuestros{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                usuarios
              </span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard
                key={t.name}
                name={t.name}
                role={t.role}
                text={t.text}
                delay={i * 0.15}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
        <FloatingParticles />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Comienza a cuidar tu salud hoy
            </h2>
            <p className="mt-4 text-lg text-emerald-100 max-w-2xl mx-auto">
              Únete a miles de personas que ya confían en OASIS para gestionar su salud de forma moderna y segura.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 h-12 px-8 text-base font-semibold shadow-lg"
                onClick={() => navigate('register')}
              >
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('login')}
              >
                Iniciar sesión
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-4 gap-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">OASIS</span>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                Plataforma integral de gestión de red clínica y farmacéutica. Conectando pacientes, médicos y farmacias para una salud más accesible.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li>Citas médicas</li>
                <li>Recetas electrónicas</li>
                <li>Farmacia a domicilio</li>
                <li>Mapa de farmacias</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Términos de uso</li>
                <li>Política de privacidad</li>
                <li>Aviso de cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs">
            © {new Date().getFullYear()} OASIS. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
