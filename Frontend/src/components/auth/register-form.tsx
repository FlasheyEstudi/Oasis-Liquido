'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Droplets, Loader2, Check, X, Shield, Truck, Compass, Award, Building, Phone, MapPin, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { APP_NAME } from '@/utils/constants';
import { post, get, getErrorMessage } from '@/api/client';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import type { Variants } from 'framer-motion';

import { AnimatedLogo } from '@/components/ui/animated-logo';
import { cn } from '@/lib/utils';
import type { AuthResponse } from '@/types';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5 },
  }),
};

interface ClinicOrPharmacyListItem {
  id: string;
  name: string;
  address: string;
}

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

const roleAdvantages: Record<string, Array<{ title: string; desc: string; icon: any }>> = {
  patient: [
    { title: 'Teleconsulta Inmediata', desc: 'Conéctate con médicos colegiados autorizados al instante.', icon: <Award className="size-4 text-teal-600 dark:text-teal-400" /> },
    { title: 'Entrega en Minutos', desc: 'Repartidores geolocalizados llevan tus medicinas seguras.', icon: <Truck className="size-4 text-emerald-600 dark:text-emerald-400" /> },
    { title: 'Gestión Familiar', desc: 'Asocia dependientes fácilmente con tu código privado.', icon: <Compass className="size-4 text-cyan-600 dark:text-cyan-400" /> },
    { title: 'Seguridad Militar', desc: 'Tus datos clínicos encriptados de extremo a extremo.', icon: <Shield className="size-4 text-indigo-600 dark:text-indigo-400" /> },
  ],
  pharmacy_admin: [
    { title: 'Aumento de Ventas', desc: 'Llega a miles de pacientes que buscan medicamentos en tu zona.', icon: <Building className="size-4 text-teal-600 dark:text-teal-400" /> },
    { title: 'Control de Inventario', desc: 'Sincronización en tiempo real de stock y ventas automáticas.', icon: <Award className="size-4 text-emerald-600 dark:text-emerald-400" /> },
    { title: 'Dispensación QR', desc: 'Escanea y despacha recetas digitalmente sin errores de papel.', icon: <Check className="size-4 text-cyan-600 dark:text-cyan-400" /> },
    { title: 'Firma HMAC Segura', desc: 'Validación instantánea de autenticidad en cada transacción.', icon: <Shield className="size-4 text-indigo-600 dark:text-indigo-400" /> },
  ],
  pharmacy_manager: [
    { title: 'Aumento de Ventas', desc: 'Llega a miles de pacientes que buscan medicamentos en tu zona.', icon: <Building className="size-4 text-teal-600 dark:text-teal-400" /> },
    { title: 'Control de Inventario', desc: 'Sincronización en tiempo real de stock y ventas automáticas.', icon: <Award className="size-4 text-emerald-600 dark:text-emerald-400" /> },
    { title: 'Dispensación QR', desc: 'Escanea y despacha recetas digitalmente sin errores de papel.', icon: <Check className="size-4 text-cyan-600 dark:text-cyan-400" /> },
    { title: 'Firma HMAC Segura', desc: 'Validación instantánea de autenticidad en cada transacción.', icon: <Shield className="size-4 text-indigo-600 dark:text-indigo-400" /> },
  ],
  clinic_admin: [
    { title: 'Gestión de Médicos', desc: 'Administra turnos, horarios y especialidades médicas con facilidad.', icon: <Building className="size-4 text-teal-600 dark:text-teal-400" /> },
    { title: 'Firma Digital Colegiada', desc: 'Recetas seguras firmadas por médicos con clave PIN de seguridad.', icon: <Award className="size-4 text-emerald-600 dark:text-emerald-400" /> },
    { title: 'Historiales Clínicos Unidos', desc: 'Acceso inmediato a la historia clínica compartida del paciente.', icon: <Compass className="size-4 text-cyan-600 dark:text-cyan-400" /> },
    { title: 'Menos Carga Administrativa', desc: 'Reportes e integraciones automáticas listas para el MINSA.', icon: <Shield className="size-4 text-indigo-600 dark:text-indigo-400" /> },
  ],
  delivery_driver: [
    { title: 'Entregas Inteligentes', desc: 'Ruta óptima por geolocalización satelital por GPS en vivo.', icon: <Truck className="size-4 text-teal-600 dark:text-teal-400" /> },
    { title: 'Ingresos por Comisión', desc: 'Gana más dinero completando entregas de forma eficiente.', icon: <Award className="size-4 text-emerald-600 dark:text-emerald-400" /> },
    { title: 'Horarios a tu Medida', desc: 'Trabaja con flexibilidad total y gestiona tus propios viajes.', icon: <Compass className="size-4 text-cyan-600 dark:text-cyan-400" /> },
    { title: 'Soporte Directo', desc: 'Asistencia y comunicación directa con la farmacia y paciente.', icon: <Shield className="size-4 text-indigo-600 dark:text-indigo-400" /> },
  ]
};

