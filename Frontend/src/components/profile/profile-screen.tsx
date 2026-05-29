'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useGetMe, useUpdateMe, useUpdatePatientProfile, useFamily, useCreateFamily, useDeleteFamily, useVerifyFamily, getHookErrorMessage } from '@/hooks/use-api';
import { getInitials } from '@/utils/helpers';
import { ROLE_LABELS, ROLE_COLORS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode } from '@/components/common/qr-code';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Droplets,
  AlertTriangle,
  FileText,
  Stethoscope,
  Award,
  Car,
  Hash,
  Save,
  Loader2,
  Shield,
  LogOut,
  Lock,
  Pencil,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Zap,
  Leaf,
  Sparkles,
  Bike,
  Route,
  Activity,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfileScreen() {
  const { user: authUser, setUser, setNotification, logout } = useAuthStore();

  // React Query hooks
  const { data: profile, isLoading, error, refetch } = useGetMe(!!authUser);
  const updateMeMutation = useUpdateMe();
  const updatePatientMutation = useUpdatePatientProfile();

  // Common fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');

  // Patient fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Delivery Driver fields
  const [vehicleType, setVehicleType] = useState('Motocicleta');
  const [licensePlate, setLicensePlate] = useState('M 104-582');
  const [vehicleBrand, setVehicleBrand] = useState('Suzuki AX100');
  const [insuranceStatus, setInsuranceStatus] = useState('Vigente');

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Family states
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyRelation, setFamilyRelation] = useState<'padre' | 'madre' | 'hijo' | 'conyuge' | 'tutor' | 'otro'>('padre');
  const [isLinking, setIsLinking] = useState(false);

  const familyQuery = useFamily(authUser?.role === 'patient');
  const createFamilyMutation = useCreateFamily();
  const deleteFamilyMutation = useDeleteFamily();
  const verifyFamilyMutation = useVerifyFamily();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const handleVerifyFamily = async (code: string, relationshipId: string) => {
    if (!code.trim() || code.trim().length !== 6) {
      toast.error('El código PIN de verificación debe ser de 6 dígitos');
      return;
    }
    setIsVerifying(relationshipId);
    try {
      const res = await verifyFamilyMutation.mutateAsync(code.trim());
      toast.success(`Vinculación con ${res.supervisorName} confirmada de forma exitosa.`);
      setVerificationCode('');
      setIsVerifying(null);
    } catch (err: any) {
      toast.error(getHookErrorMessage(err) || 'El código PIN ingresado es incorrecto o ya expiró');
      setIsVerifying(null);
    }
  };

  // QR Zoom State
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Populate fields when profile loads
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.name);
      setPhone(profile.phone || '');
      if (profile.patient_profile) {
        setDateOfBirth(profile.patient_profile.date_of_birth || '');
        setBloodType(profile.patient_profile.blood_type || '');
        setAllergies(profile.patient_profile.allergies?.join(', ') || '');
        setMedicalNotes(profile.patient_profile.medical_notes || '');
      }
      if (profile.role === 'delivery_driver') {
        if (profile.delivery_driver_profile) {
          setVehicleType(profile.delivery_driver_profile.vehicle_type || 'Motocicleta');
          setLicensePlate(profile.delivery_driver_profile.license_plate || 'M 104-582');
        }
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('oasis_driver_profile');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.vehicleType) setVehicleType(parsed.vehicleType);
              if (parsed.licensePlate) setLicensePlate(parsed.licensePlate);
              if (parsed.vehicleBrand) setVehicleBrand(parsed.vehicleBrand);
              if (parsed.insuranceStatus) setInsuranceStatus(parsed.insuranceStatus);
            }
          } catch (e) {
            console.warn('Error reading driver profile cache:', e);
          }
        }
      }
      setInitialized(true);
    }
  }, [profile, initialized]);

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError('El nombre es obligatorio');
      valid = false;
    } else {
      setNameError('');
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validate() || !profile) return;

    try {
      const updatedUser = await updateMeMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      // Update patient profile if applicable
      if (profile.role === 'patient') {
        await updatePatientMutation.mutateAsync({
          date_of_birth: dateOfBirth || undefined,
          blood_type: bloodType || undefined,
          allergies: allergies
            ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
            : [],
          medical_notes: medicalNotes.trim() || undefined,
        });
      }

      const finalUser = {
        ...updatedUser,
        role: profile.role,
      };

      if (profile.role === 'delivery_driver') {
        finalUser.delivery_driver_profile = {
          user_id: profile.id,
          vehicle_type: vehicleType,
          license_plate: licensePlate.toUpperCase(),
          is_available: profile.delivery_driver_profile?.is_available ?? true,
          pharmacy_id: profile.delivery_driver_profile?.pharmacy_id,
          current_lat: profile.delivery_driver_profile?.current_lat,
          current_lng: profile.delivery_driver_profile?.current_lng,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('oasis_driver_profile', JSON.stringify({
            vehicleType,
            licensePlate: licensePlate.toUpperCase(),
            vehicleBrand,
            insuranceStatus,
          }));
        }
      }

      setUser(finalUser);
      setNotification({ type: 'success', message: 'Perfil actualizado correctamente' });
      setIsEditing(false);
    } catch (err) {
      setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al actualizar perfil' });
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || '');
      if (profile.patient_profile) {
        setDateOfBirth(profile.patient_profile.date_of_birth || '');
        setBloodType(profile.patient_profile.blood_type || '');
        setAllergies(profile.patient_profile.allergies?.join(', ') || '');
        setMedicalNotes(profile.patient_profile.medical_notes || '');
      }
      if (profile.role === 'delivery_driver') {
        if (profile.delivery_driver_profile) {
          setVehicleType(profile.delivery_driver_profile.vehicle_type || 'Motocicleta');
          setLicensePlate(profile.delivery_driver_profile.license_plate || 'M 104-582');
        }
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('oasis_driver_profile');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.vehicleType) setVehicleType(parsed.vehicleType);
              if (parsed.licensePlate) setLicensePlate(parsed.licensePlate);
              if (parsed.vehicleBrand) setVehicleBrand(parsed.vehicleBrand);
              if (parsed.insuranceStatus) setInsuranceStatus(parsed.insuranceStatus);
            }
          } catch (e) {}
        }
      }
    }
    setIsEditing(false);
    setNameError('');
  };

  const handleLinkFamily = async () => {
    if (!familyEmail.trim()) {
      toast.error('Ingresa un correo electrónico');
      return;
    }
    setIsLinking(true);
    try {
      await createFamilyMutation.mutateAsync({
        patient_email: familyEmail.trim(),
        relationship: familyRelation,
      });
      toast.success('Familiar vinculado exitosamente');
      setFamilyEmail('');
    } catch (err) {
      toast.error(getHookErrorMessage(err) || 'Error al vincular familiar');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkFamily = async (id: string) => {
    try {
      toast.loading('Desvinculando familiar...', { id: 'unlink-family' });
      await deleteFamilyMutation.mutateAsync(id);
      toast.success('Familiar desvinculado con éxito', { id: 'unlink-family' });
    } catch (err) {
      toast.error(getHookErrorMessage(err) || 'Error al desvincular familiar', { id: 'unlink-family' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-6">
        <div className="shimmer rounded-3xl h-48" />
        <div className="shimmer rounded-3xl h-64" />
        <div className="shimmer rounded-3xl h-32" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-[2.5rem] bg-red-500/[0.03] border border-red-500/10 p-8 text-center max-w-2xl mx-auto backdrop-blur-md">
        <Shield className="size-12 text-red-500/50 mx-auto mb-3" />
        <h3 className="text-lg font-black tracking-tight mb-1">Sin datos</h3>
        <p className="text-sm text-muted-foreground mb-4">{getHookErrorMessage(error) || 'No se pudo cargar el perfil'}</p>
        <button onClick={() => refetch()} className="rounded-full px-6 py-2.5 text-xs font-black uppercase bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-zinc-300">Reintentar</button>
      </div>
    );
  }

  const role = profile.role;
  const roleConfig = ROLE_COLORS[role];
  const isSaving = updateMeMutation.isPending || updatePatientMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-1 sm:px-0 relative overflow-visible">
      {/* Absolute Ambient Glow */}
      <div className="absolute top-[5%] left-[-15%] size-80 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Dynamic Digital Healthcare Passport */}
      <div className="relative overflow-hidden border border-slate-200/60 dark:border-white/5 bg-white/10 dark:bg-zinc-950/20 shadow-2xl rounded-[3rem] p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-teal-500/[0.04] to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Verification seal */}
        <div className="absolute -left-10 -bottom-10 size-32 rounded-full border border-teal-500/5 bg-teal-500/[0.01] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full">
            <div className="relative group/avatar">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 opacity-60 blur-md group-hover/avatar:opacity-80 transition-opacity animate-pulse" />
              <div className="relative flex size-24 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-900 p-1 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-500 shadow-inner">
                  <span className="text-3xl font-black text-white tracking-widest font-serif">
                    {getInitials(name || profile.name)}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-2 flex-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-805 dark:text-white tracking-tight leading-tight flex items-center justify-center sm:justify-start gap-2">
                  <span>{profile.name}</span>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-full p-1 bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-all"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1 font-semibold truncate max-w-[220px] sm:max-w-xs mx-auto sm:mx-0">
                  {profile.email}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm',
                  roleConfig?.bg,
                  roleConfig?.text,
                  roleConfig?.border
                )}>
                  {ROLE_LABELS[role]}
                </span>
                
                {role === 'patient' && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="size-2.5 text-emerald-500" />
                    <span>MINSA Certificado</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsQrZoomed(true)}
            className="cursor-pointer active:scale-95 hover:scale-[1.03] transition-all relative flex flex-col items-center p-3 rounded-[2rem] bg-slate-500/[0.03] dark:bg-zinc-950/40 border border-slate-200/50 dark:border-white/5 w-full sm:w-auto shrink-0 shadow-inner"
          >
            <div className="relative rounded-2xl bg-white p-2 border border-zinc-200/50 shadow-md">
              <QrCode 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pasaporte/${profile.id}`} 
                size={70} 
                label="VER ID"
                showValue={false}
                className="!p-0"
              />
              <div className="absolute top-0.5 left-0.5 size-3 border-t-2 border-l-2 border-teal-500" />
              <div className="absolute top-0.5 right-0.5 size-3 border-t-2 border-r-2 border-teal-500" />
              <div className="absolute bottom-0.5 left-0.5 size-3 border-b-2 border-l-2 border-teal-500" />
              <div className="absolute bottom-0.5 right-0.5 size-3 border-b-2 border-r-2 border-teal-500" />
            </div>
            <span className="mt-2 text-[8px] font-black tracking-widest text-teal-655 dark:text-teal-400 uppercase flex items-center gap-1">
              Pasaporte QR <ChevronRight className="size-2.5 animate-pulse" />
            </span>
          </button>
        </div>
      </div>

      {/* Forms & telemetries */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-zinc-350 flex items-center gap-2">
                  <UserIcon className="size-4 text-teal-500" />
                  <span>Configuración del Perfil</span>
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="size-7 rounded-full bg-slate-500/5 hover:bg-slate-500/10 flex items-center justify-center"
                >
                  <X className="size-4 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre completo</label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Tu nombre"
                    disabled={isSaving}
                    className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                  />
                  {nameError && <p className="text-xs text-red-500 font-semibold">{nameError}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono móvil</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+505 8888 8888"
                    disabled={isSaving}
                    className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                  />
                </div>
              </div>

              {role === 'patient' && (
                <div className="space-y-4 pt-3 border-t border-dashed border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-650 dark:text-teal-400 flex items-center gap-1.5">
                    <Activity className="size-4.5" /> Ficha de Salud Acreditada
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={isSaving}
                        className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Sangre</label>
                      <input
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        placeholder="O+, O-, A+"
                        disabled={isSaving}
                        className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alergias Conocidas</label>
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Separadas por comas (ej. Penicilina, Ibuprofeno...)"
                      rows={2}
                      disabled={isSaving}
                      className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notas de bioseguridad / Tratamientos</label>
                    <textarea
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      placeholder="Indica si posees enfermedades crónicas o indicaciones específicas para entregas."
                      rows={3}
                      disabled={isSaving}
                      className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5 resize-none"
                    />
                  </div>
                </div>
              )}

              {role === 'delivery_driver' && (
                <div className="space-y-4 pt-3 border-t border-dashed border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-650 dark:text-teal-400 flex items-center gap-1.5">
                    <Car className="size-4.5" /> Especificaciones de Telemetría
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Vehículo</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        disabled={isSaving}
                        className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-zinc-900 border border-slate-200/50 dark:border-white/5 text-foreground cursor-pointer"
                      >
                        <option value="Motocicleta">Motocicleta</option>
                        <option value="Automóvil">Automóvil</option>
                        <option value="Bicicleta">Bicicleta</option>
                        <option value="Vehículo Eléctrico">Vehículo Eléctrico</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marca / Modelo de Máquina</label>
                      <input
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        placeholder="Ej. Suzuki AX100"
                        disabled={isSaving}
                        className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de Placas</label>
                      <input
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="M 123-456"
                        disabled={isSaving}
                        className="glass-input rounded-2xl w-full px-4 py-3 text-xs font-mono uppercase bg-white/5 border border-slate-200/50 dark:border-white/5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguro Obligatorio</label>
                      <select
                        value={insuranceStatus}
                        onChange={(e) => setInsuranceStatus(e.target.value)}
                        disabled={isSaving}
                        className="glass-input rounded-2xl w-full px-4 py-3 text-xs bg-zinc-900 border border-slate-200/50 dark:border-white/5 text-foreground cursor-pointer"
                      >
                        <option value="Vigente">Vigente (Aprobado)</option>
                        <option value="En Renovación">En Renovación</option>
                        <option value="Vencido">Vencido (Alerta)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3.5 pt-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full flex-1 h-11 text-xs font-black uppercase tracking-widest bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  <span>{isSaving ? 'Guardando...' : 'Aplicar Cambios'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-full px-6 h-11 text-xs font-black uppercase tracking-wider bg-slate-500/5 hover:bg-slate-500/10 text-slate-600 dark:text-zinc-350 border border-white/5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="read-only-telemetry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* MINSA & legal verification for clinics and pharmacy admins */}
            {(role === 'clinic_admin' || role === 'pharmacy_admin' || role === 'doctor') && (
              <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-dashed border-white/5 mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Shield className="size-4" />
                    <span>Acreditación Gubernamental MINSA</span>
                  </h3>
                </div>

                {profile.verification_status === 'pending' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                      <AlertTriangle className="size-5 shrink-0 animate-pulse mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Falta Registro Sanitario</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed">
                          Sube tu Cédula RUC y Licencia Sanitaria del MINSA para habilitar todas las operaciones comerciales.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-compliance-modal'))}
                      className="w-full rounded-full h-10 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white"
                    >
                      Subir Documentación Legal
                    </Button>
                  </div>
                )}

                {profile.verification_status === 'submitted' && (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600">
                    <Clock className="size-5 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold">Expediente en Auditoría</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed">
                        Tus documentos de RUC y MINSA están bajo revisión jurídica. Resolución estimada en un plazo máximo de 24 horas.
                      </p>
                    </div>
                  </div>
                )}

                {profile.verification_status === 'approved' && (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">Establecimiento Acreditado</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed">
                        Tu cuenta está debidamente verificada bajo los reglamentos del MINSA nicaragüense.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Doctor Telemetry Profile */}
            {role === 'doctor' && (
              <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Stethoscope className="size-4" /> Credencial Médica Profesional
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-white/5">
                    <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">Especialidad Clínica</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{profile.doctor_profile?.specialty || 'Especialista General'}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-white/5">
                    <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">Código de Licencia MINSA</p>
                    <p className="text-sm font-mono font-bold text-foreground mt-0.5">{profile.doctor_profile?.license_number || 'MINSA-99120'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Medical Card */}
            {role === 'patient' && profile.patient_profile && (
              <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Heart className="size-4 text-rose-500 fill-rose-500/10" /> Ficha de Salud del Paciente
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-650 dark:text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20">Bioseguro</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.patient_profile.blood_type && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5">
                      <div className="size-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-inner">
                        <Droplets className="size-4.5 fill-current" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Grupo Sanguíneo</p>
                        <p className="text-sm font-black text-foreground">{profile.patient_profile.blood_type}</p>
                      </div>
                    </div>
                  )}

                  {profile.patient_profile.date_of_birth && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5">
                      <div className="size-9 rounded-xl bg-teal-500/10 text-teal-555 flex items-center justify-center shadow-inner">
                        <Calendar className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Fecha de Nacimiento</p>
                        <p className="text-sm font-black text-foreground">{profile.patient_profile.date_of_birth}</p>
                      </div>
                    </div>
                  )}
                </div>

                {profile.patient_profile.allergies && profile.patient_profile.allergies.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/[0.02] border border-amber-500/15 flex items-start gap-3">
                    <AlertTriangle className="size-5 text-amber-500 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-500">Alergias Registradas</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                        {profile.patient_profile.allergies.join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {profile.patient_profile.medical_notes && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mb-1">Indicaciones Clínicas para Reparto:</p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-semibold leading-relaxed">
                      {profile.patient_profile.medical_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Patient Family Hub */}
            {role === 'patient' && (
              <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <UserIcon className="size-4.5 text-sky-500" /> Núcleo Familiar Autorizado
                  </h3>
                </div>

                {/* Link Field */}
                <div className="bg-slate-500/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 space-y-3.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vincular Nuevo Familiar por Email</p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="email"
                      placeholder="ej. mama@correo.com"
                      value={familyEmail}
                      onChange={(e) => setFamilyEmail(e.target.value)}
                      disabled={isLinking}
                      className="glass-input rounded-xl flex-1 px-3 py-2.5 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                    />
                    <select
                      value={familyRelation}
                      onChange={(e: any) => setFamilyRelation(e.target.value)}
                      disabled={isLinking}
                      className="bg-zinc-900 border border-slate-200/50 dark:border-white/5 text-foreground rounded-xl text-xs px-3 py-2.5 font-bold cursor-pointer"
                    >
                      <option value="padre">Padre</option>
                      <option value="madre">Madre</option>
                      <option value="hijo">Hijo/a</option>
                      <option value="conyuge">Cónyuge</option>
                      <option value="tutor">Tutor Legal</option>
                      <option value="otro">Otro</option>
                    </select>
                    <button
                      className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider px-5 py-2.5 shrink-0 shadow-md shadow-teal-500/5 transition-colors disabled:opacity-50"
                      disabled={isLinking}
                      onClick={handleLinkFamily}
                    >
                      Vincular
                    </button>
                  </div>
                </div>

                {/* Caregiver Lists */}
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5 pl-1">FAMILIARES BAJO MI REPRESENTACIÓN</h4>
                    
                    {familyQuery.isLoading ? (
                      <div className="h-10 shimmer rounded-xl" />
                    ) : (familyQuery.data?.caregiverFor?.length ?? 0) > 0 ? (
                      <div className="space-y-2.5">
                        {familyQuery.data?.caregiverFor?.map((rel: any) => (
                          <div key={rel.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-colors flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">{rel.patient?.name}</p>
                                {rel.status === 'pending' && (
                                  <span className="text-[8px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full animate-pulse">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground capitalize font-semibold mt-0.5">Relación: {rel.relationship}</p>
                              
                              {rel.status === 'pending' && rel.verificationCode && (
                                <div className="mt-2 bg-slate-900 border border-amber-500/20 rounded-xl p-2 font-semibold text-[10px] text-amber-400 flex items-center justify-between gap-2.5">
                                  <span>Dale este PIN de verificación:</span>
                                  <span className="font-mono bg-zinc-950 px-2.5 py-0.5 border border-amber-500/40 rounded text-center tracking-widest font-black text-xs">
                                    {rel.verificationCode}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              className="px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black uppercase tracking-wider text-red-500 transition-colors"
                              onClick={() => handleUnlinkFamily(rel.id)}
                            >
                              Desvincular
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground bg-white/5 border border-dashed border-white/5 rounded-xl p-3.5 text-center font-semibold">
                        No posees familiares a cargo registrados en tu cuenta.
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5 pl-1">CUIDADORES AUTORIZADOS</h4>
                    
                    {familyQuery.isLoading ? (
                      <div className="h-10 shimmer rounded-xl" />
                    ) : (familyQuery.data?.patientOf?.length ?? 0) > 0 ? (
                      <div className="space-y-2.5">
                        {familyQuery.data?.patientOf?.map((rel: any) => (
                          <div key={rel.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-500/30 transition-colors space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">{rel.caregiver?.name}</p>
                                  {rel.status === 'pending' && (
                                    <span className="text-[8px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                                      Espera PIN
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground capitalize font-semibold mt-0.5">Relación: {rel.relationship}</p>
                              </div>

                              <button
                                className="px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black uppercase tracking-wider text-red-500 transition-colors"
                                onClick={() => handleUnlinkFamily(rel.id)}
                              >
                                Revocar
                              </button>
                            </div>

                            {rel.status === 'pending' && (
                              <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-2.5 space-y-2">
                                <p className="text-[10px] font-black text-sky-550 uppercase tracking-wider">🔑 Confirmar Vinculación Familiar</p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Ingresa PIN de 6 dígitos"
                                    defaultValue={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    className="glass-input rounded-lg flex-1 px-3 py-1.5 text-xs font-mono text-center tracking-widest text-sky-400 bg-black/20 border border-sky-500/20"
                                  />
                                  <button
                                    disabled={isVerifying === rel.id}
                                    className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider px-4 py-2 shrink-0 shadow-md shadow-sky-500/10 transition-colors disabled:opacity-50"
                                    onClick={() => handleVerifyFamily(verificationCode, rel.id)}
                                  >
                                    Verificar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground bg-white/5 border border-dashed border-white/5 rounded-xl p-3.5 text-center font-semibold">
                        Ningún familiar está autorizado como cuidador de tus recetas.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Driver Statistics Visor & Vehicle details */}
            {role === 'delivery_driver' && profile.delivery_driver_profile && (
              <div className="space-y-6">
                <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Car className="size-4.5" /> Ficha de Telemetría Vehicular
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20">
                      SOAT {insuranceStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 shadow-sm">
                      <div className="size-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-605 dark:text-teal-400">
                        {vehicleType === 'Bicicleta' ? <Bike className="size-5.5" /> : <Car className="size-5.5" />}
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo Vehicular</p>
                        <p className="text-xs font-black text-foreground">{vehicleType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 shadow-sm">
                      <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <Hash className="size-5.5" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Matrícula / Placas</p>
                        <p className="text-xs font-mono font-black text-foreground tracking-wider">{licensePlate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 shadow-sm">
                      <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                        <Sparkles className="size-5.5" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Marca Máquina</p>
                        <p className="text-xs font-black text-foreground truncate max-w-[150px]">{vehicleBrand}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 shadow-sm">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center",
                        profile.delivery_driver_profile.is_available ? "bg-emerald-500/10" : "bg-amber-500/10"
                      )}>
                        <div className={cn(
                          "size-2.5 rounded-full animate-pulse",
                          profile.delivery_driver_profile.is_available ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Visibilidad Radar</p>
                        <p className="text-xs font-black text-foreground">
                          {profile.delivery_driver_profile.is_available ? 'Conectado' : 'Desconectado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cyber stats summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-[1.8rem] bg-teal-500/[0.03] border border-teal-500/10 text-center shadow-inner relative overflow-hidden group">
                    <p className="text-[8px] font-black text-teal-650 dark:text-teal-400 uppercase tracking-widest">Repartos</p>
                    <p className="text-xl font-black text-foreground tracking-tight mt-1">128</p>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase mt-0.5 block">Completados</span>
                  </div>

                  <div className="p-4 rounded-[1.8rem] bg-sky-500/[0.03] border border-sky-500/10 text-center shadow-inner relative overflow-hidden group">
                    <p className="text-[8px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Distancia</p>
                    <p className="text-xl font-black text-foreground tracking-tight mt-1">842</p>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase mt-0.5 block">KM Totales</span>
                  </div>

                  <div className="p-4 rounded-[1.8rem] bg-indigo-500/[0.03] border border-indigo-500/10 text-center shadow-inner relative overflow-hidden group">
                    <p className="text-[8px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Valoración</p>
                    <p className="text-xl font-black text-foreground tracking-tight mt-1">4.96</p>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase mt-0.5 block">Estrellas</span>
                  </div>

                  <div className="p-4 rounded-[1.8rem] bg-emerald-500/[0.03] border border-emerald-500/10 text-center shadow-inner relative overflow-hidden group">
                    <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Huella CO2</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 flex items-center justify-center gap-0.5">
                      <Leaf className="size-4 animate-bounce" /> 45.2
                    </p>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase mt-0.5 block">KG CO2 Salvo</span>
                  </div>
                </div>

                {/* Interactive Achievement Grid */}
                <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 space-y-4">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
                    <Award className="size-4.5 text-amber-500" /> Insignias Acreditadas
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner shrink-0">
                        <Zap className="size-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-700 dark:text-zinc-250 uppercase leading-none">Rayo Express</p>
                        </div>
                        <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-1 leading-normal">
                          Completar repartos de urgencia en menos de 20 minutos de telemetría.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-teal-500/10 text-teal-650 dark:text-teal-400 flex items-center justify-center shadow-inner shrink-0">
                        <Shield className="size-5 text-teal-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-700 dark:text-zinc-250 uppercase leading-none">Cero Incidentes</p>
                        </div>
                        <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-semibold mt-1 leading-normal">
                          Mantener tasa de incidentes en cero durante 100 entregas consecutivas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Dropdown */}
      <div className="p-5 rounded-[2rem] border border-slate-200/50 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20 backdrop-blur-md">
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer"
        >
          <h3 className="text-xs font-black text-slate-550 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-widest">
            <Lock className="size-4 text-teal-500" />
            <span>Seguridad de Contraseña</span>
          </h3>
          <motion.div animate={{ rotate: showPasswordSection ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <X className="size-4 text-slate-450" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showPasswordSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-4 pt-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contraseña actual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-xs bg-white/5 border border-slate-200/50 dark:border-white/5"
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 font-bold">Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>
              <button
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full h-10 bg-teal-500 hover:bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full disabled:opacity-50 transition-colors"
              >
                Actualizar contraseña
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Action */}
      <button
        onClick={logout}
        className="w-full h-12 rounded-[2rem] bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-2 text-red-550 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
      >
        <LogOut className="size-4" />
        <span>Cerrar sesión segura</span>
      </button>

      {/* QR Passport zoom modal */}
      <AnimatePresence>
        {isQrZoomed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQrZoomed(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative max-w-sm w-full p-6 rounded-[2.5rem] bg-white/95 dark:bg-slate-950/95 border border-teal-500/30 shadow-2xl z-10 overflow-hidden text-center backdrop-blur-3xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
              
              <div className="flex flex-col items-center mb-6">
                <div className="size-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-650 dark:text-teal-400 border border-teal-500/20 mb-3">
                  <Shield className="size-5.5 animate-pulse" />
                </div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  Pasaporte Digital QR
                </h3>
                <p className="text-[9px] font-black text-teal-650 dark:text-teal-400 tracking-wider uppercase mt-0.5">
                  Verificado por MINSA
                </p>
              </div>

              <div className="relative inline-flex flex-col items-center justify-center bg-white rounded-3xl p-5 shadow-2xl border border-zinc-200/50 mb-6 overflow-hidden w-[240px] h-[240px]">
                <motion.div 
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-20 pointer-events-none shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                />
                
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pasaporte/${profile.id}`} 
                  size={200} 
                  label="ID DIGITAL"
                  showValue={false}
                  className="!p-0"
                />
                
                <div className="absolute top-1 left-1 size-5 border-t-4 border-l-4 border-teal-500 rounded-tl-xl" />
                <div className="absolute top-1 right-1 size-5 border-t-4 border-r-4 border-teal-500 rounded-tr-xl" />
                <div className="absolute bottom-1 left-1 size-5 border-b-4 border-l-4 border-teal-500 rounded-bl-xl" />
                <div className="absolute bottom-1 right-1 size-5 border-b-4 border-r-4 border-teal-500 rounded-br-xl" />
              </div>

              <div className="bg-slate-500/5 dark:bg-black/40 border border-slate-500/10 rounded-2xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between items-center text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Titular</span>
                  <span>ID Registro</span>
                </div>
                <p className="text-xs font-black text-foreground">{profile.name}</p>
                <p className="font-mono text-[9px] text-muted-foreground truncate">{profile.id}</p>
              </div>

              <button
                onClick={() => setIsQrZoomed(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/15 cursor-pointer"
              >
                Cerrar Pasaporte
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
