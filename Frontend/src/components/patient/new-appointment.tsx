'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useClinics,
  useClinicDoctors,
  useCreateAppointment,
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
  ArrowLeft,
  Search,
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

  // Step 4: Submit
  const createMutation = useCreateAppointment();

  // Map markers for selected clinic
  const clinicMarkers: MapMarker[] = selectedClinic
    ? [{ id: selectedClinic.id, lat: selectedClinic.latitude, lng: selectedClinic.longitude, type: 'clinic', label: selectedClinic.name }]
    : clinics.map((c) => ({ id: c.id, lat: c.latitude, lng: c.longitude, type: 'clinic' as const, label: c.name }));

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
    } catch {
      setNotification({ type: 'error', message: 'No se pudo agendar la cita' });
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
      {/* Step Indicator — Glass pills */}
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
        {/* Step 1: Select Clinic */}
        {step === 1 && (
          <motion.div key="step1" {...fadeInUp} transition={{ duration: 0.25 }}>
            <div className="bento-grid">
              {/* Clinic list */}
              <div className="col-span-8">
                <GlassCard className="min-h-[300px]">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Selecciona una clínica</h3>
                  {clinicsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="shimmer rounded-2xl h-16" />
                      ))}
                    </div>
                  ) : clinicsQuery.isError ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        {getHookErrorMessage(clinicsQuery.error)}
                      </p>
                      <Button variant="outline" className="rounded-full" onClick={() => clinicsQuery.refetch()}>
                        Reintentar
                      </Button>
                    </div>
                  ) : clinics.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Building2 className="size-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No hay clínicas disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {clinics.map((clinic) => (
                        <motion.div
                          key={clinic.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all',
                            selectedClinicId === clinic.id
                              ? 'bg-teal-500/10 ring-2 ring-teal-500/30'
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => handleClinicSelect(clinic.id)}
                        >
                          <div className={cn(
                            'flex size-11 items-center justify-center rounded-full',
                            selectedClinicId === clinic.id ? 'bg-teal-500/20' : 'bg-muted'
                          )}>
                            <Building2 className={cn(
                              'size-5',
                              selectedClinicId === clinic.id
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-muted-foreground'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{clinic.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="size-3" />
                              {clinic.address}
                            </p>
                          </div>
                          {selectedClinicId === clinic.id && (
                            <CheckCircle className="size-5 text-teal-600 dark:text-teal-400 shrink-0" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Clinic map preview */}
              <div className="col-span-4">
                <GlassCard className="!p-3">
                  <MapView
                    markers={clinicMarkers}
                    center={[selectedClinic?.latitude ?? DEFAULT_LAT, selectedClinic?.longitude ?? DEFAULT_LNG]}
                    height="280px"
                    zoom={selectedClinic ? 15 : 12}
                    showUserLocation
                  />
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <motion.div key="step2" {...fadeInUp} transition={{ duration: 0.25 }}>
            <GlassCard className="min-h-[400px]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Selecciona un médico</h3>
                  <p className="text-sm text-muted-foreground">
                    Médicos disponibles en {selectedClinic?.name}
                  </p>
                </div>
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar médico..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="glass-input rounded-full pl-9 pr-4 py-1.5 h-9 text-sm"
                  />
                </div>
              </div>
              {doctorsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="shimmer rounded-2xl h-16" />
                  ))}
                </div>
              ) : doctorsQuery.isError ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {getHookErrorMessage(doctorsQuery.error)}
                  </p>
                  <Button variant="outline" className="rounded-full" onClick={() => doctorsQuery.refetch()}>
                    Reintentar
                  </Button>
                </div>
              ) : doctors.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Stethoscope className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No hay médicos disponibles en esta clínica</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {doctors.map((doc, index) => {
                    const doctorId = doc.user_id;
                    return (
                      <motion.div
                        key={doctorId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all',
                          selectedDoctorId === doctorId
                            ? 'bg-teal-500/10 ring-2 ring-teal-500/30'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedDoctorId(doctorId)}
                      >
                        <Avatar className="size-11">
                          <AvatarFallback className={cn(
                            'text-sm font-semibold',
                            selectedDoctorId === doctorId
                              ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {doc.doctor_profile?.specialty ? doc.doctor_profile.specialty.slice(0, 2).toUpperCase() : 'MG'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Dr. {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Stethoscope className="size-3" />
                            {doc.doctor_profile?.specialty || 'Medicina General'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Stethoscope className="size-3" />
                            Cédula: {doc.doctor_profile?.license_number || '—'}
                          </p>
                        </div>
                        {selectedDoctorId === doctorId && (
                          <CheckCircle className="size-5 text-teal-600 dark:text-teal-400 shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <motion.div key="step3" {...fadeInUp} transition={{ duration: 0.25 }}>
            <div className="bento-grid">
              {/* Date Picker */}
              <div className="col-span-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Fecha</h3>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal rounded-full glass-input',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {selectedDate
                          ? formatDate(selectedDate.toISOString(), "dd 'de' MMMM, yyyy")
                          : 'Selecciona una fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl glass-strong" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </GlassCard>
              </div>

              {/* Time Slots */}
              <div className="col-span-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Hora disponible</h3>
                  {selectedDate ? (
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((time, i) => (
                        <motion.button
                          key={time}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-all',
                            selectedTime === time
                              ? 'glass-btn-primary text-white'
                              : 'glass text-muted-foreground hover:text-foreground'
                          )}
                          onClick={() => setSelectedTime(time)}
                        >
                          <Clock className="size-3.5" />
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Selecciona una fecha primero
                    </p>
                  )}
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <motion.div key="step4" {...fadeInUp} transition={{ duration: 0.25 }}>
            <div className="bento-grid">
              {/* Doctor & appointment details */}
              <div className="col-span-8">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Confirma tu cita</h3>
                  <div className="rounded-2xl bg-teal-500/5 dark:bg-teal-500/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-14">
                        <AvatarFallback className="bg-teal-500/20 text-teal-600 dark:text-teal-400 text-lg font-semibold">
                          {selectedDoctor?.doctor_profile?.specialty ? selectedDoctor.doctor_profile.specialty.slice(0, 2).toUpperCase() : 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          Dr. {selectedDoctor?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor?.doctor_profile?.specialty || 'Medicina General'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor?.doctor_profile?.license_number && `Cédula: ${selectedDoctor.doctor_profile.license_number}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedClinic?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="size-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedClinic?.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {selectedDate
                            ? formatDate(selectedDate.toISOString(), "dd 'de' MMMM, yyyy")
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedTime} hrs • 30 min</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Clinic map */}
              <div className="col-span-4">
                <GlassCard className="!p-3">
                  {selectedClinic && (
                    <MapView
                      markers={[{ id: selectedClinic.id, lat: selectedClinic.latitude, lng: selectedClinic.longitude, type: 'clinic', label: selectedClinic.name }]}
                      center={[selectedClinic.latitude, selectedClinic.longitude]}
                      height="200px"
                      zoom={15}
                      showUserLocation
                    />
                  )}
                </GlassCard>
              </div>

              {/* Submit button */}
              <div className="col-span-12">
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="w-full glass-btn-primary rounded-full h-12 text-base"
                >
                  {createMutation.isPending ? 'Agendando...' : 'Confirmar cita'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          className="rounded-full gap-1"
          onClick={handleBack}
        >
          <ChevronLeft className="size-4" />
          {step === 1 ? 'Volver a Citas' : 'Anterior'}
        </Button>
        {step < 4 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="glass-btn-primary rounded-full gap-1"
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