export function RegisterForm() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Prefill from landing page quick capture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefill = localStorage.getItem('oasis_prefill_auth');
      if (prefill) {
        setEmail(prefill);
        localStorage.removeItem('oasis_prefill_auth');
      }
    }
  }, []);

  // Desktop Mouse Perspective Tilt states
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Scale rotation to max 5 degrees for larger double-panels
    const rotateX = -(y / (rect.height / 2)) * 5;
    const rotateY = (x / (rect.width / 2)) * 5;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Geolocation States
  const [entityLat, setEntityLat] = useState<number | null>(null);
  const [entityLng, setEntityLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEntityLat(position.coords.latitude);
        setEntityLng(position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        let errorMsg = 'No se pudo obtener la ubicación. Por favor concede permisos de GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso denegado. Activa el GPS de tu dispositivo o navegador y recarga.';
        }
        setLocationError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Trigger geolocation pro-actively on Step 2 entrance
  useEffect(() => {
    if (step === 2 && (role === 'pharmacy_admin' || role === 'clinic_admin') && !entityLat) {
      requestLocation();
    }
  }, [step, role]);

  // Dynamic Fields States
  const [pharmacyId, setPharmacyId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [vehicleType, setVehicleType] = useState('motocicleta');
  const [licensePlate, setLicensePlate] = useState('');
  const [entityName, setEntityName] = useState('');
  const [entityAddress, setEntityAddress] = useState('');
  const [entityPhone, setEntityPhone] = useState('');

  // Dropdown lists
  const [pharmacies, setPharmacies] = useState<ClinicOrPharmacyListItem[]>([]);
  const [clinics, setClinics] = useState<ClinicOrPharmacyListItem[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const { navigate, login, setNotification } = useAuthStore();



  function handleNextStep() {
    setApiError(null);
    if (step === 1) {
      if (!name.trim()) {
        setApiError('Por favor ingresa tu nombre completo.');
        return;
      }
      if (name.trim().split(' ').length < 2) {
        setApiError('Por favor ingresa tu nombre y apellido.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setApiError('Por favor ingresa un correo electrónico válido.');
        return;
      }
      if (role === 'patient') {
        setStep(3); // Skip step 2 for patients
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      if (role === 'pharmacy_admin' || role === 'clinic_admin') {
        if (!entityName.trim()) {
          setApiError('Por favor ingresa el nombre de la entidad.');
          return;
        }
        if (!entityAddress.trim()) {
          setApiError('Por favor ingresa la dirección.');
          return;
        }
        if (!entityLat || !entityLng) {
          setApiError('Es obligatorio obtener la geolocalización GPS real de tu entidad en Oasis para trazar rutas de reparto. Por favor concede permisos de ubicación.');
          return;
        }
      }
      if (role === 'pharmacy_manager' && !pharmacyId) {
        setApiError('Por favor selecciona una farmacia.');
        return;
      }
      setStep(3);
    }
  }

  function handlePrevStep() {
    setApiError(null);
    if (step === 3) {
      if (role === 'patient') {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(1);
    }
  }

  // Load pharmacies and clinics lists dynamically based on role
  useEffect(() => {
    async function fetchLists() {
      if (role === 'pharmacy_manager') {
        if (pharmacies.length > 0) return;
        setIsLoadingLists(true);
        try {
          const res = await get<ClinicOrPharmacyListItem[]>('/pharmacies/list');
          if (res.success && Array.isArray(res.data)) {
            setPharmacies(res.data);
            if (res.data.length > 0) setPharmacyId(res.data[0].id);
          }
        } catch (err) {
          console.error('Error fetching pharmacies:', err);
        } finally {
          setIsLoadingLists(false);
        }
      } else if (role === 'clinic_admin') {
        if (clinics.length > 0) return;
        setIsLoadingLists(true);
        try {
          const res = await get<ClinicOrPharmacyListItem[]>('/clinics/list');
          if (res.success && Array.isArray(res.data)) {
            setClinics(res.data);
            if (res.data.length > 0) setClinicId(res.data[0].id);
          }
        } catch (err) {
          console.error('Error fetching clinics:', err);
        } finally {
          setIsLoadingLists(false);
        }
      }
    }

    fetchLists();
  }, [role, pharmacies.length, clinics.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setApiError('Por favor completa todos los campos obligatorios.');
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

    // Role specific form validations
    if (role === 'pharmacy_admin' && (!entityName.trim() || !entityAddress.trim())) {
      setApiError('Por favor ingresa el nombre y la dirección de tu farmacia.');
      return;
    }

    if (role === 'pharmacy_manager' && !pharmacyId) {
      setApiError('Por favor selecciona una farmacia.');
      return;
    }

    if (role === 'clinic_admin' && (!entityName.trim() || !entityAddress.trim())) {
      setApiError('Por favor ingresa el nombre y la dirección de tu clínica.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        name,
        email,
        password,
        role,
      };

      // Inject dynamic fields
      if (role === 'pharmacy_admin') {
        payload.entityName = entityName;
        payload.entityAddress = entityAddress;
        payload.entityPhone = entityPhone || undefined;
        payload.entityLatitude = entityLat || undefined;
        payload.entityLongitude = entityLng || undefined;
      } else if (role === 'pharmacy_manager') {
        payload.pharmacyId = pharmacyId;
      } else if (role === 'clinic_admin') {
        payload.entityName = entityName;
        payload.entityAddress = entityAddress;
        payload.entityPhone = entityPhone || undefined;
        payload.entityLatitude = entityLat || undefined;
        payload.entityLongitude = entityLng || undefined;
      } else if (role === 'delivery_driver') {
        payload.vehicleType = vehicleType;
        payload.licensePlate = licensePlate;
      }

      console.log('[REGISTER-FRONTEND] Enviando registro:', payload);

      const response = await post<AuthResponse['data']>('/auth/register', payload);

      if (response.success && response.data) {
        login(response.data.user, response.data.access_token);
        setNotification({ type: 'success', message: '¡Cuenta creada con éxito!' });
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
    <div className="relative flex h-screen max-h-screen overflow-hidden items-center justify-center px-4 py-0 bg-gradient-to-tr from-slate-50 via-zinc-100 to-teal-50/20 dark:from-[#030606] dark:via-[#010203] dark:to-[#020507] transition-colors duration-500">
      <OrganicBlobs />

      {/* Futuristic Floating Lights */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

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
                Únete a Oasis Nicaragua hoy. Obtén tu historial clínico inmediato, firma digital y entregas farmacéuticas directas.
              </p>

              {/* Dynamic Bullet Advantages list based on role */}
              <div className="relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    {(roleAdvantages[role] || roleAdvantages.patient).map((item, idx) => (
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
                  </motion.div>
                </AnimatePresence>
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

          {/* Right Panel: The Register Form */}
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
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">Crea tu cuenta</h1>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Tu oasis de salud te espera</p>
              </motion.div>

              {/* API Error */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-3.5 py-2.5 text-[11px] text-red-700 dark:text-red-400 mb-4 font-medium"
                >
                  {apiError}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) {
                  handleNextStep();
                } else {
                  handleSubmit(e);
                }
              }} className="space-y-4">
                
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-600 dark:text-teal-400">Paso 1: Información Personal</span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">{role === 'patient' ? '1 / 2' : '1 / 3'}</span>
                      </div>

                      {/* Name */}
                      <div>
                        <label htmlFor="register-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Nombre completo
                        </label>
                        <div className="relative group/input">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-teal-500 transition-colors" />
                          <input
                            id="register-name"
                            type="text"
                            placeholder="Juan Pérez"
                            autoComplete="name"
                            disabled={isSubmitting}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 dark:focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-teal-500/10 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="register-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Correo electrónico
                        </label>
                        <div className="relative group/input">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-teal-500 transition-colors" />
                          <input
                            id="register-email"
                            type="email"
                            placeholder="tu@correo.com"
                            autoComplete="email"
                            disabled={isSubmitting}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 dark:focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-teal-500/10 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div>
                        <label htmlFor="register-role" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Tipo de cuenta (Rol)
                        </label>
                        <div className="relative group/input">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-teal-500 transition-colors pointer-events-none" />
                          <select
                            id="register-role"
                            disabled={isSubmitting}
                            value={role}
                            onChange={(e) => {
                              setRole(e.target.value);
                              setApiError(null);
                            }}
                            className="w-full h-11 pl-11 pr-10 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:border-teal-500/50 dark:focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-teal-500/10 focus:outline-none transition-all duration-300 disabled:opacity-50 appearance-none bg-transparent"
                          >
                            <option value="patient" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Paciente</option>
                            <option value="clinic_admin" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Administrador de Clínica</option>
                            <option value="pharmacy_admin" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Administrador de Farmacia</option>
                            <option value="pharmacy_manager" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Gestor de Farmacia</option>
                            <option value="delivery_driver" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Repartidor / Delivery</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && role !== 'patient' && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-600 dark:text-teal-400">Paso 2: Detalles de Entidad</span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">2 / 3</span>
                      </div>

                      {/* Pharmacy Creation */}
                      {role === 'pharmacy_admin' && (
                        <div className="space-y-3.5">
                          <div>
                            <label htmlFor="register-pharmacy-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                              Nombre de la Farmacia
                            </label>
                            <div className="relative">
                              <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                              <input
                                id="register-pharmacy-name"
                                type="text"
                                disabled={isSubmitting}
                                value={entityName}
                                onChange={(e) => setEntityName(e.target.value)}
                                placeholder="Ej. Farmacia Oasis Central"
                                className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="register-pharmacy-address" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                              Dirección completa
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                              <input
                                id="register-pharmacy-address"
                                type="text"
                                disabled={isSubmitting}
                                value={entityAddress}
                                onChange={(e) => setEntityAddress(e.target.value)}
                                placeholder="Ej. Del Parque Central 2 c. al norte, Masaya"
                                className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* GPS Location Widget */}
                          <div className="bg-slate-950/20 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-zinc-800/30 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                📍 Georreferenciación Satelital (Obligatorio)
                              </label>
                              {entityLat && entityLng ? (
                                <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                  GPS Activo
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                  Requerido
                                </span>
                              )}
                            </div>

                            {isLocating ? (
                              <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 bg-white/5 rounded-xl p-3 border border-white/5">
                                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                                <span>Determinando coordenadas exactas de tu dispositivo...</span>
                              </div>
                            ) : entityLat && entityLng ? (
                              <div className="flex items-center justify-between gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Ubicación real capturada con éxito</p>
                                  <div className="flex gap-4 font-mono text-[10px] text-slate-500 dark:text-gray-400">
                                    <span>Lat: <strong className="text-slate-900 dark:text-foreground">{entityLat.toFixed(6)}</strong></span>
                                    <span>Lng: <strong className="text-slate-900 dark:text-foreground">{entityLng.toFixed(6)}</strong></span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={requestLocation}
                                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                                >
                                  Recapturar
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {locationError && (
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl p-2 font-medium">
                                    ⚠️ {locationError}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  onClick={requestLocation}
                                  className="w-full h-10 rounded-xl text-xs font-bold bg-teal-600/10 border border-teal-500/20 hover:bg-teal-600/20 text-teal-600 dark:text-teal-400 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                >
                                  📍 Obtener Ubicación GPS del Dispositivo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pharmacy Linkage */}
                      {role === 'pharmacy_manager' && (
                        <div>
                          <label htmlFor="register-pharmacy" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                            Seleccionar Farmacia
                          </label>
                          <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                            {isLoadingLists ? (
                              <div className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                                <span>Cargando farmacias...</span>
                              </div>
                            ) : (
                              <>
                                <select
                                  id="register-pharmacy"
                                  disabled={isSubmitting}
                                  value={pharmacyId}
                                  onChange={(e) => setPharmacyId(e.target.value)}
                                  className="w-full h-11 pl-11 pr-10 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:border-teal-500/50 focus:outline-none disabled:opacity-50 appearance-none bg-transparent"
                                >
                                  {pharmacies.length === 0 ? (
                                    <option value="">No hay farmacias activas</option>
                                  ) : (
                                    pharmacies.map((pharmacy) => (
                                      <option key={pharmacy.id} value={pharmacy.id} className="bg-slate-800 text-white">
                                        {pharmacy.name} ({pharmacy.address})
                                      </option>
                                    ))
                                  )}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Clinic Creation */}
                      {role === 'clinic_admin' && (
                        <div className="space-y-3.5">
                          <div>
                            <label htmlFor="register-clinic-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                              Nombre de la Clínica
                            </label>
                            <div className="relative">
                              <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                              <input
                                id="register-clinic-name"
                                type="text"
                                disabled={isSubmitting}
                                value={entityName}
                                onChange={(e) => setEntityName(e.target.value)}
                                placeholder="Ej. Clínica San Rafael"
                                className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="register-clinic-address" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                              Dirección completa
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                              <input
                                id="register-clinic-address"
                                type="text"
                                disabled={isSubmitting}
                                value={entityAddress}
                                onChange={(e) => setEntityAddress(e.target.value)}
                                placeholder="Ej. Frente a Iglesia El Calvario, León"
                                className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* GPS Location Widget */}
                          <div className="bg-slate-950/20 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-zinc-800/30 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                📍 Georreferenciación Satelital (Obligatorio)
                              </label>
                              {entityLat && entityLng ? (
                                <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                  GPS Activo
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                  Requerido
                                </span>
                              )}
                            </div>

                            {isLocating ? (
                              <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 bg-white/5 rounded-xl p-3 border border-white/5">
                                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                                <span>Determinando coordenadas exactas de tu dispositivo...</span>
                              </div>
                            ) : entityLat && entityLng ? (
                              <div className="flex items-center justify-between gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Ubicación real capturada con éxito</p>
                                  <div className="flex gap-4 font-mono text-[10px] text-slate-500 dark:text-gray-400">
                                    <span>Lat: <strong className="text-slate-900 dark:text-foreground">{entityLat.toFixed(6)}</strong></span>
                                    <span>Lng: <strong className="text-slate-900 dark:text-foreground">{entityLng.toFixed(6)}</strong></span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={requestLocation}
                                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                                >
                                  Recapturar
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {locationError && (
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl p-2 font-medium">
                                    ⚠️ {locationError}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  onClick={requestLocation}
                                  className="w-full h-10 rounded-xl text-xs font-bold bg-teal-600/10 border border-teal-500/20 hover:bg-teal-600/20 text-teal-600 dark:text-teal-400 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                >
                                  📍 Obtener Ubicación GPS del Dispositivo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Delivery Driver */}
                      {role === 'delivery_driver' && (
                        <div className="space-y-3.5">
                          <div>
                            <label htmlFor="register-vehicle" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                              Tipo de Vehículo
                            </label>
                            <div className="relative">
                              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                              <select
                                id="register-vehicle"
                                disabled={isSubmitting}
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                className="w-full h-11 pl-11 pr-10 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:border-teal-500/50 focus:outline-none disabled:opacity-50 appearance-none bg-transparent"
                              >
                                <option value="motocicleta" className="bg-slate-800 text-white">Motocicleta</option>
                                <option value="bicicleta" className="bg-slate-800 text-white">Bicicleta / E-bike</option>
                                <option value="automovil" className="bg-slate-800 text-white">Automóvil</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label htmlFor="register-plate" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                              Placa de Vehículo
                            </label>
                            <div className="relative">
                              <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                              <input
                                id="register-plate"
                                type="text"
                                disabled={isSubmitting}
                                value={licensePlate}
                                onChange={(e) => setLicensePlate(e.target.value)}
                                placeholder="Ej. M-123456"
                                className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-600 dark:text-teal-400">Paso {role === 'patient' ? '2: Credenciales' : '3: Credenciales'}</span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">{role === 'patient' ? '2 / 2' : '3 / 3'}</span>
                      </div>

                      {/* Password */}
                      <div>
                        <label htmlFor="register-password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                          <input
                            id="register-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 pl-11 pr-11 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordRequirements password={password} />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label htmlFor="register-confirm" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Confirmar contraseña
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                          <input
                            id="register-confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-11 pl-11 pr-11 rounded-xl text-sm bg-white/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Action buttons - Claymorphic Reconstructed */}
                <div className="flex items-center gap-3 pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="w-1/3 h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border bg-slate-100/50 dark:bg-zinc-800/30 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 border-slate-200/50 dark:border-zinc-800/30 text-slate-700 dark:text-zinc-300 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" />
                      Atrás
                    </button>
                  )}
                  
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className={cn(
                        "clay-btn-primary h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 relative transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer",
                        step > 1 ? "w-2/3" : "w-full"
                      )}
                    >
                      Siguiente
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "clay-btn-primary h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 relative transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
                        step > 1 ? "w-2/3" : "w-full"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          Crear cuenta
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Login link */}
              <motion.div custom={6} variants={fadeInUp} className="mt-4 text-center">
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('entrar')}
                    disabled={isSubmitting}
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors disabled:opacity-50"
                  >
                    Iniciar sesión
                  </button>
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
