'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useClinics,
  useClinicDoctors,
  useCreateAppointment,
  useAppointments,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, getInitials } from '@/utils/helpers';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapView } from '@/components/common/map-view';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Stethoscope,
  CalendarIcon,
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Star,
  Phone,
  Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const STEPS = [
  { number: 1, label: 'Clínica' },
  { number: 2, label: 'Médico' },
  { number: 3, label: 'Horario' },
  { number: 4, label: 'Confirmar' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const fadeInUp = {
  initial: { opacity: 0, scale: 0.98, y: 15 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 22 } },
  exit: { opacity: 0, scale: 0.98, y: -15, transition: { duration: 0.15 } },
} as const;

export function NewAppointment() {
  const { representedUser, navigate, setNotification, isElderlyMode } = useAuthStore();
  const [step, setStep] = useState(1);

  // Step 1: Clinic
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const clinicsQuery = useClinics({ is_active: true });
  const clinics = clinicsQuery.data?.data ?? [];
  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) ?? null;

  // Step 2: Doctor
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const doctorsQuery = useClinicDoctors(selectedClinicId ?? '', { search: doctorSearch }, !!selectedClinicId);
  const doctors = doctorsQuery.data ?? [];
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) ?? null;

  // Step 3: Date/Time
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Fetch occupied slots for the selected doctor/date
  const { data: occupiedAppointments, isLoading: isLoadingOccupied } = useAppointments({
    doctor_id: selectedDoctorId || undefined,
    date_from: selectedDate ? new Date(new Date(selectedDate).setHours(0,0,0,0)).toISOString() : undefined,
    date_to: selectedDate ? new Date(new Date(selectedDate).setHours(23,59,59,999)).toISOString() : undefined,
    status: 'scheduled,confirmed,in_progress'
  }, !!(selectedDoctorId && selectedDate));

  // Filter available slots
  const availableSlots = useMemo(() => {
    const slots = TIME_SLOTS.map(slot => ({
      time: slot,
      isOccupied: false
    }));

    if (!occupiedAppointments?.data) return slots;
    
    const occupiedTimes = occupiedAppointments.data.map(app => {
      const date = new Date(app.date_time);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });

    return slots.map(slot => ({
      ...slot,
      isOccupied: occupiedTimes.includes(slot.time)
    }));
  }, [occupiedAppointments, selectedDate]);

  const createMutation = useCreateAppointment();

  const handleClinicSelect = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    setSelectedDoctorId(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedClinicId;
      case 2: return !!selectedDoctorId;
      case 3: return !!selectedDate && !!selectedTime;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedClinicId || !selectedDoctorId || !selectedDate || !selectedTime) return;
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      const payload: any = {
        doctor_id: selectedDoctorId,
        clinic_id: selectedClinicId,
        date_time: dateTime.toISOString(),
        duration_minutes: 30,
      };

      if (representedUser) {
        payload.patient_id = representedUser.id;
      }

      await createMutation.mutateAsync(payload);

      setNotification({ type: 'success', message: 'Consulta médica reservada con éxito' });
      navigate('appointments');
    } catch (error: any) {
      const msg = getHookErrorMessage(error);
      setNotification({ type: 'error', message: msg || 'No se pudo agendar la cita' });
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('appointments');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className={cn(
      "space-y-8 max-w-4xl mx-auto pb-24 relative overflow-visible px-2 sm:px-0",
      isElderlyMode && "text-base font-medium [&_h3]:text-2xl [&_p]:text-base [&_button]:text-base [&_button]:h-14"
    )}>
      
      {/* Background Glows */}
      <div className="absolute top-[10%] left-[-10%] size-96 rounded-full bg-teal-500/[0.03] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-96 rounded-full bg-sky-500/[0.03] blur-3xl pointer-events-none" />

      {/* Stepper Capsule */}
      <div className="bg-zinc-900/60 dark:bg-zinc-950/40 border border-zinc-800 rounded-full py-4 px-6 sm:px-8 shadow-xl backdrop-blur-xl max-w-xl mx-auto">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, idx) => {
            const isCompleted = step > s.number;
            const isActive = step === s.number;
            return (
              <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={step < s.number && !canProceed()}
                    onClick={() => step >= s.number && setStep(s.number)}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 relative z-10 border shadow-md',
                      isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/10'
                        : isActive
                          ? 'bg-gradient-to-br from-teal-500 to-sky-500 border-teal-500 text-white scale-105 shadow-teal-500/25'
                          : 'bg-zinc-900/40 dark:bg-zinc-900/20 border-zinc-800 text-zinc-500'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="size-5" /> : s.number}
                  </motion.button>
                  <span className={cn(
                    'hidden sm:block text-[10px] font-black uppercase tracking-wider absolute -bottom-5 w-20 text-center truncate transition-colors duration-300',
                    isActive ? 'text-teal-400' : 'text-zinc-500'
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 relative rounded-full overflow-hidden bg-zinc-800">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Mobile current label */}
        <div className="block sm:hidden text-center text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mt-3 animate-pulse">
          Paso {step} de 4: {STEPS[step - 1].label}
        </div>
      </div>

      {/* Step Container */}
      <div className="min-h-[440px] relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Clinic Selection */}
          {step === 1 && (
            <motion.div key="step1" {...fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Clinic List */}
              <div className="col-span-12 md:col-span-7">
                <GlassCard className="p-6 h-full flex flex-col justify-between border-zinc-800 bg-zinc-900/20">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 pb-3 border-b border-dashed border-zinc-800 mb-5">
                      Selecciona una Clínica
                    </h3>
                    
                    {clinicsQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="shimmer rounded-2xl h-24 opacity-60" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                        {clinics.map((clinic) => {
                          const isSelected = selectedClinicId === clinic.id;
                          return (
                            <motion.div
                              key={clinic.id}
                              whileHover={{ scale: 1.01, x: 2 }}
                              whileTap={{ scale: 0.99 }}
                              className={cn(
                                'flex items-center gap-4 p-5 cursor-pointer border rounded-2xl transition-all duration-300 relative overflow-hidden group shadow-md',
                                isSelected 
                                  ? 'bg-teal-500/10 border-teal-500/40 ring-2 ring-teal-500/10' 
                                  : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40'
                              )}
                              onClick={() => handleClinicSelect(clinic.id)}
                            >
                              {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600" />
                              )}
                              <div className={cn(
                                'flex size-12 items-center justify-center rounded-xl shrink-0 transition-colors',
                                isSelected ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-zinc-800 text-zinc-500'
                              )}>
                                <Building2 className="size-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-white truncate">
                                    {clinic.name}
                                  </p>
                                  {isSelected && <ShieldCheck className="size-4 text-teal-400 shrink-0" />}
                                </div>
                                <p className="text-xs font-medium text-zinc-400 mt-1 flex items-center gap-1.5">
                                  <MapPin className="size-3.5 text-rose-500/80 shrink-0" />
                                  <span className="truncate">{clinic.address}</span>
                                </p>
                                <div className="mt-2.5 flex items-center gap-4 text-[10px] font-bold text-zinc-500">
                                  <span className="flex items-center gap-1"><Phone className="size-3" /> {clinic.phone || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><Mail className="size-3" /> {clinic.email || 'Contacto en sede'}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Map Panel */}
              <div className="col-span-12 md:col-span-5 h-72 md:h-auto">
                <GlassCard className="p-2 h-full overflow-hidden border-zinc-800 bg-zinc-900/20">
                  <div className="rounded-2xl overflow-hidden h-full">
                    <MapView
                      markers={selectedClinic 
                        ? [{ id: selectedClinic.id, lat: selectedClinic.latitude, lng: selectedClinic.longitude, type: 'clinic', label: selectedClinic.name }] 
                        : clinics.map(c => ({ id: c.id, lat: c.latitude, lng: c.longitude, type: 'clinic', label: c.name }))}
                      center={[selectedClinic?.latitude ?? DEFAULT_LAT, selectedClinic?.longitude ?? DEFAULT_LNG]}
                      height="100%"
                      zoom={selectedClinic ? 15 : 12}
                    />
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Doctor Selection */}
          {step === 2 && (
            <motion.div key="step2" {...fadeInUp}>
              <GlassCard className="p-6 border-zinc-800 bg-zinc-900/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dashed border-zinc-800 mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                    Selecciona un Especialista
                  </h3>
                  
                  <div className="relative w-full sm:max-w-xs shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <Input
                      placeholder="Buscar por nombre o especialidad..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="bg-zinc-950/80 border-zinc-800 text-white rounded-full pl-9 h-10 text-xs font-bold"
                    />
                  </div>
                </div>

                {doctorsQuery.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="shimmer rounded-2xl h-24 opacity-60" />
                    ))}
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center max-w-xs mx-auto space-y-4">
                    <Stethoscope className="size-12 text-zinc-700 animate-pulse" />
                    <p className="text-xs text-zinc-400 font-bold leading-relaxed">
                      No se encontraron especialistas en esta clínica que coincidan con la búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                    {doctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <motion.div
                          key={doc.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            'flex items-center gap-4 p-5 cursor-pointer border rounded-2xl transition-all duration-300 relative overflow-hidden shadow-sm group',
                            isSelected 
                              ? 'bg-teal-500/10 border-teal-500/40 ring-2 ring-teal-500/10' 
                              : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40'
                          )}
                          onClick={() => setSelectedDoctorId(doc.id)}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600" />
                          )}
                          <Avatar className="size-14 border border-zinc-800 group-hover:border-teal-500/25 shrink-0 shadow-sm transition-colors duration-300">
                            <AvatarFallback className="bg-teal-500/5 text-teal-400 text-sm font-black font-serif">
                              {getInitials(doc.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-white truncate">
                                Dr. {doc.name}
                              </p>
                              {isSelected ? (
                                <CheckCircle2 className="size-4.5 text-teal-400 shrink-0" />
                              ) : (
                                <span className="flex items-center text-[10px] font-black text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                                  <Star className="size-3 mr-0.5 fill-amber-500 shrink-0" /> 4.9
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1">
                              {doc.doctor_profile?.specialty || 'Médico General'}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                              Consulta Presencial & Teleconsulta
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 3: Date and Time Schedule */}
          {step === 3 && (
            <motion.div key="step3" {...fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Calendar Box */}
              <div className="col-span-12 md:col-span-6">
                <GlassCard className="p-6 h-full border-zinc-800 bg-zinc-900/20">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 pb-3 border-b border-dashed border-zinc-800 mb-4">
                    Selecciona una Fecha
                  </h3>
                  <div className="flex justify-center bg-zinc-950/40 rounded-2xl p-4 border border-zinc-800 shadow-inner">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { 
                        setSelectedDate(date); 
                        setSelectedTime(null); 
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-xl border-none p-1 mx-auto"
                    />
                  </div>
                </GlassCard>
              </div>

              {/* Time Slots */}
              <div className="col-span-12 md:col-span-6">
                <GlassCard className="p-6 h-full flex flex-col justify-between min-h-[380px] border-zinc-800 bg-zinc-900/20">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 pb-3 border-b border-dashed border-zinc-800 mb-4">
                      Horarios Disponibles
                    </h3>
                    
                    {!selectedDate ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-16 text-center space-y-4">
                        <CalendarIcon className="size-14 text-zinc-800 animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-400">Paso previo</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold max-w-[200px]">Por favor selecciona un día en el calendario.</p>
                      </div>
                    ) : isLoadingOccupied ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <Loader2 className="size-8 text-teal-500 animate-spin" />
                        <p className="text-[10px] font-black text-zinc-500 mt-2.5 uppercase tracking-widest">Sincronizando consultorios...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {availableSlots.map(({ time, isOccupied }) => {
                          const isSelected = selectedTime === time;
                          return (
                            <motion.button
                              key={time}
                              whileHover={!isOccupied ? { scale: 1.02 } : {}}
                              whileTap={!isOccupied ? { scale: 0.98 } : {}}
                              disabled={isOccupied}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                'flex items-center justify-center gap-1.5 py-3 text-xs font-bold rounded-xl transition-all duration-300 border shadow-sm select-none',
                                isSelected
                                  ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/10'
                                  : isOccupied 
                                    ? 'bg-zinc-950/20 border-zinc-900/40 text-zinc-700 cursor-not-allowed opacity-30'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/40'
                              )}
                            >
                              <Clock className="size-3.5 shrink-0" />
                              {time}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedDate && !isLoadingOccupied && (
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-4 text-[10px] uppercase font-black text-zinc-500 tracking-widest pl-1">
                      <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-teal-500 shadow-sm" /> Disponible</div>
                      <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-zinc-900" /> Ocupado</div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Confirm Details */}
          {step === 4 && (
            <motion.div key="step4" {...fadeInUp}>
              <GlassCard className="p-6 max-w-md mx-auto border-zinc-800 bg-zinc-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 size-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
                
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-zinc-400 pb-3 border-b border-dashed border-zinc-800 mb-6 text-center">
                  Resumen de Reserva Médica
                </h3>
                
                <div className="space-y-6">
                  {/* Doctor Card */}
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-teal-500/5 border border-teal-500/20 shadow-sm">
                    <Avatar className="size-16 mb-3 border border-teal-500/20 ring-4 ring-teal-500/5 shadow-md">
                      <AvatarFallback className="bg-teal-500/10 text-teal-400 text-base font-black font-serif">
                        {getInitials(selectedDoctor?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="text-sm font-black text-white leading-none">Dr. {selectedDoctor?.name}</h4>
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mt-1.5">
                      {selectedDoctor?.doctor_profile?.specialty || 'Médico General'}
                    </p>
                  </div>

                  {/* Receipt Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-1.5 shadow-sm">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ubicación</p>
                      <p className="text-xs font-bold text-white truncate">{selectedClinic?.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate leading-relaxed font-semibold">{selectedClinic?.address}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-1.5 shadow-sm">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Fecha y hora</p>
                      <p className="text-xs font-bold text-white">{selectedDate ? formatDate(selectedDate.toISOString(), "dd 'de' MMMM") : ''}</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">{selectedTime} hrs • 30 mins</p>
                    </div>
                  </div>

                  {/* Notification warning banner */}
                  <div className="flex items-center gap-3 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/15 text-[11px] font-medium text-zinc-400 shadow-sm leading-relaxed">
                    <Sparkles className="size-5 text-sky-500 dark:text-sky-400 shrink-0 animate-pulse" />
                    <span>Recibirás un recordatorio seguro por notificación PWA antes del horario pactado.</span>
                  </div>

                  {/* Confirm Button */}
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createMutation.isPending} 
                    className="w-full h-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/15 flex items-center justify-center gap-2 border-none transition-all duration-300"
                  >
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : (
                      <>
                        <span>Confirmar Consulta</span>
                        <ArrowRight className="size-4 shrink-0" />
                      </>
                    )}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Control Navigation Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-zinc-800 transition-colors duration-300">
        <Button 
          variant="ghost" 
          className="rounded-full gap-1.5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900/60" 
          onClick={handleBack}
        >
          <ChevronLeft className="size-4 shrink-0" /> 
          {step === 1 ? 'Volver' : 'Anterior'}
        </Button>
        
        {step < 4 && (
          <Button 
            onClick={() => setStep(step + 1)} 
            disabled={!canProceed()} 
            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest gap-1.5 px-7 shadow-md shadow-teal-500/10 h-11"
          >
            <span>Siguiente</span> 
            <ChevronRight className="size-4 shrink-0" />
          </Button>
        )}
      </div>

    </div>
  );
}
