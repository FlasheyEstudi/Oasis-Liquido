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
  Building2,
  MapPin,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
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

  // Doctor signature PIN management
  const [showPinPanel, setShowPinPanel] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [pinSaveError, setPinSaveError] = useState('');
  const [pinSaveLoading, setPinSaveLoading] = useState(false);
  const [pinSaveSuccess, setPinSaveSuccess] = useState(false);
  const [showPinValue, setShowPinValue] = useState(false);
  const hasPin = !!(profile?.doctor_profile?.signature_pin ?? (profile as any)?.doctor_profile?.signaturePin);

  const handleSavePin = async () => {
    setPinSaveError('');
    setPinSaveSuccess(false);
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinSaveError('El PIN debe ser exactamente 4 dígitos numéricos');
      return;
    }
    if (newPin !== confirmPin) {
      setPinSaveError('Los PINs no coinciden');
      return;
    }
    if (!pinPassword.trim()) {
      setPinSaveError('Debes ingresar tu contraseña de cuenta para confirmar');
      return;
    }
    setPinSaveLoading(true);
    try {
      const apiClient = (await import('@/api/client')).default;
      await apiClient.post('/v1/doctor/profile/pin', { pin: newPin, password: pinPassword });
      setPinSaveSuccess(true);
      setNewPin('');
      setConfirmPin('');
      setPinPassword('');
      setShowPinPanel(false);
      toast.success('PIN de firma digital actualizado correctamente');
      refetch();
    } catch (err: any) {
      setPinSaveError(err?.response?.data?.message || 'Error al guardar el PIN');
    } finally {
      setPinSaveLoading(false);
    }
  };

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

      {/* ── CREDENCIAL DIGITAL DIFERENCIADA POR ROL ── */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className={cn(
          'relative w-full aspect-[1.586/1] rounded-[2rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.55)] select-none group',
          role === 'doctor'          && 'border border-sky-500/25',
          role === 'pharmacy_manager'&& 'border border-emerald-500/25',
          role === 'delivery_driver' && 'border border-amber-500/25',
          (!role || role === 'patient' || role === 'receptionist') && 'border border-teal-500/25'
        )}
      >
        {/* ── BG GRADIENT POR ROL ── */}
        {role === 'doctor' && <>
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-sky-950/75 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.2),transparent)] pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.07] stroke-sky-400 pointer-events-none" fill="none">
            <path d="M0 100 L100 100 L120 100 L130 60 L140 140 L150 90 L160 105 L170 100 L270 100" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M270 100 L370 100 L390 100 L400 60 L410 140 L420 90 L430 105 L440 100 L540 100" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
        </>}
        {role === 'pharmacy_manager' && <>
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-emerald-950/75 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.2),transparent)] pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-10 stroke-emerald-400 pointer-events-none" fill="none">
            <pattern id="guilloche-p" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 Q 10 5, 20 20 T 40 20" strokeWidth="0.5" />
              <path d="M 0 10 Q 10 25, 20 10 T 40 10" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#guilloche-p)" />
          </svg>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        </>}
        {role === 'delivery_driver' && <>
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-amber-950/60 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.2),transparent)] pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] stroke-amber-400 pointer-events-none" fill="none">
            <pattern id="telemesh-p" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 0 30 L 30 0 M 15 15 L 30 30 M 0 0 L 15 15" strokeWidth="0.75" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#telemesh-p)" />
          </svg>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </>}
        {(role === 'patient' || role === 'receptionist' || !role) && <>
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-teal-950/70 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,184,166,0.22),transparent)] pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 size-32 bg-cyan-500/10 rounded-full blur-[40px] animate-pulse pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
        </>}

        {/* Hologram overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.04] mix-blend-overlay pointer-events-none" />

        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between z-10">
          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'w-7 h-5 sm:w-9 sm:h-6 rounded-[4px] border relative shadow-md overflow-hidden flex shrink-0',
                role === 'doctor'           && 'bg-gradient-to-br from-sky-300 via-indigo-500 to-sky-700 border-sky-400/40',
                role === 'pharmacy_manager' && 'bg-gradient-to-br from-emerald-300 via-teal-500 to-emerald-600 border-emerald-400/40',
                role === 'delivery_driver'  && 'bg-gradient-to-br from-amber-300 via-orange-500 to-amber-700 border-amber-400/40',
                (role === 'patient' || !role || role === 'receptionist') && 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border-amber-400/40'
              )}>
                <div className="grid grid-cols-3 gap-[1px] h-full w-full opacity-60 p-0.5">
                  {[...Array(6)].map((_,i) => <div key={i} className="border-white/20" style={{borderRight: i%3!==2?'1px solid':undefined, borderBottom: i<3?'1px solid':undefined}} />)}
                </div>
              </div>
              <div>
                <h3 className={cn(
                  'text-sm sm:text-base font-black tracking-[0.12em] uppercase leading-none',
                  role === 'doctor'           && 'text-sky-300',
                  role === 'pharmacy_manager' && 'text-emerald-300',
                  role === 'delivery_driver'  && 'text-amber-400',
                  (role === 'patient' || !role || role === 'receptionist') && 'text-teal-300'
                )}>
                  {role === 'doctor' && 'OASIS CLÍNICA'}
                  {role === 'pharmacy_manager' && 'OASIS LÍQUIDA'}
                  {role === 'delivery_driver' && 'OASIS LOGISTICS'}
                  {(role === 'patient' || !role || role === 'receptionist') && 'OASIS LÍQUIDA'}
                </h3>
                <p className={cn(
                  'text-[6px] font-mono tracking-widest uppercase mt-0.5',
                  role === 'doctor'           && 'text-sky-400/60',
                  role === 'pharmacy_manager' && 'text-emerald-400/60',
                  role === 'delivery_driver'  && 'text-amber-500/60',
                  (role === 'patient' || !role || role === 'receptionist') && 'text-teal-400/60'
                )}>
                  {role === 'doctor' && 'CREDENCIAL MÉDICA OFICIAL'}
                  {role === 'pharmacy_manager' && 'CREDENCIAL DE ESTABLECIMIENTO'}
                  {role === 'delivery_driver' && 'ACREDITACIÓN LOGÍSTICA CRÍTICA'}
                  {(role === 'patient' || !role || role === 'receptionist') && 'PASAPORTE DIGITAL DE SALUD'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role === 'delivery_driver' && <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />}
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest border uppercase animate-pulse',
                role === 'doctor'           && 'bg-sky-500/15 text-sky-400 border-sky-500/30',
                role === 'pharmacy_manager' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                role === 'delivery_driver'  && 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                (role === 'patient' || !role || role === 'receptionist') && 'bg-teal-500/15 text-teal-400 border-teal-500/30'
              )}>MINSA ✓</span>
            </div>
          </div>

          {/* BODY */}
          <div className="grid grid-cols-12 gap-3 items-center my-auto py-1">
            {/* Avatar / Icon */}
            <div className="col-span-3 flex justify-start">
              <div className={cn(
                'relative size-14 sm:size-18 rounded-xl bg-zinc-950/90 border flex items-center justify-center overflow-hidden shadow-lg group-hover:opacity-90 transition-opacity',
                role === 'doctor'           && 'border-sky-500/40 shadow-sky-500/20',
                role === 'pharmacy_manager' && 'border-emerald-500/40 shadow-emerald-500/20',
                role === 'delivery_driver'  && 'border-amber-500/40 shadow-amber-500/20',
                (role === 'patient' || !role || role === 'receptionist') && 'border-teal-500/40 shadow-teal-500/20'
              )}>
                {role === 'doctor' && <Stethoscope className="size-7 text-sky-400/60 animate-pulse" />}
                {role === 'pharmacy_manager' && <Building2 className="size-7 text-emerald-400/60" />}
                {role === 'delivery_driver' && <Car className="size-7 text-amber-400/60" />}
                {(role === 'patient' || !role || role === 'receptionist') && <UserIcon className="size-7 text-teal-400/60" />}
                <div className={cn(
                  'absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent animate-scan pointer-events-none',
                  role === 'doctor'           && 'via-sky-400 shadow-[0_0_6px_#38bdf8]',
                  role === 'pharmacy_manager' && 'via-emerald-400 shadow-[0_0_6px_#10b981]',
                  role === 'delivery_driver'  && 'via-amber-400 shadow-[0_0_6px_#f59e0b]',
                  (role === 'patient' || !role || role === 'receptionist') && 'via-teal-400 shadow-[0_0_6px_#2dd4bf]'
                )} />
              </div>
            </div>

            {/* Data Fields */}
            <div className="col-span-9 space-y-2 pl-2 sm:pl-4">
              <div>
                <p className={cn(
                  'text-[6px] font-bold tracking-[0.2em] uppercase font-mono',
                  role === 'doctor'           && 'text-sky-400/50',
                  role === 'pharmacy_manager' && 'text-emerald-400/50',
                  role === 'delivery_driver'  && 'text-amber-400/50',
                  (role === 'patient' || !role || role === 'receptionist') && 'text-teal-400/50'
                )}>
                  {role === 'doctor' && 'PROFESIONAL DE MEDICINA / PHYSICIAN'}
                  {role === 'pharmacy_manager' && 'FARMACIA CERTIFICADA / FACILITY'}
                  {role === 'delivery_driver' && 'REPARTIDOR AUTORIZADO / COURIER'}
                  {(role === 'patient' || !role || role === 'receptionist') && 'TITULAR DE SALUD / CITIZEN'}
                </p>
                <p className="text-sm sm:text-base font-black text-white uppercase tracking-wide leading-none mt-0.5 truncate">{profile.name}</p>
              </div>
              {/* ROW A */}
              <div className="grid grid-cols-2 gap-2">
                {role === 'doctor' && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-sky-400/50">COLEGIADO N°</p>
                    <p className="text-[9px] font-black font-mono text-zinc-200 uppercase tracking-wider mt-0.5">{profile.doctor_profile?.license_number || profile.id.slice(0,8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-sky-400/50">ESPECIALIDAD</p>
                    <p className="text-[9px] font-black text-sky-300 uppercase tracking-widest mt-0.5 truncate">{profile.doctor_profile?.specialty || 'Medicina General'}</p>
                  </div>
                </>)}
                {role === 'pharmacy_manager' && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-emerald-400/50">CÓD. REGISTRO</p>
                    <p className="text-[9px] font-black font-mono text-zinc-200 uppercase tracking-wider mt-0.5">{profile.id.slice(0,10).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-emerald-400/50">ESTABLECIMIENTO</p>
                    <p className="text-[9px] font-black text-emerald-300 uppercase tracking-wider mt-0.5 truncate">{profile.pharmacy_manager_profile?.pharmacy?.name || 'Farmacia Oasis'}</p>
                  </div>
                </>)}
                {role === 'delivery_driver' && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-amber-400/50">ID LOGÍSTICA</p>
                    <p className="text-[9px] font-black font-mono text-zinc-200 uppercase tracking-wider mt-0.5">{profile.id.slice(0,10).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-amber-400/50">TIPO VEHÍCULO</p>
                    <p className="text-[9px] font-black text-amber-300 uppercase tracking-wider mt-0.5">{profile.delivery_driver_profile?.vehicle_type || vehicleType}</p>
                  </div>
                </>)}
                {(role === 'patient' || !role || role === 'receptionist') && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-teal-400/50">EXPEDIENTE ID</p>
                    <p className="text-[9px] font-black font-mono text-zinc-200 uppercase tracking-wider mt-0.5">{profile.id.slice(0,10).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-teal-400/50">GRUPO SANGUÍNEO</p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 font-mono font-black text-[9px] mt-0.5">
                      <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                      {profile.patient_profile?.blood_type || 'N/A'}
                    </div>
                  </div>
                </>)}
              </div>

              {/* ROW B — campo exclusivo #3 por rol */}
              <div className="grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-1.5">
                {role === 'doctor' && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-sky-400/50">CLÍNICA BASE</p>
                    <p className="text-[9px] font-black text-sky-300 uppercase tracking-wider mt-0.5 truncate">{profile.doctor_profile?.clinic?.name || 'Centro Clínico Oasis'}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-sky-400/50">ESTATUS</p>
                    <p className="text-[9px] font-black text-emerald-400 uppercase mt-0.5">ACTIVO</p>
                  </div>
                </>)}
                {role === 'pharmacy_manager' && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-emerald-400/50">DIRECCIÓN</p>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-wider mt-0.5 truncate">{profile.pharmacy_manager_profile?.pharmacy?.address || 'Nicaragua'}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-emerald-400/50">ESTATUS</p>
                    <p className="text-[9px] font-black text-emerald-400 uppercase mt-0.5">VIGENTE</p>
                  </div>
                </>)}
                {role === 'delivery_driver' && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-amber-400/50">PLACA N°</p>
                    <div className="inline-flex items-center justify-center px-2 py-0.5 bg-gradient-to-b from-yellow-300 to-yellow-500 text-zinc-950 font-mono font-black text-[9px] rounded border border-yellow-600 mt-0.5">
                      {profile.delivery_driver_profile?.license_plate || licensePlate || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-amber-400/50">BASE DESPACHO</p>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-wider mt-0.5 truncate">{profile.delivery_driver_profile?.pharmacy?.name || 'Oasis Aura'}</p>
                  </div>
                </>)}
                {(role === 'patient' || !role || role === 'receptionist') && (<>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-teal-400/50">ALERGIAS</p>
                    <p className={cn('text-[9px] font-black uppercase tracking-wider mt-0.5', (profile.patient_profile?.allergies?.length ?? 0) > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400')}>
                      {(profile.patient_profile?.allergies?.length ?? 0) > 0 ? 'SÍ REGISTRA' : 'NINGUNA'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold tracking-[0.2em] uppercase font-mono text-teal-400/50">EMISIÓN</p>
                    <p className="text-[9px] font-black font-mono text-zinc-300 mt-0.5">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-NI') : '—'}
                    </p>
                  </div>
                </>)}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-end border-t border-white/10 pt-2">
            <div className="font-mono text-[6px] text-zinc-500 tracking-wider">
              {role === 'doctor' ? 'DOC' : role === 'pharmacy_manager' ? 'EST' : role === 'delivery_driver' ? 'DEL' : 'PAC'}-SEC: {profile.id.slice(0,20).toUpperCase()}
            </div>
            <button
              onClick={() => setIsQrZoomed(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/10 transition text-[8px] font-black text-zinc-300 uppercase tracking-widest cursor-pointer"
            >
              <QrCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pasaporte/${profile.id}`} size={22} label="" showValue={false} className="!p-0 rounded" />
              VER QR
            </button>
          </div>
        </div>
      </motion.div>

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

            {/* ── DOCTOR: Firma Digital PIN ── */}
            {role === 'doctor' && (
              <div className="p-5 rounded-[2rem] border border-sky-500/20 dark:border-sky-500/10 bg-sky-500/[0.02] dark:bg-sky-950/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 flex items-center gap-2">
                    <KeyRound className="size-4" /> Firma Digital de Recetas
                  </h3>
                  <div className="flex items-center gap-2">
                    {pinSaveSuccess && (
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Actualizado
                      </span>
                    )}
                    <span className={cn(
                      'text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border',
                      hasPin
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
                    )}>
                      {hasPin ? '● PIN Configurado' : '⚠ Sin PIN'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Tu PIN de 4 dígitos es requerido cada vez que emites una receta médica digital. Actúa como tu sello legal de prescripción.
                </p>

                {!showPinPanel ? (
                  <button
                    onClick={() => { setShowPinPanel(true); setPinSaveError(''); setPinSaveSuccess(false); }}
                    className="w-full h-10 rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="size-3.5" />
                    {hasPin ? 'Cambiar PIN de Firma' : 'Configurar PIN de Firma'}
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-2 border-t border-sky-500/10"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {hasPin ? 'Nuevo PIN' : 'Crear PIN'} (4 dígitos)
                        </label>
                        <div className="relative">
                          <input
                            type={showPinValue ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="••••"
                            className="glass-input rounded-xl w-full px-4 py-2.5 text-sm font-mono font-black bg-white/5 border border-sky-500/20 tracking-[0.5em] text-center"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPinValue(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPinValue ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Confirmar PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="••••"
                          className={cn(
                            'glass-input rounded-xl w-full px-4 py-2.5 text-sm font-mono font-black bg-white/5 border tracking-[0.5em] text-center',
                            confirmPin && newPin !== confirmPin ? 'border-red-500/40' : 'border-sky-500/20'
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Contraseña de tu cuenta (confirmación)</label>
                      <input
                        type="password"
                        value={pinPassword}
                        onChange={(e) => setPinPassword(e.target.value)}
                        placeholder="Tu contraseña de acceso"
                        className="glass-input rounded-xl w-full px-4 py-2.5 text-xs bg-white/5 border border-sky-500/20"
                      />
                    </div>

                    {pinSaveError && (
                      <p className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="size-3 shrink-0" /> {pinSaveError}
                      </p>
                    )}

                    {/* PIN strength indicator */}
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={cn(
                          'flex-1 h-1 rounded-full transition-all',
                          newPin.length > i ? 'bg-sky-500' : 'bg-white/10'
                        )} />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePin}
                        disabled={pinSaveLoading || newPin.length !== 4 || newPin !== confirmPin || !pinPassword}
                        className="flex-1 h-10 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {pinSaveLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                        {hasPin ? 'Actualizar PIN' : 'Guardar PIN'}
                      </button>
                      <button
                        onClick={() => { setShowPinPanel(false); setNewPin(''); setConfirmPin(''); setPinPassword(''); setPinSaveError(''); }}
                        className="px-4 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-white/5 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                )}
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
