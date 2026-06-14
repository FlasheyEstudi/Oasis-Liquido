'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import apiClient from '@/api/client';
import { checkDrugInteractions } from '@/utils/drug-interactions';
import {
  useAppointment,
  useAppointments,
  useMedicines,
  useCreateAppointment,
  useCreatePrescription,
  useUpdateAppointmentStatus,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { CreatePrescriptionLineRequest } from '@/types';
import { formatDate, getInitials } from '@/utils/helpers';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { QrCode } from '@/components/common/qr-code';
import { ErrorBlock } from '@/components/common/error-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Droplets,
  AlertTriangle,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Pill,
  QrCode as QrCodeIcon,
  CheckCircle2,
  Loader2,
  Stethoscope,
  MessageCircle,
  Clock,
  Calendar,
  Lock,
  ShieldAlert,
} from 'lucide-react';

interface PrescriptionLineForm {
  medicine_id: string;
  quantity: number;
  dosage_instructions: string;
}

export function Consultation() {
  const { selectedItemId, user, navigate, setNotification } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(selectedItemId ? 2 : 1);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(selectedItemId ?? null);

  const appointmentsQuery = useAppointments({ status: 'confirmed' });
  const allAppointments = appointmentsQuery.data?.data ?? [];

  const appointmentQuery = useAppointment(selectedAppointmentId ?? '', !!selectedAppointmentId);
  const appointment = appointmentQuery.data;

  const [medicineSearch, setMedicineSearch] = useState('');
  const medicinesQuery = useMedicines(
    medicineSearch.trim() ? { search: medicineSearch } : undefined
  );
  const medicines = medicinesQuery.data?.data ?? [];

  const [notes, setNotes] = useState('');
  const [prescriptionLines, setPrescriptionLines] = useState<PrescriptionLineForm[]>([]);
  const [createdPrescriptionQr, setCreatedPrescriptionQr] = useState<string | null>(null);

  const selectedMedIds = prescriptionLines.map((l) => l.medicine_id).filter(Boolean);
  const activeInteractions = checkDrugInteractions(selectedMedIds, medicines);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [signaturePin, setSignaturePin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isConfiguringPin, setIsConfiguringPin] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [isSettingPinLoading, setIsSettingPinLoading] = useState(false);

  // Security Lockout States (UAT-004)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== 'undefined') {
      const attempts = localStorage.getItem('signature_pin_failed_attempts');
      return attempts ? parseInt(attempts, 10) : 0;
    }
    return 0;
  });

  const [lockoutTime, setLockoutTime] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const time = localStorage.getItem('signature_pin_lockout_time');
      return time ? parseInt(time, 10) : null;
    }
    return null;
  });

  const [, setTick] = useState(0);

  useEffect(() => {
    if (lockoutTime) {
      if (Date.now() > lockoutTime) {
        setLockoutTime(null);
        setFailedAttempts(0);
        localStorage.removeItem('signature_pin_lockout_time');
        localStorage.removeItem('signature_pin_failed_attempts');
        return;
      }
      const interval = setInterval(() => {
        if (Date.now() > lockoutTime) {
          setLockoutTime(null);
          setFailedAttempts(0);
          localStorage.removeItem('signature_pin_lockout_time');
          localStorage.removeItem('signature_pin_failed_attempts');
        } else {
          setTick((t) => t + 1);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const getRemainingTimeMsg = () => {
    if (!lockoutTime) return '';
    const diff = lockoutTime - Date.now();
    if (diff <= 0) return '';
    const mins = Math.floor(diff / 60000);
    const secs = Math.ceil((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const createAppointmentMutation = useCreateAppointment();
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [followUpScheduled, setFollowUpScheduled] = useState(false);
  const createPrescriptionMutation = useCreatePrescription();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const patient = appointment?.patient;
  const patientProfile = patient?.patient_profile;

  const addPrescriptionLine = () => {
    setPrescriptionLines((prev) => [
      ...prev,
      { medicine_id: '', quantity: 1, dosage_instructions: '' },
    ]);
  };

  const removePrescriptionLine = (index: number) => {
    setPrescriptionLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePrescriptionLine = (
    index: number,
    field: keyof PrescriptionLineForm,
    value: string | number
  ) => {
    setPrescriptionLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };


  const handleScheduleFollowUp = async () => {
    if (!appointment) return;
    try {
      setIsSchedulingFollowUp(true);
      const followUpDate = new Date();
      followUpDate.setMonth(followUpDate.getMonth() + 1);

      await createAppointmentMutation.mutateAsync({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        clinic_id: appointment.clinic_id,
        date_time: followUpDate.toISOString(),
        duration_minutes: 30,
        notes: 'Cita de seguimiento automática',
      });
      setFollowUpScheduled(true);
      setNotification({ type: 'success', message: 'Cita de seguimiento agendada para 1 mes' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al agendar cita de seguimiento' });
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };

  const handleConfigurePin = async () => {
    if (signaturePin.length !== 4) {
      setPinError('El PIN debe ser exactamente de 4 dígitos');
      return;
    }
    if (!accountPassword) {
      setPinError('La contraseña de tu cuenta es requerida');
      return;
    }

    setIsSettingPinLoading(true);
    setPinError('');
    try {
      await apiClient.post('/v1/doctor/profile/pin', {
        pin: signaturePin,
        password: accountPassword,
      });
      
      setNotification({ type: 'success', message: 'PIN de firma digital configurado correctamente' });
      // Proceed to sign the prescription immediately with the newly configured PIN!
      await handleCreatePrescription(signaturePin);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || 'Error al configurar el PIN de firma';
      setPinError(errMsg);
      setNotification({ type: 'error', message: errMsg });
    } finally {
      setIsSettingPinLoading(false);
    }
  };

  const handleCreatePrescription = async (pin: string) => {
    if (!appointment) return;
    if (prescriptionLines.some((l) => !l.medicine_id)) {
      setNotification({ type: 'warning', message: 'Selecciona un medicamento para cada línea' });
      return;
    }
    try {
      const lines: CreatePrescriptionLineRequest[] = prescriptionLines.map((l) => ({
        medicine_id: l.medicine_id,
        quantity: l.quantity,
        dosage_instructions: l.dosage_instructions || undefined,
      }));

      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 3);

      const prescription = await createPrescriptionMutation.mutateAsync({
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        expiration_date: expirationDate.toISOString().split('T')[0],
        notes: notes || undefined,
        signature_pin: pin,
        lines,
      });

      // OAS-007: Route the verification URL directly to the public prescription verification screen instead of family verification
      const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verificar-receta-${prescription.id}`;
      setCreatedPrescriptionQr(verifyUrl);
      setNotification({ type: 'success', message: 'Receta firmada y emitida correctamente' });
      setPinModalOpen(false);
      setIsConfiguringPin(false);
      setAccountPassword('');
      setSignaturePin('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err?.message || 'PIN de firma incorrecto o perfil no verificado';
      
      if (errMsg === 'PIN_NOT_CONFIGURED') {
        setIsConfiguringPin(true);
        setPinError('Parece que es tu primera receta. Configura tu PIN de firma de 4 dígitos ingresando tu contraseña de cuenta.');
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem('signature_pin_failed_attempts', nextAttempts.toString());
        
        if (nextAttempts >= 3) {
          const lockUntil = Date.now() + 15 * 60 * 1000;
          setLockoutTime(lockUntil);
          localStorage.setItem('signature_pin_lockout_time', lockUntil.toString());
          setPinError(`⚠️ BLOQUEO DE SEGURIDAD: Has ingresado el PIN incorrecto 3 veces. Tu firma digital ha sido suspendida por 15 minutos.`);
        } else {
          setPinError(`${errMsg}. Intento ${nextAttempts} de 3.`);
        }
        setNotification({ type: 'error', message: errMsg });
      }
    }
  };

  const handleFinishConsultation = async () => {
    if (!appointment) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: appointment.id,
        data: { status: 'completed' },
      });
      setNotification({ type: 'success', message: 'Consulta finalizada' });
      setStep(4);
    } catch {
      setNotification({ type: 'error', message: 'No se pudo finalizar la consulta' });
    }
  };

  // Step 1: Select appointment
  if (step === 1) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('inicio')} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Nueva Consulta</h1>
            <p className="text-sm text-muted-foreground">Selecciona una cita confirmada</p>
          </div>
        </div>

        {appointmentsQuery.isLoading ? (
          <div className="space-y-3">
            <div className="shimmer h-20 rounded-3xl w-full" />
            <div className="shimmer h-20 rounded-3xl w-full" />
          </div>
        ) : appointmentsQuery.isError ? (
          <ErrorBlock
            message={getHookErrorMessage(appointmentsQuery.error)}
            onRetry={() => appointmentsQuery.refetch()}
          />
        ) : allAppointments.length === 0 ? (
          <ErrorBlock
            message="No hay citas confirmadas para iniciar consulta"
            onRetry={() => appointmentsQuery.refetch()}
          />
        ) : (
          <div className="space-y-3">
            {allAppointments.map((apt) => (
              <GlassCard
                key={apt.id}
                hover
                onClick={() => {
                  setSelectedAppointmentId(apt.id);
                  setStep(2);
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                      {apt.patient ? getInitials(apt.patient.name) : 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {apt.patient?.name || 'Paciente'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDate(apt.date_time, "dd/MM/yyyy 'a las' HH:mm")}
                      <span>•</span>
                      <span>{apt.clinic?.name || 'Clínica'}</span>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} type="appointment" />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (appointmentQuery.isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="bento-grid">
          <div className="col-span-full lg:col-span-4 shimmer h-64 rounded-3xl" />
          <div className="col-span-full lg:col-span-8 shimmer h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <div className="p-4 md:p-6">
        <ErrorBlock
          message={appointmentQuery.isError ? getHookErrorMessage(appointmentQuery.error) : 'No se encontró la cita'}
          onRetry={() => appointmentQuery.refetch()}
        />
      </div>
    );
  }

  // Step 4: Done
  if (step === 4) {
    return (
      <div className="p-4 md:p-6">
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-4">
            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Consulta Finalizada</h2>
          <p className="text-sm text-muted-foreground mb-6">
            La consulta ha sido marcada como completada.
          </p>
          <div className="space-y-3">
            {!followUpScheduled ? (
              <Button
                variant="outline"
                className="w-full rounded-full gap-2 border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                onClick={handleScheduleFollowUp}
                disabled={isSchedulingFollowUp}
              >
                {isSchedulingFollowUp ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                Agendar Seguimiento (1 mes)
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-teal-600 dark:text-teal-400 bg-teal-500/10 p-2 rounded-full">
                <CheckCircle2 className="size-4" />
                Seguimiento agendado
              </div>
            )}
            <Button
              className="glass-btn-primary w-full rounded-full"
              onClick={() => navigate('inicio')}
            >
              Volver al inicio
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('inicio')} className="rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Consulta médica</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(appointment.date_time, "dd/MM/yyyy 'a las' HH:mm")}
          </p>
        </div>
        <StatusBadge status={appointment.status} type="appointment" />
      </div>

      <div className="bento-grid">
        {/* Left Column - Patient Info */}
        <div className="col-span-full lg:col-span-4 space-y-4">
          {/* Patient Card */}
          <GlassCard>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Paciente</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-lg font-semibold">
                    {patient ? getInitials(patient.name) : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {patient?.name || 'Paciente'}
                  </p>
                  <p className="text-xs text-muted-foreground">{patient?.email}</p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl gap-2 mt-2 bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20"
                onClick={() => {
                  const phone = patient?.phone;
                  if (!phone) {
                    setNotification({ type: 'error', message: 'El paciente no tiene número de teléfono registrado' });
                    return;
                  }
                  const message = `Hola, soy el Dr. ${user?.name || ''}. Iniciemos su consulta médica por telemedicina:`;
                  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="size-4" />
                Iniciar Telemedicina (WhatsApp)
              </Button>

              <Separator className="opacity-50" />

              <div className="space-y-3">
                {patientProfile?.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Edad:</span>
                    <span className="font-medium text-foreground">
                      {Math.floor(
                        (Date.now() - new Date(patientProfile.date_of_birth).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )}{' '}
                      años
                    </span>
                  </div>
                )}
                {patientProfile?.blood_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="size-4 text-red-400" />
                    <span className="text-muted-foreground">Tipo de sangre:</span>
                    <Badge
                      variant="outline"
                      className="border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"
                    >
                      {patientProfile.blood_type}
                    </Badge>
                  </div>
                )}
              </div>

              {patientProfile?.allergies && patientProfile.allergies.length > 0 && (
                <>
                  <Separator className="opacity-50" />
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="size-4" />
                      Alergias
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {patientProfile.allergies.map((allergy, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {patientProfile?.medical_notes && (
                <>
                  <Separator className="opacity-50" />
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
                      <FileText className="size-4 text-muted-foreground" />
                      Notas médicas
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patientProfile.medical_notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Clinic Info */}
          {appointment.clinic && (
            <GlassCard>
              <p className="text-xs text-muted-foreground">Clínica</p>
              <p className="text-sm font-medium text-foreground">
                {appointment.clinic.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.clinic.address}
              </p>
            </GlassCard>
          )}
        </div>

        {/* Right Column - Consultation Form */}
        <div className="col-span-full lg:col-span-8 space-y-4">
          {/* Step navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant={step === 2 ? 'default' : 'outline'}
              className={cn(
                'rounded-full text-sm',
                step === 2 && 'bg-teal-600 hover:bg-teal-700 text-white',
              )}
              onClick={() => setStep(2)}
              size="sm"
            >
              <Stethoscope className="size-3.5 mr-1" />
              Info del paciente
            </Button>
            <Button
              variant={step === 3 ? 'default' : 'outline'}
              className={cn(
                'rounded-full text-sm',
                step === 3 && 'bg-teal-600 hover:bg-teal-700 text-white',
              )}
              onClick={() => setStep(3)}
              size="sm"
            >
              <Pill className="size-3.5 mr-1" />
              Receta médica
            </Button>
          </div>

          {/* Step 2: Notes */}
          {step === 2 && (
            <GlassCard>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Notas de consulta
              </h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Añadir notas sobre la consulta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="glass-input rounded-2xl resize-none"
                />
                <Button
                  className="glass-btn-primary rounded-full"
                  onClick={() => setStep(3)}
                >
                  Continuar a receta
                </Button>
              </div>
            </GlassCard>
          )}

          {/* Step 3: Prescription */}
          {step === 3 && (
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Pill className="size-4" />
                  Receta médica
                </h3>
                {!createdPrescriptionQr && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addPrescriptionLine}
                    className="rounded-full gap-1"
                  >
                    <Plus className="size-3" />
                    Agregar medicamento
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Alertas de interacciones medicamentosas */}
                {activeInteractions.length > 0 && !createdPrescriptionQr && (
                  <div className="space-y-2">
                    {activeInteractions.map((interaction, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-2xl p-4 border flex gap-3 text-xs",
                          interaction.severity === 'critical'
                            ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        <ShieldAlert className="size-5 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-bold uppercase tracking-wider text-[10px]">
                            {interaction.severity === 'critical' ? 'Interacción Crítica' : 'Interacción Moderada'}
                          </p>
                          <p className="font-medium">
                            {interaction.medicineA.name} + {interaction.medicineB.name}
                          </p>
                          <p className="text-muted-foreground leading-relaxed mt-1">
                            {interaction.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {prescriptionLines.length === 0 && !createdPrescriptionQr && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay medicamentos en la receta. Haz clic en &quot;Agregar medicamento&quot; para añadir.
                  </p>
                )}

                {prescriptionLines.map((line, index) => (
                  <div
                    key={index}
                    className="glass-input rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Medicamento {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-full"
                        onClick={() => removePrescriptionLine(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Medicamento</Label>
                        <Select
                          value={line.medicine_id}
                          onValueChange={(val) =>
                            updatePrescriptionLine(index, 'medicine_id', val)
                          }
                        >
                          <SelectTrigger className="glass-input rounded-xl">
                            <SelectValue placeholder="Buscar medicamento..." />
                          </SelectTrigger>
                          <SelectContent>
                            {medicines.map((med) => (
                              <SelectItem key={med.id} value={med.id}>
                                {med.name} {med.strength && `(${med.strength})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updatePrescriptionLine(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="glass-input rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Instrucciones de dosificación</Label>
                      <Input
                        placeholder="Ej: 1 tableta cada 8 horas"
                        value={line.dosage_instructions}
                        onChange={(e) =>
                          updatePrescriptionLine(index, 'dosage_instructions', e.target.value)
                        }
                        className="glass-input rounded-xl"
                      />
                    </div>
                  </div>
                ))}

                {/* Prescription QR */}
                {createdPrescriptionQr && (
                  <div className="flex flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <CheckCircle2 className="mb-2 size-8 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="mb-4 font-semibold text-emerald-700 dark:text-emerald-400">
                      Receta emitida correctamente
                    </h3>
                    <QrCode value={createdPrescriptionQr} size={180} />
                  </div>
                )}

                {/* Emit Prescription Button */}
                {prescriptionLines.length > 0 && !createdPrescriptionQr && (
                  <div className="space-y-2 w-full">
                    {activeInteractions.some(i => i.severity === 'critical') && notes.trim().length < 15 && (
                      <div className="flex items-start gap-2 text-[10px] text-amber-500 font-bold bg-amber-500/10 p-3 rounded-2xl leading-normal border border-amber-500/20 text-left">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>⚠️ ALERTA DE SEGURIDAD: Existen interacciones CRÍTICAS. Debes ingresar una Justificación Médica explícita en las Notas de Consulta (mínimo 15 caracteres) para poder firmar.</span>
                      </div>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.96, y: 2 }}
                      className={cn(
                        "w-full py-4 rounded-3xl font-black uppercase tracking-widest text-xs transition-all duration-300 border relative overflow-hidden flex items-center justify-center gap-2 select-none shadow-xl cursor-pointer",
                        activeInteractions.some(i => i.severity === 'critical') && notes.trim().length < 15
                          ? "bg-slate-700 border-slate-650 text-gray-500 cursor-not-allowed shadow-none"
                          : "bg-emerald-500 hover:brightness-110 text-white shadow-[0_6px_0_#047857,0_12px_20px_rgba(16,185,129,0.3)] active:shadow-[0_2px_0_#047857] border-emerald-400/30"
                      )}
                      onClick={() => {
                        if (prescriptionLines.some((l) => !l.medicine_id)) {
                          setNotification({ type: 'warning', message: 'Selecciona un medicamento para cada línea' });
                          return;
                        }
                        if (activeInteractions.some(i => i.severity === 'critical') && notes.trim().length < 15) {
                          setNotification({ type: 'error', message: 'Falta justificación médica en las notas para interacciones críticas' });
                          return;
                        }
                        setSignaturePin('');
                        setPinError('');
                        setPinModalOpen(true);
                      }}
                      disabled={createPrescriptionMutation.isPending || (activeInteractions.some(i => i.severity === 'critical') && notes.trim().length < 15)}
                    >
                      {!createPrescriptionMutation.isPending && (
                        <motion.span 
                          initial={{ x: -100 }} 
                          animate={{ x: '100%' }} 
                          transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                          className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        />
                      )}
                      <QrCodeIcon className="size-4.5 shrink-0" />
                      <span>✍️ Firmar y Sellar Receta MINSA</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Finish Consultation */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('inicio')} className="rounded-full">
              Volver
            </Button>
            <Button
              className="glass-btn-primary rounded-full"
              onClick={handleFinishConsultation}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Finalizar consulta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Signature PIN Verification Modal (Fase 5) */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative premium glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="size-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-pulse">
                  <Lock className="size-8" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {isConfiguringPin ? 'Configurar PIN de Firma' : 'Firma Digital Requerida'}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {isConfiguringPin 
                    ? 'Para tu seguridad y cumplimiento legal, ingresa la contraseña de tu cuenta de Oasis para guardar tu nuevo PIN de 4 dígitos.' 
                    : `Por favor, ingresa tu PIN de firma digital para firmar electrónicamente la receta de `}
                  {!isConfiguringPin && <span className="font-bold text-teal-400">{patient?.name}</span>}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {isConfiguringPin ? 'Nuevo PIN de 4 dígitos' : 'PIN de Firma Digital'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={signaturePin}
                    onChange={(e) => {
                      setSignaturePin(e.target.value.replace(/\D/g, ''));
                      if (pinError) setPinError('');
                    }}
                    disabled={!!lockoutTime}
                    className="w-full h-12 text-center text-lg tracking-[0.5em] bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono disabled:opacity-50"
                  />
                </div>

                {isConfiguringPin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contraseña de tu Cuenta</label>
                    <input
                      type="password"
                      placeholder="Contraseña de Oasis"
                      value={accountPassword}
                      onChange={(e) => {
                        setAccountPassword(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      disabled={!!lockoutTime}
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm disabled:opacity-50"
                    />
                  </div>
                )}

                {pinError && (
                  <div className="flex items-start gap-1.5 text-[10px] text-red-400 font-bold mt-1 bg-red-500/10 p-2.5 rounded-xl leading-normal text-left">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-gray-400 hover:text-white" 
                  onClick={() => {
                    setPinModalOpen(false);
                    setPinError('');
                    setIsConfiguringPin(false);
                    setAccountPassword('');
                    setSignaturePin('');
                  }}
                  disabled={createPrescriptionMutation.isPending || isSettingPinLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold"
                  disabled={
                    !!lockoutTime ||
                    signaturePin.trim().length !== 4 || 
                    (isConfiguringPin && !accountPassword) || 
                    createPrescriptionMutation.isPending || 
                    isSettingPinLoading
                  }
                  onClick={isConfiguringPin ? handleConfigurePin : () => handleCreatePrescription(signaturePin)}
                >
                  {lockoutTime ? `Bloqueado (${getRemainingTimeMsg()})` : (createPrescriptionMutation.isPending || isSettingPinLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Procesando...
                    </>
                  ) : (
                    isConfiguringPin ? 'Configurar y Firmar' : 'Firmar Receta'
                  ))}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
