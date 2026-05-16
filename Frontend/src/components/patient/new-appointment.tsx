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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Stethoscope,
  CalendarIcon,
  MapPin,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const STEPS = [
  { number: 1, label: 'Clínica' },
  { number: 2, label: 'Médico' },
  { number: 3, label: 'Fecha y hora' },
  { number: 4, label: 'Confirmar' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function NewAppointment() {
  const { navigate, setNotification } = useAuthStore();
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
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  // Step 4: Submit
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

      await createMutation.mutateAsync({
        doctor_id: selectedDoctorId,
        clinic_id: selectedClinicId,
        date_time: dateTime.toISOString(),
        duration_minutes: 30,
      });

      setNotification({ type: 'success', message: 'Cita agendada correctamente' });
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1">
        {STEPS.map((s, idx) => (
          <div key={s.number} className="flex items-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all',
                step >= s.number
                  ? 'glass-btn-primary text-white'
                  : 'glass text-muted-foreground'
              )}
            >
              {step > s.number ? (
                <CheckCircle className="size-5" />
              ) : (
                s.number
              )}
            </motion.div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-8 sm:w-12 transition-colors',
                  step > s.number ? 'bg-teal-500' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-center gap-1 sm:gap-4 text-xs text-muted-foreground">
        {STEPS.map((s) => (
          <span
            key={s.number}
            className={cn(
              'w-16 sm:w-20 text-center transition-colors',
              step === s.number ? 'font-semibold text-teal-600 dark:text-teal-400' : ''
            )}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" {...fadeInUp} transition={{ duration: 0.25 }}>
            <div className="bento-grid">
              <div className="col-span-8">
                <GlassCard className="min-h-[300px]">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Selecciona una clínica</h3>
                  {clinicsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="shimmer rounded-2xl h-16" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {clinics.map((clinic) => (
                        <div
                          key={clinic.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all',
                            selectedClinicId === clinic.id ? 'bg-teal-500/10 ring-2 ring-teal-500/30' : 'hover:bg-muted/50'
                          )}
                          onClick={() => handleClinicSelect(clinic.id)}
                        >
                          <div className={cn('flex size-11 items-center justify-center rounded-full', selectedClinicId === clinic.id ? 'bg-teal-500/20' : 'bg-muted')}>
                            <Building2 className={cn('size-5', selectedClinicId === clinic.id ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{clinic.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{clinic.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>
              <div className="col-span-4">
                <GlassCard className="!p-3">
                  <MapView
                    markers={selectedClinic ? [{ id: selectedClinic.id, lat: selectedClinic.latitude, lng: selectedClinic.longitude, type: 'clinic', label: selectedClinic.name }] : clinics.map(c => ({ id: c.id, lat: c.latitude, lng: c.longitude, type: 'clinic', label: c.name }))}
                    center={[selectedClinic?.latitude ?? DEFAULT_LAT, selectedClinic?.longitude ?? DEFAULT_LNG]}
                    height="280px"
                    zoom={selectedClinic ? 15 : 12}
                  />
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" {...fadeInUp} transition={{ duration: 0.25 }}>
            <GlassCard className="min-h-[400px]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Selecciona un médico</h3>
                <Input
                  placeholder="Buscar médico..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="glass-input rounded-full max-w-xs h-9 text-sm"
                />
              </div>
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all',
                      selectedDoctorId === doc.id ? 'bg-teal-500/10 ring-2 ring-teal-500/30' : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedDoctorId(doc.id)}
                  >
                    <Avatar><AvatarFallback>{getInitials(doc.name)}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Dr. {doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.doctor_profile?.specialty || 'Medicina General'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" {...fadeInUp} transition={{ duration: 0.25 }}>
            <div className="bento-grid">
              <div className="col-span-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Fecha</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-2xl border bg-white/5"
                  />
                </GlassCard>
              </div>
              <div className="col-span-6">
                <GlassCard className="min-h-[300px] flex flex-col">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Hora disponible</h3>
                  {!selectedDate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <CalendarIcon className="size-10 mb-2" />
                      <p className="text-sm">Selecciona una fecha primero</p>
                    </div>
                  ) : isLoadingOccupied ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <Loader2 className="size-8 text-teal-600 animate-spin" />
                      <p className="text-xs text-muted-foreground mt-2">Buscando horarios...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map(({ time, isOccupied }) => (
                        <button
                          key={time}
                          disabled={isOccupied}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-all relative overflow-hidden',
                            selectedTime === time
                              ? 'glass-btn-primary text-white'
                              : isOccupied 
                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20'
                                : 'glass text-muted-foreground hover:text-foreground'
                          )}
                          onClick={() => setSelectedTime(time)}
                        >
                          {isOccupied && <div className="absolute inset-0 bg-red-500/5 backdrop-grayscale" />}
                          <Clock className="size-3.5" />
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedDate && !isLoadingOccupied && (
                    <div className="mt-4 flex items-center gap-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-teal-500" /> Disponible</div>
                      <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-red-500/30 border border-red-500/20" /> Ocupado</div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" {...fadeInUp} transition={{ duration: 0.25 }}>
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-6 text-center">Confirma tu cita</h3>
              <div className="max-w-md mx-auto space-y-6">
                <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-teal-500/5 border border-teal-500/10">
                  <Avatar className="size-20 mb-4 border-2 border-teal-500/20">
                    <AvatarFallback className="text-xl">{getInitials(selectedDoctor?.name || '')}</AvatarFallback>
                  </Avatar>
                  <h4 className="text-xl font-bold text-foreground">Dr. {selectedDoctor?.name}</h4>
                  <p className="text-teal-600 dark:text-teal-400 font-medium">{selectedDoctor?.doctor_profile?.specialty || 'Medicina General'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl glass space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ubicación</p>
                    <p className="text-sm font-semibold truncate">{selectedClinic?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedClinic?.address}</p>
                  </div>
                  <div className="p-4 rounded-2xl glass space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Horario</p>
                    <p className="text-sm font-semibold">{selectedDate ? formatDate(selectedDate.toISOString(), "dd 'de' MMMM") : ''}</p>
                    <p className="text-xs text-muted-foreground">{selectedTime} hrs • 30 min</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createMutation.isPending} 
                  className="w-full glass-btn-primary rounded-full h-14 text-lg font-bold shadow-xl shadow-teal-500/20"
                >
                  {createMutation.isPending ? <Loader2 className="size-6 animate-spin" /> : 'CONFIRMAR CITA'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" className="rounded-full gap-2 px-6" onClick={handleBack}>
          <ChevronLeft className="size-4" /> {step === 1 ? 'Cancelar' : 'Anterior'}
        </Button>
        {step < 4 && (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="glass-btn-primary rounded-full gap-2 px-8">
            Siguiente <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
