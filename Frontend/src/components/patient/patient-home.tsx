'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useAppointments,
  usePrescriptions,
  useDeliveryOrders,
  useFamily,
  useReminders,
  useUpdateReminderStatus,
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
  Check,
  X,
  Bell,
} from 'lucide-react';

function getGreeting(): { text: string; icon: React.ReactNode; bgClass: string; textColor: string } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      text: 'Buenos días',
      icon: <Sun className="size-5 text-amber-300 animate-spin-slow shrink-0" />,
      bgClass: 'from-teal-500/10 via-emerald-500/5 to-transparent',
      textColor: 'text-teal-950 dark:text-teal-200'
    };
  }
  if (hour < 18) {
    return {
      text: 'Buenas tardes',
      icon: <CloudSun className="size-5 text-orange-400 animate-pulse shrink-0" />,
      bgClass: 'from-orange-500/10 via-teal-500/5 to-transparent',
      textColor: 'text-slate-900 dark:text-orange-200'
    };
  }
  return {
    text: 'Buenas noches',
    icon: <Moon className="size-5 text-indigo-400 shrink-0" />,
    bgClass: 'from-indigo-950/20 via-slate-900/5 to-transparent',
    textColor: 'text-indigo-950 dark:text-indigo-200'
  };
}

export function PatientHome() {
  const [mounted, setMounted] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const { user, representedUser, setRepresentedUser, isElderlyMode, toggleElderlyMode, navigate } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePatientId = representedUser?.id || user?.id;

  const appointmentsQuery = useAppointments({ limit: 5, patient_id: activePatientId });
  const prescriptionsQuery = usePrescriptions({ limit: 5, patient_id: activePatientId });
  const deliveriesQuery = useDeliveryOrders({ status: 'pending' });
  const familyQuery = useFamily(user?.role === 'patient');

  const appointments = appointmentsQuery.data?.data ?? [];
  const prescriptions = prescriptionsQuery.data?.data ?? [];
  const pendingDeliveries = deliveriesQuery.data?.data ?? [];
  const caregiverFor = familyQuery.data?.caregiverFor ?? [];

  const remindersQuery = useReminders();
  const updateReminderStatusMutation = useUpdateReminderStatus();
  const reminders = remindersQuery.data?.data ?? [];

  const isLoading =
    appointmentsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    deliveriesQuery.isLoading ||
    familyQuery.isLoading ||
    remindersQuery.isLoading;

  const hasError =
    appointmentsQuery.isError ||
    prescriptionsQuery.isError ||
    deliveriesQuery.isError ||
    remindersQuery.isError;

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
      <div className="rounded-[40px_16px_30px_20px] bg-red-500/5 p-6 border border-red-500/20 shadow-2xl relative overflow-hidden">
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
            className="rounded-[18px_8px_16px_8px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-xs px-7 py-3 shadow-lg shadow-teal-500/20 uppercase tracking-wider transition-all duration-300 cursor-pointer border-none"
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



  return (
    <div className={cn(
      "space-y-6 pb-28 relative overflow-visible px-1 sm:px-0",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:py-3.5 [&_button]:text-sm [&_svg]:size-5.5"
    )}>
      
      {/* Dynamic Background Organic Blobs */}
      <div className="absolute top-[10%] left-[-10%] size-96 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl animate-blob-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-96 rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Console Bar (Caregiver & System Telemetry) - Spatial floating borderless tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-500/[0.02] dark:bg-zinc-950/20 md:bg-white/30 md:dark:bg-zinc-950/20 border border-slate-200/20 dark:border-white/5 rounded-[2rem] p-3 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Elderly Mode switch - Capsule shape */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleElderlyMode}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-[50px] border text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer",
              isElderlyMode
                ? "bg-amber-500/10 border-amber-500/35 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/15"
                : "bg-white/40 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-550 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/10"
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
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-emerald-450 px-4 py-2 bg-teal-500/10 rounded-[50px] border border-teal-500/20 w-fit self-end sm:self-center shadow-sm">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>Telemetría Oasis Acreditada</span>
        </div>
      </div>

      {/* SEAMLESS HEADER SECTION — Spatial borderless glowing area */}
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-teal-500/10 via-white/[0.01] to-emerald-500/[0.02] dark:from-teal-500/10 dark:via-zinc-950/15 dark:to-emerald-500/[0.02] p-6 sm:p-8 border border-slate-200/20 dark:border-white/5 shadow-lg backdrop-blur-xl">
        {/* Dynamic Fluid Glowing Orbs */}
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-teal-400/15 dark:bg-teal-400/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -left-16 -bottom-16 size-56 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-teal-500/10 rounded-full shrink-0">
                {greeting.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-700/80 dark:text-teal-300">
                {greeting.text}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-none italic">
              Hola, {firstName}
            </h1>
            
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">{dateStr}</p>
            
            <div className="flex items-center gap-1.5 bg-teal-500/15 border border-teal-500/25 text-teal-700 dark:text-teal-300 px-3.5 py-1 rounded-[50px] text-[8px] font-black uppercase tracking-widest w-fit shadow-sm">
              <Shield className="size-3 text-teal-500 shrink-0" />
              <span>Expediente Seguro MINSA</span>
            </div>
          </div>

          {/* Profile Avatar + Digital QR Passport Seal */}
          <div className="flex items-center gap-4 shrink-0 bg-white/10 dark:bg-white/[0.02] md:bg-white/40 md:dark:bg-black/10 border border-slate-200/20 dark:border-white/5 rounded-[2rem] p-3 shadow-sm">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Código Expediente</p>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Acreditado</span>
              </div>
            </div>
            <Avatar className="size-14 border-2 border-white/60 dark:border-white/10 shadow-lg ring-4 ring-teal-500/10">
              <AvatarImage src={user?.avatar_url} alt={user?.name} />
              <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-455 text-base font-black font-serif">
                {getInitials(representedUser?.name || user?.name || 'Paciente')}
              </AvatarFallback>
            </Avatar>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQrModal(true)}
              className="group relative flex items-center justify-center size-11 rounded-[16px_8px_14px_8px] bg-white/50 dark:bg-white/5 hover:bg-teal-500/10 border border-slate-250 dark:border-white/10 shadow-sm transition-all duration-300 cursor-pointer"
            >
              <QrCodeIcon className="size-5 text-slate-700 dark:text-teal-400 group-hover:scale-105 shrink-0" />
              <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-teal-500 border border-white dark:border-zinc-950 shadow-md">
                <Shield className="size-2.5 text-white" />
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* SEAMLESS QUICK ACTIONS CONSOLE — Cardless flow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
        {[
          { label: 'Nueva Cita', icon: Plus, page: 'nueva-cita' as const, bg: 'from-teal-500/10 via-teal-500/5 to-transparent border-teal-500/20 text-teal-700 dark:text-teal-400' },
          { label: 'Ver Recetas', icon: FileText, page: 'recetas' as const, bg: 'from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/20 text-sky-700 dark:text-sky-400' },
          { label: 'Farmacias', icon: MapPin, page: 'mapa-farmacias' as const, bg: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-400' },
          { label: 'Delivery', icon: Truck, page: 'seguimiento' as const, bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
        ].map((action, i) => (
          <motion.button
            key={action.page}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              borderRadius: i % 2 === 0 
                ? '24px 10px 18px 10px' 
                : '10px 24px 10px 18px'
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 py-4 px-2 border shadow-sm bg-gradient-to-b h-20 text-center select-none transition-all duration-300 cursor-pointer',
              action.bg
            )}
            onClick={() => navigate(action.page)}
          >
            <div className="p-1 bg-white/40 dark:bg-black/10 rounded-full shrink-0">
              <action.icon className="size-4.5" />
            </div>
            <span className="text-[9px] font-black tracking-widest uppercase">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* DYNAMIC SEAMLESS CLINICAL FEED — All consolidated into one beautiful unboxed workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
        
        {/* Main Column: timeline & appointments (7 cols) - borderless mobile-first */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-500/[0.02] dark:bg-zinc-950/[0.15] md:bg-white/10 md:dark:bg-zinc-950/10 border border-slate-200/20 dark:border-white/5 rounded-[2rem] backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-slate-200 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7.5 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/15">
                  <Calendar className="size-4 text-teal-600 dark:text-teal-450" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Próxima Consulta</h3>
              </div>
              {nextAppointment && <span className="size-2 rounded-full bg-teal-500 animate-pulse" />}
            </div>

            <div className="py-2">
              {nextAppointment ? (
                <div className="relative pl-3.5 py-2.5">
                  {/* Timeline bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-full" />
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Especialista</p>
                      <p className="text-base font-black text-slate-800 dark:text-white mt-0.5 font-serif">
                        Dr. {nextAppointment.doctor?.name}
                      </p>
                      {nextAppointment.doctor?.doctor_profile?.specialty && (
                        <p className="text-[9px] font-black text-teal-600 dark:text-teal-455 uppercase tracking-widest mt-1">
                          {nextAppointment.doctor.doctor_profile.specialty}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-teal-500/[0.03] dark:bg-teal-500/[0.02] p-3.5 rounded-2xl border border-teal-500/10 shadow-sm">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-405 dark:text-zinc-500 uppercase tracking-widest">Fecha y hora</p>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                          <Clock className="size-3 text-teal-500 shrink-0" />
                          <span>{formatDate(nextAppointment.date_time, "dd MMM • HH:mm")}</span>
                        </p>
                      </div>
                      {nextAppointment.clinic && (
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-slate-405 dark:text-zinc-500 uppercase tracking-widest">Sede médica</p>
                          <p className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                            <MapPin className="size-3 text-rose-500/70 shrink-0" />
                            <span className="truncate">{nextAppointment.clinic.name}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-dashed border-slate-200 dark:border-white/5">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-wider border shadow-sm',
                        APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.bgColor,
                        APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.color
                      )}>
                        {APPOINTMENT_STATUS_CONFIG[nextAppointment.status]?.label || nextAppointment.status}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4.5 py-2 rounded-full bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-655 dark:text-zinc-350 cursor-pointer"
                        onClick={() => navigate('citas')}
                      >
                        Administrar Consulta
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center space-y-4">
                  <Calendar className="size-10 text-slate-350 dark:text-zinc-700 animate-bounce-slow" />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">Sin consultas programadas</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-555 leading-relaxed font-semibold max-w-xs mx-auto">Tus próximas consultas con especialistas Oasis aparecerán cronológicamente aquí.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-[16px_50px_16px_50px] bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black text-[9px] px-5 py-2.5 shadow-md shadow-teal-500/10 uppercase tracking-widest cursor-pointer border-none"
                    onClick={() => navigate('nueva-cita')}
                  >
                    Agendar Cita Médica
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Adherence Reminders Section */}
          <div className="bg-slate-500/[0.02] dark:bg-zinc-950/[0.15] md:bg-white/10 md:dark:bg-zinc-950/10 border border-slate-200/20 dark:border-white/5 rounded-[2rem] backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-slate-200 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7.5 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/15">
                  <Clock className="size-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Alarmas y Adherencia</h3>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-405 px-3 py-0.5 rounded-[50px] text-[8px] font-black uppercase tracking-widest shadow-sm">
                <Bell className="size-3 text-rose-500 animate-bounce-slow" />
                <span>Recordatorios</span>
              </div>
            </div>

            <div className="space-y-3">
              {reminders.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center space-y-3">
                  <div className="p-3 bg-slate-500/5 rounded-full">
                    <Pill className="size-8 text-slate-350 dark:text-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-550 dark:text-zinc-450 font-black">Sin alarmas programadas</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-550 max-w-xs mx-auto leading-relaxed font-semibold">
                      Agrega alarmas desde el detalle de tus recetas para no olvidar tus tomas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {reminders.map((reminder) => (
                    <div 
                      key={reminder.id}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 shadow-sm",
                        reminder.status === 'taken' 
                          ? "bg-emerald-500/[0.03] border-emerald-500/20" 
                          : reminder.status === 'skipped'
                            ? "bg-slate-500/[0.03] border-slate-200/50 dark:border-white/5 opacity-70"
                            : "bg-white/40 dark:bg-white/[0.02] border-slate-250 dark:border-white/5 hover:border-teal-500/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>{reminder.scheduledTime}</span>
                          </p>
                          <p className="text-xs font-black text-slate-805 dark:text-white mt-1 truncate font-serif">
                            {reminder.medicineName}
                          </p>
                          <p className="text-[9px] font-bold text-slate-450 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {reminder.dosageInstructions}
                          </p>
                        </div>

                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 border",
                          reminder.status === 'taken'
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-450"
                            : reminder.status === 'skipped'
                              ? "bg-slate-500/10 border-slate-300/20 text-slate-500 dark:text-zinc-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-450"
                        )}>
                          {reminder.status === 'taken' ? 'Tomado' : reminder.status === 'skipped' ? 'Saltado' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-white/5">
                        {reminder.status === 'pending' ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateReminderStatusMutation.mutate({ id: reminder.id, status: 'taken' })}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/10 cursor-pointer border-none"
                            >
                              <Check className="size-3" />
                              <span>Tomar</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateReminderStatusMutation.mutate({ id: reminder.id, status: 'skipped' })}
                              className="py-1.5 px-3 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 cursor-pointer"
                            >
                              Saltar
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateReminderStatusMutation.mutate({ id: reminder.id, status: 'pending' })}
                            className="w-full py-1.5 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-450 cursor-pointer"
                          >
                            Restablecer
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: recent recipes & stats (5 cols) - borderless mobile-first */}
        <div className="lg:col-span-5 bg-slate-500/[0.02] dark:bg-zinc-950/[0.15] md:bg-white/10 md:dark:bg-zinc-950/10 border border-slate-200/20 dark:border-white/5 rounded-[2rem] backdrop-blur-md p-5 shadow-sm flex flex-col justify-between gap-5">
          
          {/* Recent Prescriptions Section */}
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-slate-200 dark:border-white/5 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7.5 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/15">
                  <Pill className="size-4 text-sky-500" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Recetas Recientes</h3>
              </div>
              <motion.button
                whileHover={{ x: 2 }}
                className="text-sky-600 dark:text-sky-400 text-[10px] font-black hover:bg-transparent flex items-center gap-0.5 cursor-pointer border-none bg-transparent"
                onClick={() => navigate('recetas')}
              >
                Todas <ChevronRight className="size-3.5" />
              </motion.button>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
              {prescriptions.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <FileText className="size-8 text-slate-300 dark:text-zinc-800 mb-1" />
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold">No registras recetas emitidas</p>
                </div>
              ) : (
                prescriptions.slice(0, 3).map((presc) => (
                  <motion.div
                    key={presc.id}
                    whileHover={{ x: 3 }}
                    className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-slate-500/[0.04] dark:hover:bg-white/[0.02] border-b border-dashed border-slate-200/50 dark:border-white/5 last:border-b-0 transition-all"
                    onClick={() => navigate('detalle-receta', presc.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/15 text-sky-500">
                        <QrCodeIcon className="size-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate font-serif">
                          Dr. {presc.doctor?.name || 'Médico'}
                        </p>
                        <p className="text-[9px] text-slate-450 dark:text-zinc-500 font-extrabold mt-0.5 uppercase tracking-wide">
                          {formatDate(presc.issue_date, 'dd MMM yyyy')} • {presc.lines?.length || 0} meds
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 border scale-95 shadow-sm',
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

          {/* Quick Health Stats Summary */}
          <div className="border-t border-dashed border-slate-200 dark:border-white/5 pt-4">
            <div className="flex items-center gap-2 mb-3.5">
              <div className="flex size-7.5 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                <HeartPulse className="size-4 text-emerald-500" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Resumen Clínico</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Total Appointments */}
              <div className="rounded-xl bg-teal-500/5 border border-teal-500/10 p-2.5 text-center shadow-inner">
                <p className="text-[8px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Consultas</p>
                <p className="text-base font-black text-slate-800 dark:text-white mt-1 font-serif">{totalAppointments}</p>
                <p className="text-[7.5px] text-slate-450 dark:text-zinc-550 font-extrabold uppercase mt-0.5">{upcomingCount} activa{(upcomingCount) !== 1 ? 's' : ''}</p>
              </div>

              {/* Active Prescriptions */}
              <div className="rounded-xl bg-sky-500/5 border border-sky-500/10 p-2.5 text-center shadow-inner">
                <p className="text-[8px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Recetas</p>
                <p className="text-base font-black text-slate-800 dark:text-white mt-1 font-serif">{activePrescriptions}</p>
                <p className="text-[7.5px] text-slate-450 dark:text-zinc-550 font-extrabold uppercase mt-0.5">{prescriptions.length} emitidas</p>
              </div>

              {/* Pending Deliveries */}
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-2.5 text-center shadow-inner">
                <p className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Envíos</p>
                <p className="text-base font-black text-slate-800 dark:text-white mt-1 font-serif">{pendingDeliveries.length}</p>
                <p className="text-[7.5px] text-slate-450 dark:text-zinc-550 font-extrabold uppercase mt-0.5">Por recibir</p>
              </div>
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
                <Shield className="size-5 text-teal-500 animate-pulse shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-zinc-400">Expediente Digital Oasis</span>
              </div>
              
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight mb-1 font-serif">
                {representedUser?.name || user?.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-555 mb-6 uppercase tracking-wider">Escanea este código en Farmacias Autorizadas</p>

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
                className="mt-6 w-full rounded-[16px_50px_16px_50px] bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-350 font-black text-[10px] h-11 border border-slate-250 dark:border-white/5 uppercase tracking-widest cursor-pointer"
                onClick={() => setShowQrModal(false)}
              >
                Cerrar Pasaporte
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}
