'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  usePrescriptions,
  useDeliveryOrders,
  useFamily,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { useMutation } from '@tanstack/react-query';
import { post } from '@/api/client';
import { toast } from 'sonner';
import { formatDate, formatCurrency, getInitials } from '@/utils/helpers';
import { APPOINTMENT_STATUS_CONFIG, PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode } from '@/components/common/qr-code';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import {
  Calendar,
  FileText,
  MapPin,
  Truck,
  Plus,
  Clock,
  Pill,
  QrCode as QrCodeIcon,
  ChevronRight,
  Activity,
  AlertCircle,
  Package,
  Sun,
  Moon,
  CloudSun,
  Shield,
  Sparkles,
  UserCheck,
  HeartPulse,
} from 'lucide-react';

function getGreeting(): { text: string; icon: React.ReactNode; bgClass: string } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      text: 'Buenos días',
      icon: <Sun className="size-5 text-amber-400 animate-spin-slow" />,
      bgClass: 'from-amber-500/10 via-teal-500/5 to-transparent'
    };
  }
  if (hour < 18) {
    return {
      text: 'Buenas tardes',
      icon: <CloudSun className="size-5 text-orange-400 animate-pulse" />,
      bgClass: 'from-orange-500/10 via-teal-500/5 to-transparent'
    };
  }
  return {
    text: 'Buenas noches',
    icon: <Moon className="size-5 text-indigo-400" />,
    bgClass: 'from-indigo-950/20 via-slate-900/5 to-transparent'
  };
}

