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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function NewAppointment() {
  const { representedUser, navigate, setNotification } = useAuthStore();
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
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      
      {/* High-Tech Stepper Bar */}
      <div className="bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 rounded-3xl p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
          {STEPS.map((s, idx) => {
            const isCompleted = step > s.number;
            const isActive = step === s.number;
            return (
              <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <motion.button
                    type="button"
                    disabled={step < s.number && !canProceed()}
                    onClick={() => step >= s.number && setStep(s.number)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full text-xs font-black transition-all duration-300 relative z-10 border',
                      isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : isActive
                          ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20 scale-105'
                          : 'bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 dark:text-zinc-550'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="size-4.5" /> : s.number}
                  </motion.button>
                  <span className={cn(
                    'hidden sm:block text-[9px] font-black uppercase tracking-wider absolute -bottom-5 w-20 text-center truncate transition-colors duration-300',
                    isActive ? 'text-teal-650 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-550'
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 relative rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800">
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
        <div className="block sm:hidden text-center text-[10px] font-black text-teal-650 dark:text-teal-400 uppercase tracking-widest mt-2 animate-pulse">
          Paso {step} de 4: {STEPS[step - 1].label}
        </div>
      </div>

      {/* Dynamic Step Viewport */}
      <div className="min-h-[420px]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Clinic Selection */}
          {step === 1 && (
            <motion.div key="step1" {...fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="col-span-12 md:col-span-7">
                <GlassCard className="h-full flex flex-col justify-between border border-slate-200 dark:border-white/5 shadow-xl">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 pb-3 border-b border-slate-200 dark:border-white/5 mb-4">
                      Selecciona una Clínica
                    </h3>
                    
                    {clinicsQuery.isLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="shimmer rounded-2xl h-18 opacity-70" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                        {clinics.map((clinic) => {
                          const isSelected = selectedClinicId === clinic.id;
                          return (
                            <div
                              key={clinic.id}
                              className={cn(
                                'flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer border transition-all duration-300 relative overflow-hidden group shadow-sm',
                                isSelected 
                                  ? 'bg-teal-500/10 border-teal-500/30 ring-2 ring-teal-500/10' 
                                  : 'bg-white/5 border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
                              )}
                              onClick={() => handleClinicSelect(clinic.id)}
                            >
                              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />}
                              <div className={cn(
                                'flex size-11 items-center justify-center rounded-xl shrink-0 transition-colors',
                                isSelected ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-550'
                              )}>
                                <Building2 className="size-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                                    {clinic.name}
                                  </p>
                                  {isSelected && <ShieldCheck className="size-3.5 text-teal-500 shrink-0" />}
                                </div>
                                <p className="text-[10px] font-bold text-slate-550 dark:text-zinc-450 mt-1 flex items-center gap-1">
                                  <MapPin className="size-3 text-red-400 shrink-0" />
                                  <span className="truncate">{clinic.address}</span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Map side viewport */}
              <div className="col-span-12 md:col-span-5 h-72 md:h-auto">
                <GlassCard className="h-full !p-3 border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden rounded-[2.5rem]">
                  <MapView
                    markers={selectedClinic 
                      ? [{ id: selectedClinic.id, lat: selectedClinic.latitude, lng: selectedClinic.longitude, type: 'clinic', label: selectedClinic.name }] 
                      : clinics.map(c => ({ id: c.id, lat: c.latitude, lng: c.longitude, type: 'clinic', label: c.name }))}
                    center={[selectedClinic?.latitude ?? DEFAULT_LAT, selectedClinic?.longitude ?? DEFAULT_LNG]}
                    height="100%"
                    zoom={selectedClinic ? 15 : 12}
                  />
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Doctor Selection */}
          {step === 2 && (
            <motion.div key="step2" {...fadeInUp}>
              <GlassCard className="border border-slate-200 dark:border-white/5 shadow-xl bg-white dark:bg-zinc-950/20 rounded-[2.5rem] p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200 dark:border-white/5 mb-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                    Selecciona un Especialista
                  </h3>
                  
                  <div className="relative w-full sm:max-w-xs shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-550" />
                    <Input
                      placeholder="Buscar por nombre o especialidad..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="glass-input rounded-full pl-9 h-10 text-xs font-semibold"
                    />
                  </div>
                </div>

                {doctorsQuery.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="shimmer rounded-2xl h-20 opacity-70" />
                    ))}
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center max-w-xs mx-auto space-y-3">
                    <Stethoscope className="size-8 text-slate-300 dark:text-zinc-700" />
                    <p className="text-xs text-slate-500 dark:text-zinc-450 font-bold leading-normal">
                      No se encontraron especialistas en esta clínica que coincidan con la búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                    {doctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className={cn(
                            'flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer border transition-all duration-300 relative overflow-hidden shadow-sm group',
                            isSelected 
                              ? 'bg-teal-500/10 border-teal-500/30 ring-2 ring-teal-500/10' 
                              : 'bg-white/5 border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
                          )}
                          onClick={() => setSelectedDoctorId(doc.id)}
                        >
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />}
                          <Avatar className="size-11 border border-teal-500/10 shrink-0">
                            <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-black">
                              {getInitials(doc.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                                Dr. {doc.name}
                              </p>
                              {isSelected && <CheckCircle2 className="size-3.5 text-teal-500 shrink-0" />}
                            </div>
                            <p className="text-[10px] font-black text-teal-650 dark:text-teal-400 uppercase tracking-wider mt-0.5">
                              {doc.doctor_profile?.specialty || 'Médico General'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 3: Date and Time Schedule */}
          {step === 3 && (
            <motion.div key="step3" {...fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Date Calendar */}
              <div className="col-span-12 md:col-span-6">
                <GlassCard className="border border-slate-200 dark:border-white/5 shadow-xl bg-white dark:bg-zinc-950/20 rounded-[2.5rem] p-5 h-full">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 pb-3 border-b border-slate-200 dark:border-white/5 mb-4">
                    Selecciona una Fecha
                  </h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { 
                      setSelectedDate(date); 
                      setSelectedTime(null); 
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-900/10 p-3 mx-auto"
                  />
                </GlassCard>
              </div>

              {/* Time Slots viewport */}
              <div className="col-span-12 md:col-span-6">
                <GlassCard className="border border-slate-200 dark:border-white/5 shadow-xl bg-white dark:bg-zinc-950/20 rounded-[2.5rem] p-5 h-full flex flex-col justify-between min-h-[360px]">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 pb-3 border-b border-slate-200 dark:border-white/5 mb-4">
                      Horarios Disponibles
                    </h3>
                    
                    {!selectedDate ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-550 py-16 text-center space-y-2">
                        <CalendarIcon className="size-10 text-slate-350" />
                        <p className="text-xs font-black uppercase tracking-wider">Paso previo requerido</p>
                        <p className="text-[11px] text-slate-400 max-w-[200px]">Debes elegir una fecha en el calendario primero.</p>
                      </div>
                    ) : isLoadingOccupied ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <Loader2 className="size-7 text-teal-500 animate-spin" />
                        <p className="text-[11px] font-black text-slate-500 dark:text-zinc-500 mt-2 uppercase tracking-widest">Sincronizando disponibilidad...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                        {availableSlots.map(({ time, isOccupied }) => {
                          const isSelected = selectedTime === time;
                          return (
                            <button
                              key={time}
                              disabled={isOccupied}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                'flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black tracking-wider transition-all duration-350 relative overflow-hidden select-none border',
                                isSelected
                                  ? 'bg-teal-500 border-teal-500 text-white shadow-md'
                                  : isOccupied 
                                    ? 'bg-red-500/5 border-red-500/10 text-red-500/40 cursor-not-allowed opacity-50'
                                    : 'bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-650 dark:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-900/50'
                              )}
                            >
                              <Clock className="size-3 shrink-0" />
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedDate && !isLoadingOccupied && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center gap-3 text-[9px] uppercase font-black text-slate-400 dark:text-zinc-500 tracking-wider">
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-teal-500" /> Disponible</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-red-500/20" /> Ocupado</div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Confirm Appointment Details (Clinical Receipt) */}
          {step === 4 && (
            <motion.div key="step4" {...fadeInUp}>
              <GlassCard className="border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-zinc-950/20 rounded-[2.5rem] p-5 sm:p-6 max-w-md mx-auto">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 pb-3 border-b border-slate-200 dark:border-white/5 mb-6 text-center">
                  Resumen de Reserva Médica
                </h3>
                
                <div className="space-y-6">
                  {/* Doctor Info Card */}
                  <div className="flex flex-col items-center text-center p-5 rounded-3xl bg-teal-500/5 border border-teal-500/15 shadow-sm">
                    <Avatar className="size-16 mb-3 border border-teal-500/15">
                      <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-base font-black">
                        {getInitials(selectedDoctor?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none">Dr. {selectedDoctor?.name}</h4>
                    <p className="text-[10px] font-black text-teal-650 dark:text-teal-400 uppercase tracking-widest mt-1">{selectedDoctor?.doctor_profile?.specialty || 'Medicina General'}</p>
                  </div>

                  {/* Receipt Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-slate-500/[0.02] dark:bg-zinc-950/40 border border-slate-200/50 dark:border-white/5 space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Ubicación</p>
                      <p className="text-xs font-extrabold text-slate-850 dark:text-white truncate">{selectedClinic?.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate leading-relaxed">{selectedClinic?.address}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-500/[0.02] dark:bg-zinc-950/40 border border-slate-200/50 dark:border-white/5 space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Fecha y hora</p>
                      <p className="text-xs font-extrabold text-slate-850 dark:text-white">{selectedDate ? formatDate(selectedDate.toISOString(), "dd 'de' MMMM") : ''}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">{selectedTime} hrs • 30 mins</p>
                    </div>
                  </div>

                  {/* Warning banner */}
                  <div className="flex items-center gap-2 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-[10px] font-bold text-slate-600 dark:text-zinc-300">
                    <Sparkles className="size-4 text-indigo-500 shrink-0 animate-pulse" />
                    <span>Recibirás un recordatorio seguro por notificación PWA antes del horario pactado.</span>
                  </div>

                  {/* Confirm Trigger */}
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createMutation.isPending} 
                    className="w-full h-13 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
                  >
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : (
                      <>
                        <span>Confirmar Consulta</span>
                        <ArrowRight className="size-4" />
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
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
        <Button 
          variant="ghost" 
          className="rounded-full gap-1.5 px-5 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-white/5" 
          onClick={handleBack}
        >
          <ChevronLeft className="size-4" /> 
          {step === 1 ? 'Volver' : 'Anterior'}
        </Button>
        
        {step < 4 && (
          <Button 
            onClick={() => setStep(step + 1)} 
            disabled={!canProceed()} 
            className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest gap-1.5 px-6 shadow-md shadow-teal-500/10"
          >
            <span>Siguiente</span> 
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>

    </div>
  );
}
