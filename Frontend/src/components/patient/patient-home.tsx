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
  Sun,
  Moon,
  CloudSun,
  Shield,
  Sparkles,
  HeartPulse,
} from 'lucide-react';

function getGreeting(): { text: string; icon: React.ReactNode; bgClass: string; textColor: string } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      text: 'Buenos días',
      icon: <Sun className="size-5 text-amber-300 animate-spin-slow shrink-0" />,
      bgClass: 'from-teal-500/25 via-emerald-500/10 to-transparent',
      textColor: 'text-teal-950 dark:text-teal-200'
    };
  }
  if (hour < 18) {
    return {
      text: 'Buenas tardes',
      icon: <CloudSun className="size-5 text-orange-400 animate-pulse shrink-0" />,
      bgClass: 'from-orange-500/20 via-teal-500/10 to-transparent',
      textColor: 'text-slate-900 dark:text-orange-200'
    };
  }
  return {
    text: 'Buenas noches',
    icon: <Moon className="size-5 text-indigo-400 shrink-0" />,
    bgClass: 'from-indigo-950/40 via-slate-900/15 to-transparent',
    textColor: 'text-indigo-950 dark:text-indigo-200'
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative Liquid Blobs behind Loading Screen */}
        <div className="absolute top-1/4 left-1/4 size-72 rounded-full bg-gradient-to-br from-teal-500/10 to-transparent blur-3xl animate-blob-pulse" />
        <div className="absolute bottom-1/4 right-1/4 size-72 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl" />
        
        <LoadingAnimation size="lg" />
        <p className="text-xs font-black text-teal-600/60 dark:text-teal-400/60 tracking-[0.25em] mt-8 animate-pulse uppercase">
          Fluyendo tu Expediente Oasis...
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
      <div className="rounded-[40px_16px_30px_20px] glass p-6 border border-red-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 size-36 bg-red-500/5 rounded-full blur-2xl" />
        <div className="flex flex-col items-center py-12 text-center space-y-5">
          <div className="flex size-16 items-center justify-center rounded-[22px_12px_20px_10px] bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5">
            <AlertCircle className="size-7 text-red-500" />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-red-300 uppercase tracking-widest">Error de Sincronización</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
            {errorMessages || 'No se pudieron recuperar los datos del servidor médico.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-[18px_8px_16px_8px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-xs px-7 py-3 shadow-lg shadow-teal-500/20 uppercase tracking-wider transition-all duration-300"
            onClick={() => {
              appointmentsQuery.refetch();
              prescriptionsQuery.refetch();
              deliveriesQuery.refetch();
            }}
          >
            Reintentar Flujo
          </motion.button>
        </div>
      </div>
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
      "space-y-6 pb-28 relative overflow-visible",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:py-3.5 [&_button]:text-sm [&_svg]:size-5.5"
    )}>
      
      {/* Dynamic Background Organic Blobs */}
      <div className="absolute top-[10%] left-[-10%] size-96 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl animate-blob-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-96 rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Console Bar (Caregiver & System Telemetry) - Kidney-shaped curvature */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/30 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 rounded-[24px_12px_24px_12px] p-3 shadow-md backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Elderly Mode switch - Capsule shape */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleElderlyMode}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-[50px] border text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm",
              isElderlyMode
                ? "bg-amber-500/10 border-amber-500/35 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/15"
                : "bg-white/40 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/10"
            )}
          >
            <Activity className="size-3.5 text-amber-500 animate-pulse shrink-0" />
            <span>{isElderlyMode ? 'Modo Mayor Activo' : 'Modo Mayor'}</span>
          </motion.button>

          {/* Caregiver Switcher - Drop-like curves */}
          {caregiverFor.length > 0 && (
            <div className="flex items-center gap-2 bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-[16px_50px_16px_50px] px-4 py-2 text-xs shadow-sm">
              <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px] tracking-wider shrink-0">Paciente:</span>
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
                className="bg-transparent border-none text-slate-800 dark:text-zinc-200 font-black focus:outline-none cursor-pointer text-xs"
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
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-emerald-400 px-4 py-2 bg-teal-500/10 rounded-[50px] border border-teal-500/20 w-fit self-end sm:self-center shadow-sm">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>Telemetría Oasis Acreditada</span>
        </div>
      </div>

      {/* Bento Welcome Grid - High asymmetry curves */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Welcome Card - Fluid liquid wave shape */}
        <div className={cn(
          "md:col-span-8 overflow-hidden relative border border-slate-200/60 dark:border-white/5 bg-gradient-to-br shadow-2xl rounded-[40px_100px_32px_80px] p-6 sm:p-7 backdrop-blur-xl",
          greeting.bgClass
        )}>
          {/* Internal Specular light */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between gap-6 relative z-10">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 dark:bg-white/5 rounded-full">
                  {greeting.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-700/80 dark:text-zinc-300">
                  {greeting.text}
                </span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none font-serif">
                Hola, {firstName}
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">{dateStr}</p>
              
              <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 px-3.5 py-1.5 rounded-[50px] text-[9px] font-black uppercase tracking-wider w-fit shadow-sm">
                <Shield className="size-3 text-teal-500 dark:text-teal-400" />
                <span>Expediente Seguro MINSA</span>
              </div>

              {/* Patient Notification Alert - Bubble style */}
              {nextAppointment && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[24px_12px_24px_12px] p-4 flex items-start gap-3 mt-4 shadow-sm">
                  <div className="p-1.5 bg-amber-500/15 rounded-lg shrink-0">
                    <AlertCircle className="size-4.5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-none">Consulta Programada</p>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-200 mt-1 font-semibold leading-tight">
                      Hoy a las {formatDate(nextAppointment.date_time, 'HH:mm')} con el {nextAppointment.doctor?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar + Digital QR Passport */}
            <div className="flex items-center justify-between sm:flex-col sm:justify-start gap-4 border-t sm:border-t-0 border-slate-200/50 dark:border-white/5 pt-4 sm:pt-0 shrink-0">
              <div className="flex items-center gap-3 sm:flex-col sm:text-center">
                <Avatar className="size-16 sm:size-20 border-2 border-white/40 shadow-2xl ring-4 ring-teal-550/10">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-450 text-xl font-black font-serif">
                    {getInitials(representedUser?.name || user?.name || 'Paciente')}
                  </AvatarFallback>
                </Avatar>
                <div className="sm:space-y-0.5">
                  <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Expediente</p>
                  <div className="flex items-center gap-1.5 sm:justify-center">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-wider">Acreditado</span>
                  </div>
                </div>
              </div>

              {/* Holographic QR Passport Trigger - Curved Shield shape */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQrModal(true)}
                className="group relative flex items-center justify-center size-12 rounded-[18px_10px_16px_10px] bg-white/50 dark:bg-white/5 hover:bg-teal-500/10 border border-slate-250 dark:border-white/10 shadow-md transition-all duration-300"
              >
                <QrCodeIcon className="size-5.5 text-slate-750 dark:text-teal-400 group-hover:scale-105" />
                <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-teal-500 border border-white dark:border-zinc-950 shadow-md">
                  <Shield className="size-2.5 text-white" />
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Next Appointment widget - Tear-drop organic curves */}
        <div className="md:col-span-4 border border-slate-200/60 dark:border-white/5 shadow-2xl bg-white/30 dark:bg-zinc-950/20 rounded-[80px_32px_40px_100px] p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-12 -left-12 size-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/15">
                  <Calendar className="size-4 text-teal-600 dark:text-teal-450" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Próxima Consulta</h3>
              </div>
              {nextAppointment && <span className="size-2 rounded-full bg-teal-500 animate-pulse" />}
            </div>

            <div className="pt-4">
              {nextAppointment ? (
                <div className="space-y-4">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white truncate font-serif">
                    {nextAppointment.doctor?.name || 'Especialista Oasis'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-slate-550 dark:text-zinc-400 font-semibold">
                      <Clock className="size-4 text-teal-550 dark:text-teal-400" />
                      <span>{formatDate(nextAppointment.date_time, "dd MMM • HH:mm")}</span>
                    </div>
                    {nextAppointment.clinic && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-550 dark:text-zinc-400 font-semibold">
                        <MapPin className="size-4 text-rose-500/70" />
                        <span className="truncate">{nextAppointment.clinic.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-1">
                    <span className={cn(
                      'inline-flex items-center rounded-[50px] px-3 py-1 text-[9px] font-black uppercase tracking-wider border shadow-sm',
                      APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.bgColor,
                      APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.color
                    )}>
                      {APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.label || nextAppointment.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <Calendar className="size-10 text-slate-350 dark:text-zinc-700 mb-3 animate-bounce-slow" />
                  <p className="text-xs text-slate-400 dark:text-zinc-550 font-bold">Sin consultas agendadas</p>
                </div>
              )}
            </div>
          </div>

          {!nextAppointment && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-[16px_50px_16px_50px] bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-black text-[10px] h-11 shadow-lg shadow-teal-500/10 mt-6 uppercase tracking-widest"
              onClick={() => navigate('nueva-cita')}
            >
              Agendar Consulta
            </motion.button>
          )}
        </div>

      </div>

      {/* Redesigned Quick Actions Console - Irregular Capsule structure */}
      <div className="border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 rounded-[32px_16px_32px_16px] p-4 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-500 block mb-4 pl-1">Consola Médica Rápida</span>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Nueva Cita', icon: Plus, page: 'nueva-cita' as const, bg: 'from-teal-500/15 via-teal-500/5 to-transparent border-teal-500/20 text-teal-700 dark:text-teal-400' },
            { label: 'Ver Recetas', icon: FileText, page: 'recetas' as const, bg: 'from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-500/20 text-indigo-700 dark:text-indigo-400' },
            { label: 'Farmacias', icon: MapPin, page: 'mapa-farmacias' as const, bg: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-400' },
            { label: 'Delivery', icon: Truck, page: 'seguimiento' as const, bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
          ].map((action, i) => (
            <motion.button
              key={action.page}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                borderRadius: i % 2 === 0 
                  ? '32px 12px 24px 12px' 
                  : '12px 32px 12px 24px'
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-2.5 py-4 px-2 border shadow-md bg-gradient-to-b h-24 text-center select-none transition-all duration-300',
                action.bg
              )}
              onClick={() => navigate(action.page)}
            >
              <div className="p-1.5 bg-white/40 dark:bg-black/10 rounded-full shrink-0">
                <action.icon className="size-5" />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Grid for Recipes and Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Recent Prescriptions - Transludiced receipt style with asymmetric edges */}
        <div className="md:col-span-6 border border-slate-200/60 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[32px_120px_20px_40px] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 size-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-slate-250 dark:border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/15">
                <Pill className="size-4.5 text-indigo-550 dark:text-indigo-400" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Recetas Recientes</h3>
            </div>
            <motion.button
              whileHover={{ x: 3 }}
              className="text-teal-600 dark:text-teal-400 text-xs font-black p-0 h-auto hover:bg-transparent flex items-center gap-0.5"
              onClick={() => navigate('recetas')}
            >
              Historial <ChevronRight className="size-3.5" />
            </motion.button>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {prescriptions.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <FileText className="size-10 text-slate-300 dark:text-zinc-800 mb-2 animate-pulse" />
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold">Bandeja de recetas limpia</p>
              </div>
            ) : (
              prescriptions.slice(0, 4).map((presc) => (
                <motion.div
                  key={presc.id}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer bg-white/40 dark:bg-zinc-900/40 hover:bg-white/80 dark:hover:bg-zinc-900/70 border border-slate-200/50 dark:border-white/5 shadow-sm transition-all duration-200"
                  onClick={() => navigate('detalle-receta', presc.id)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-450">
                    <QrCodeIcon className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate font-serif">
                      {presc.doctor?.name || 'Médico Prescriptor'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-zinc-500 font-bold mt-0.5">
                      <span>{formatDate(presc.issue_date, 'dd MMM yyyy')}</span>
                      <span>•</span>
                      <span>{presc.lines?.length || 0} meds</span>
                    </div>
                  </div>
                  <span className={cn(
                    'inline-flex items-center rounded-[50px] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 border shadow-sm',
                    PRESCRIPTION_STATUS_CONFIG[presc.status]?.bgColor,
                    PRESCRIPTION_STATUS_CONFIG[presc.status]?.color
                  )}>
                    {PRESCRIPTION_STATUS_CONFIG[presc.status]?.label || presc.status}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Health Stats Summary Card - Bento grids asimétricos */}
        <div className="md:col-span-6 border border-slate-200/60 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[80px_40px_32px_120px] p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 left-0 size-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 pb-3.5 border-b border-dashed border-slate-250 dark:border-white/10 mb-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                <HeartPulse className="size-4.5 text-emerald-500" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Resumen Clínico</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Total Appointments */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => navigate('citas')}
                className="rounded-[24px_12px_16px_12px] bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/10 p-4 cursor-pointer flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Calendar className="size-4.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                  <span className="text-[8px] font-black bg-teal-500/10 px-2 py-0.5 rounded-[50px] text-teal-700 dark:text-teal-400 uppercase tracking-wider">Citas</span>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-850 dark:text-white leading-none font-serif">{totalAppointments}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold mt-1.5">
                    {upcomingCount} programada{(upcomingCount) !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>

              {/* Active Prescriptions */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => navigate('recetas')}
                className="rounded-[12px_24px_12px_16px] bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 p-4 cursor-pointer flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <FileText className="size-4.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[8px] font-black bg-indigo-500/10 px-2 py-0.5 rounded-[50px] text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Recetas</span>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-850 dark:text-white leading-none font-serif">{activePrescriptions}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-550 font-bold mt-1.5">
                    {prescriptions.length} expedidas
                  </p>
                </div>
              </motion.div>

              {/* Pending Deliveries */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => navigate('seguimiento')}
                className="rounded-[12px_16px_12px_24px] bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 p-4 cursor-pointer flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Truck className="size-4.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[8px] font-black bg-amber-500/10 px-2 py-0.5 rounded-[50px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">Envíos</span>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-850 dark:text-white leading-none font-serif">{pendingDeliveries.length}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-550 font-bold mt-1.5">Por recibir</p>
                </div>
              </motion.div>

              {/* Quick Action CTA - Organic leaf shape */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => navigate('nueva-cita')}
                className="rounded-[16px_12px_24px_12px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-24 shadow-sm text-center"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                  <Plus className="size-4.5" />
                </div>
                <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Nueva Cita</p>
              </motion.button>
            </div>
          </div>
        </div>

      </div>

      {/* Holographic QR Passport modal - Bubble dynamic entry */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with extreme esmeril esmerilado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowQrModal(false)}
            />

            {/* Modal Content - Liquid Flask Capsule Curve */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="relative w-full max-w-sm rounded-[48px_24px_48px_24px] bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-white/10 p-6 shadow-2xl z-10 text-center"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="size-5 text-teal-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-zinc-400">Expediente Digital Oasis</span>
              </div>
              
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight mb-1 font-serif">
                {representedUser?.name || user?.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-550 mb-6 uppercase tracking-wider">Escanea este código en Farmacias Autorizadas</p>

              <div className="flex justify-center bg-slate-50 dark:bg-white rounded-[32px] p-5 border border-slate-200/50 shadow-inner w-fit mx-auto animate-shimmer-fast">
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pasaporte/${user?.id}`} 
                  size={190} 
                  label="PASAPORTE"
                  className="scale-95"
                  showValue={false}
                />
              </div>

              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-6 leading-relaxed">
                Código seguro con firmas criptográficas HMAC. Exclusivo para farmacias acreditadas por Oasis Nicaragua.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full rounded-[16px_50px_16px_50px] bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black text-[10px] h-11 border border-slate-250 dark:border-white/5 uppercase tracking-widest"
                onClick={() => setShowQrModal(false)}
              >
                Cerrar Pasaporte
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating double-tap SOS emergency button - Célula Orgánica Pulsante */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSosClick}
        disabled={emergencyMutation.isPending}
        style={{
          borderRadius: sosTaps === 0 ? '50% 50% 50% 50% / 40% 40% 60% 60%' : '30% 70% 30% 70% / 70% 30% 70% 30%'
        }}
        className={cn(
          "fixed bottom-24 left-6 z-[40] size-16 flex flex-col items-center justify-center shadow-2xl border text-white transition-all duration-300 overflow-hidden backdrop-blur-md",
          sosTaps === 0 
            ? "bg-red-500 border-red-400/20 shadow-red-500/30"
            : "bg-amber-500 border-amber-400/20 shadow-amber-500/40 animate-pulse ring-4 ring-amber-500/20"
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
              <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">SOS</span>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center font-black text-[9px] uppercase tracking-wider leading-none"
            >
              <span>Confirmar</span>
              <span className="text-[7px] opacity-80 mt-0.5">Volver a tocar</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