export function PatientHome() {
  const [mounted, setMounted] = useState(false);
  const [sosTaps, setSosTaps] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const { user, representedUser, setRepresentedUser, isElderlyMode, toggleElderlyMode, navigate } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset SOS taps after 3 seconds of inactivity
  useEffect(() => {
    if (sosTaps > 0) {
      const timer = setTimeout(() => setSosTaps(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [sosTaps]);

  const activePatientId = representedUser?.id || user?.id;

  const appointmentsQuery = useAppointments({ limit: 5, patient_id: activePatientId });
  const prescriptionsQuery = usePrescriptions({ limit: 5, patient_id: activePatientId });
  const deliveriesQuery = useDeliveryOrders({ status: 'pending' });
  const familyQuery = useFamily(user?.role === 'patient');

  const emergencyMutation = useMutation({
    mutationFn: async (coords: { lat: number; lng: number }) => {
      const response = await post<{ message: string }>('/patient/emergency', coords);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Alerta médica de urgencia enviada correctamente.');
      setSosTaps(0);
    },
    onError: () => {
      toast.error('Error al transmitir la telemetría de emergencia.');
      setSosTaps(0);
    }
  });

  const appointments = appointmentsQuery.data?.data ?? [];
  const prescriptions = prescriptionsQuery.data?.data ?? [];
  const pendingDeliveries = deliveriesQuery.data?.data ?? [];
  const caregiverFor = familyQuery.data?.caregiverFor ?? [];

  const isLoading =
    appointmentsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    deliveriesQuery.isLoading ||
    familyQuery.isLoading;

  const hasError =
    appointmentsQuery.isError ||
    prescriptionsQuery.isError ||
    deliveriesQuery.isError;

  const firstName = representedUser?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Paciente';
  const greeting = getGreeting();

  const upcomingCount = useMemo(() => appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  ).length, [appointments]);

  const activePrescriptions = useMemo(() => prescriptions.filter(
    (p) => p.status === 'active' || p.status === 'partially_fulfilled'
  ).length, [prescriptions]);

  const nextAppointment = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())[0];
  }, [appointments]);

  const totalAppointments = appointments.length;

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <LoadingAnimation size="lg" />
        <p className="text-xs font-black text-teal-600/60 dark:text-teal-400/60 tracking-[0.2em] mt-6 animate-pulse uppercase">
          Sincronizando Expediente Oasis...
        </p>
      </div>
    );
  }

  if (hasError) {
    const errorMessages = [
      appointmentsQuery.isError ? getHookErrorMessage(appointmentsQuery.error) : null,
      prescriptionsQuery.isError ? getHookErrorMessage(prescriptionsQuery.error) : null,
      deliveriesQuery.isError ? getHookErrorMessage(deliveriesQuery.error) : null,
    ].filter(Boolean).join('. ');

    return (
      <GlassCard className="col-span-12">
        <div className="flex flex-col items-center py-10 text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md">
            <AlertCircle className="size-6 text-red-500" />
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 max-w-md">
            {errorMessages || 'No se pudieron recuperar los datos del servidor médico.'}
          </p>
          <Button
            className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6 shadow-md"
            onClick={() => {
              appointmentsQuery.refetch();
              prescriptionsQuery.refetch();
              deliveriesQuery.refetch();
            }}
          >
            Reintentar Sincronización
          </Button>
        </div>
      </GlassCard>
    );
  }

  const dateStr = formatDate(new Date().toISOString(), "EEEE d 'de' MMMM, yyyy");

  const triggerEmergency = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización de emergencia no está activa en tu dispositivo.');
      return;
    }

    toast.loading('Obteniendo coordenadas satelitales...', { id: 'emergency-alert' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        emergencyMutation.mutate({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }, {
          onSettled: () => toast.dismiss('emergency-alert')
        });
      },
      (error) => {
        toast.dismiss('emergency-alert');
        toast.error('Imposible obtener coordenadas de geolocalización.');
      }
    );
  };

  const handleSosClick = () => {
    if (sosTaps === 0) {
      setSosTaps(1);
      toast.warning('Presiona el botón SOS una vez más para confirmar la alerta médica.');
    } else {
      triggerEmergency();
    }
  };

  return (
    <div className={cn(
      "space-y-6 pb-24",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:py-3.5 [&_button]:text-sm [&_svg]:size-5.5"
    )}>
      
      {/* Top Console Bar (Elderly + Caregiver switches) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 rounded-3xl p-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Elderly Mode switch */}
          <button
            onClick={toggleElderlyMode}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-md",
              isElderlyMode
                ? "bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/15"
                : "bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:bg-white/10"
            )}
          >
            <Activity className="size-4 text-amber-500 animate-pulse" />
            <span>{isElderlyMode ? 'Modo Mayor Activo' : 'Modo Mayor'}</span>
          </button>

          {/* Caregiver Switcher */}
          {caregiverFor.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl px-3.5 py-1.5 text-xs shadow-md">
              <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[10px] tracking-wider">Paciente:</span>
              <select
                value={representedUser?.id || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setRepresentedUser(null);
                    toast.success("Mostrando tu historial personal");
                  } else {
                    const rel = caregiverFor.find(r => r.patient?.id === val);
                    if (rel && rel.patient) {
                      setRepresentedUser({
                        id: rel.patient.id,
                        name: rel.patient.name,
                        email: rel.patient.email,
                        phone: rel.patient.phone ?? undefined,
                        role: 'patient',
                        is_active: true,
                        created_at: rel.createdAt,
                        updated_at: rel.createdAt,
                      });
                      toast.success(`Acceso a cuenta: ${rel.patient.name}`);
                    }
                  }
                }}
                className="bg-transparent border-none text-slate-700 dark:text-zinc-200 font-black focus:outline-none cursor-pointer text-xs"
              >
                <option value="" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-white">Mi cuenta personal</option>
                {caregiverFor.map((rel) => rel.patient && (
                  <option key={rel.patient.id} value={rel.patient.id} className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-white">
                    {rel.patient.name} ({rel.relationship})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Servidor Clínico en Línea</span>
        </div>
      </div>

      {/* Bento Welcome Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Welcome Card with telemetry info */}
        <GlassCard className={cn(
          "md:col-span-8 overflow-hidden relative border border-slate-200 dark:border-white/5 bg-gradient-to-br shadow-2xl rounded-[2.5rem] p-5 sm:p-6",
          greeting.bgClass
        )}>
          <div className="flex flex-col sm:flex-row justify-between gap-6 relative z-10">
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center gap-2">
                {greeting.icon}
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-zinc-400">
                  {greeting.text}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                Hola, {firstName}
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">{dateStr}</p>
              
              <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                <Shield className="size-3" />
                <span>Expediente Seguro MINSA Acreditado</span>
              </div>

              {/* Senior attention alert */}
              {nextAppointment && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 mt-4">
                  <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">Cita programada para hoy</p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1 font-semibold leading-tight">
                      A las {formatDate(nextAppointment.date_time, 'HH:mm')} con {nextAppointment.doctor?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar + Digital QR Passport */}
            <div className="flex items-center justify-between sm:flex-col sm:justify-start gap-4 border-t sm:border-t-0 border-slate-200/50 dark:border-white/5 pt-4 sm:pt-0 shrink-0">
              <div className="flex items-center gap-3 sm:flex-col sm:text-center">
                <Avatar className="size-14 sm:size-18 border-2 border-white/20 shadow-xl ring-4 ring-teal-500/5">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-lg font-black">
                    {getInitials(representedUser?.name || user?.name || 'Paciente')}
                  </AvatarFallback>
                </Avatar>
                <div className="sm:space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Nivel de Cuenta</p>
                  <div className="flex items-center gap-1 sm:justify-center">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-black text-slate-700 dark:text-white">Paciente Certificado</span>
                  </div>
                </div>
              </div>

              {/* Holographic QR Passport Trigger */}
              <button
                onClick={() => setShowQrModal(true)}
                className="group relative flex items-center justify-center p-2 rounded-2xl bg-white/5 hover:bg-teal-500/10 border border-slate-200 dark:border-white/5 shadow-md transition-all duration-300 active:scale-95"
              >
                <QrCodeIcon className="size-6 text-slate-600 dark:text-teal-400 group-hover:scale-105" />
                <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-teal-500 border border-white dark:border-zinc-900 shadow-md">
                  <Shield className="size-2.5 text-white" />
                </span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Next Appointment widget */}
        <GlassCard className="md:col-span-4 border border-slate-200 dark:border-white/5 shadow-xl bg-slate-500/[0.01] dark:bg-zinc-950/20 rounded-[2.5rem] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-xl bg-teal-500/10">
                  <Calendar className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Próxima Consulta</h3>
              </div>
              {nextAppointment && <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />}
            </div>

            <div className="pt-4">
              {nextAppointment ? (
                <div className="space-y-3">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white truncate">
                    {nextAppointment.doctor?.name || 'Especialista Oasis'}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-550 dark:text-zinc-400 font-semibold">
                      <Clock className="size-3.5 text-teal-500" />
                      <span>{formatDate(nextAppointment.date_time, "dd MMM • HH:mm")}</span>
                    </div>
                    {nextAppointment.clinic && (
                      <div className="flex items-center gap-2 text-xs text-slate-550 dark:text-zinc-400 font-semibold">
                        <MapPin className="size-3.5 text-red-400" />
                        <span className="truncate">{nextAppointment.clinic.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border',
                      APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.bgColor,
                      APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.color
                    )}>
                      {APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.label || nextAppointment.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <Calendar className="size-8 text-slate-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-zinc-550 font-semibold">Sin consultas programadas</p>
                </div>
              )}
            </div>
          </div>

          {!nextAppointment && (
            <Button
              className="w-full rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs h-10 shadow-lg shadow-teal-500/10 mt-4 uppercase tracking-widest"
              onClick={() => navigate('nueva-cita')}
            >
              Agendar Consulta
            </Button>
          )}
        </GlassCard>

      </div>

      {/* Redesigned Quick Actions Console */}
      <GlassCard className="border border-slate-200 dark:border-white/5 bg-white/5 dark:bg-zinc-950/20 rounded-[2.25rem] p-4 shadow-xl">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500 block mb-3.5 pl-1.5">Consola de Control</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Agendar cita', icon: Plus, page: 'nueva-cita' as const, bg: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400 shadow-teal-500/5' },
            { label: 'Ver recetas', icon: FileText, page: 'recetas' as const, bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/5' },
            { label: 'Mapa Farmacias', icon: MapPin, page: 'mapa-farmacias' as const, bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-amber-500/5' },
            { label: 'Rastrear Delivery', icon: Truck, page: 'seguimiento' as const, bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5' },
          ].map((action) => (
            <motion.button
              key={action.page}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex flex-col items-center justify-center gap-2.5 rounded-2xl py-4 px-2 border shadow-md transition-all duration-300 h-24 text-center select-none',
                action.bg
              )}
              onClick={() => navigate(action.page)}
            >
              <action.icon className="size-5 shrink-0" />
              <span className="text-[11px] font-black tracking-wider uppercase">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Grid for Recipes and Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Recent Prescriptions (Clinical-grade Translucent Receipt list) */}
        <GlassCard className="md:col-span-6 border border-slate-200 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 rounded-[2.5rem] p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-slate-200 dark:border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-500/10">
                <Pill className="size-4 text-indigo-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Recetas Recientes</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-600 dark:text-teal-400 text-xs font-black p-0 h-auto hover:bg-transparent"
              onClick={() => navigate('recetas')}
            >
              Historial <ChevronRight className="size-3 ml-0.5 inline" />
            </Button>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {prescriptions.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="size-8 text-slate-300 dark:text-zinc-750 mb-2" />
                <p className="text-xs text-slate-400 dark:text-zinc-550 font-semibold">Sin recetas registradas</p>
              </div>
            ) : (
              prescriptions.slice(0, 4).map((presc) => (
                <motion.div
                  key={presc.id}
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer bg-white/5 dark:bg-zinc-900/40 hover:bg-slate-100/50 dark:hover:bg-zinc-900/60 border border-slate-200/50 dark:border-white/5 shadow-sm transition-all duration-200"
                  onClick={() => navigate('detalle-receta', presc.id)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
                    <QrCodeIcon className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate">
                      {presc.doctor?.name || 'Médico Prescriptor'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-zinc-500 font-bold mt-0.5">
                      <span>{formatDate(presc.issue_date, 'dd MMM yyyy')}</span>
                      <span>•</span>
                      <span>{presc.lines?.length || 0} medicamentos</span>
                    </div>
                  </div>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 border',
                    PRESCRIPTION_STATUS_CONFIG[presc.status]?.bgColor,
                    PRESCRIPTION_STATUS_CONFIG[presc.status]?.color
                  )}>
                    {PRESCRIPTION_STATUS_CONFIG[presc.status]?.label || presc.status}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Health Stats Summary Card */}
        <GlassCard className="md:col-span-6 border border-slate-200 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 rounded-[2.5rem] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3.5 border-b border-dashed border-slate-200 dark:border-white/10 mb-4">
              <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/10">
                <HeartPulse className="size-4 text-emerald-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Resumen Clínico</h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Total Appointments */}
              <motion.div
                whileHover={{ scale: 1.015 }}
                className="rounded-2xl bg-teal-500/5 border border-teal-500/10 p-3.5 cursor-pointer flex flex-col justify-between h-24"
                onClick={() => navigate('citas')}
              >
                <div className="flex items-center justify-between">
                  <Calendar className="size-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-[9px] font-black bg-teal-500/10 px-1.5 py-0.5 rounded-full text-teal-600 dark:text-teal-400 uppercase">Citas</span>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{totalAppointments}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-550 font-bold mt-1">
                    {upcomingCount} programada{(upcomingCount) !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>

              {/* Active Prescriptions */}
              <motion.div
                whileHover={{ scale: 1.015 }}
                className="rounded-2xl bg-indigo-500/5 border border-indigo-500/10 p-3.5 cursor-pointer flex flex-col justify-between h-24"
                onClick={() => navigate('recetas')}
              >
                <div className="flex items-center justify-between">
                  <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[9px] font-black bg-indigo-500/10 px-1.5 py-0.5 rounded-full text-indigo-600 dark:text-indigo-400 uppercase">Recetas</span>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{activePrescriptions}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-550 font-bold mt-1">
                    {prescriptions.length} registradas
                  </p>
                </div>
              </motion.div>

              {/* Pending Deliveries */}
              <motion.div
                whileHover={{ scale: 1.015 }}
                className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3.5 cursor-pointer flex flex-col justify-between h-24"
                onClick={() => navigate('seguimiento')}
              >
                <div className="flex items-center justify-between">
                  <Truck className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-[9px] font-black bg-amber-500/10 px-1.5 py-0.5 rounded-full text-amber-600 dark:text-amber-400 uppercase">Envíos</span>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{pendingDeliveries.length}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-550 font-bold mt-1">Activos por recibir</p>
                </div>
              </motion.div>

              {/* Quick Action CTA */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-24"
                onClick={() => navigate('nueva-cita')}
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                  <Plus className="size-4" />
                </div>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Nueva Cita</p>
              </motion.button>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Holographic QR Passport modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowQrModal(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="size-5 text-teal-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">Pasaporte Digital Oasis</span>
              </div>
              
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-tight mb-1">
                {representedUser?.name || user?.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 mb-6 uppercase tracking-wider">Presenta este QR para surtir tu receta física</p>

              <div className="flex justify-center bg-slate-100 dark:bg-white rounded-[2rem] p-4 border border-slate-200/50 shadow-inner w-fit mx-auto">
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pasaporte/${user?.id}`} 
                  size={190} 
                  label="PASAPORTE"
                  className="scale-95"
                  showValue={false}
                />
              </div>

              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-6 leading-relaxed">
                Código cifrado HMAC seguro. Solo escaneable en farmacias asociadas y autorizadas por Oasis Nicaragua.
              </p>

              <Button
                className="mt-6 w-full rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-850 dark:text-zinc-300 font-black text-xs h-11 border border-slate-200 dark:border-white/5 uppercase tracking-wider"
                onClick={() => setShowQrModal(false)}
              >
                Cerrar Pasaporte
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating double-tap SOS emergency button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleSosClick}
        disabled={emergencyMutation.isPending}
        className={cn(
          "fixed bottom-24 right-6 z-[40] size-15 rounded-full flex items-center justify-center shadow-2xl border text-white transition-all duration-300 overflow-hidden",
          sosTaps === 0 
            ? "bg-red-500 border-red-400/20 shadow-red-500/20"
            : "bg-amber-500 border-amber-400/20 shadow-amber-500/30 animate-pulse ring-4 ring-amber-500/20"
        )}
      >
        <AnimatePresence mode="wait">
          {sosTaps === 0 ? (
            <motion.div
              key="sos"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center"
            >
              <AlertCircle className="size-7" />
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center font-black text-[10px] uppercase tracking-wider"
            >
              <span>Tocar</span>
              <span>Urgente</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
