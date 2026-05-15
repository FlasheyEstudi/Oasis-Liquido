'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useGetMe, useUpdateMe, useUpdatePatientProfile, getHookErrorMessage } from '@/hooks/use-api';
import { getInitials } from '@/utils/helpers';
import { ROLE_LABELS, ROLE_COLORS } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

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

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Populate fields when profile loads
  const [initialized, setInitialized] = useState(false);
  if (profile && !initialized) {
    setName(profile.name);
    setPhone(profile.phone || '');
    if (profile.patient_profile) {
      setDateOfBirth(profile.patient_profile.date_of_birth || '');
      setBloodType(profile.patient_profile.blood_type || '');
      setAllergies(profile.patient_profile.allergies?.join(', ') || '');
      setMedicalNotes(profile.patient_profile.medical_notes || '');
    }
    setInitialized(true);
  }

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

      setUser({ ...updatedUser, role: profile.role });
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
    }
    setIsEditing(false);
    setNameError('');
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
      <div className="glass rounded-3xl p-8 text-center max-w-2xl mx-auto">
        <Shield className="size-12 text-red-500/50 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
        <p className="text-sm text-muted-foreground mb-4">{getHookErrorMessage(error) || 'No se pudo cargar el perfil'}</p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm font-medium">Reintentar</button>
      </div>
    );
  }

  const role = profile.role;
  const roleConfig = ROLE_COLORS[role];
  const isSaving = updateMeMutation.isPending || updatePatientMutation.isPending;

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-6">
      {/* Profile Header Card */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Gradient Avatar */}
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-500 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {getInitials(name || profile.name)}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className={cn(
                'text-xs px-3 py-0.5 rounded-full font-medium',
                roleConfig?.bg,
                roleConfig?.text,
                roleConfig?.border,
                'border',
              )}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="glass-btn-secondary rounded-full p-2.5"
            >
              <Pencil className="size-4" />
            </motion.button>
          )}
        </div>
      </GlassCard>

      {/* Edit Form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <UserIcon className="size-4 text-teal-600 dark:text-teal-400" />
                  Información Personal
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancelEdit}
                  className="rounded-full p-1.5 hover:bg-red-500/10 transition-colors"
                >
                  <X className="size-4 text-muted-foreground" />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nombre completo</label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Tu nombre"
                    disabled={isSaving}
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                  />
                  {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Teléfono
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 555 123 4567"
                    disabled={isSaving}
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <Mail className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{profile.email}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">No editable</span>
                </div>

                {/* Patient-specific fields */}
                {role === 'patient' && (
                  <>
                    <div className="pt-2 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <FileText className="size-4 text-teal-600 dark:text-teal-400" />
                        Información Médica
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        Fecha de nacimiento
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={isSaving}
                        className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Droplets className="size-3.5" />
                        Tipo de sangre
                      </label>
                      <input
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        placeholder="O+, A-, etc."
                        disabled={isSaving}
                        className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5" />
                        Alergias
                      </label>
                      <textarea
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="Separadas por coma: Penicilina, Ibuprofeno..."
                        rows={2}
                        disabled={isSaving}
                        className="glass-input rounded-xl w-full px-4 py-2.5 text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        Notas médicas
                      </label>
                      <textarea
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        placeholder="Condiciones, tratamientos, etc."
                        rows={3}
                        disabled={isSaving}
                        className="glass-input rounded-xl w-full px-4 py-2.5 text-sm resize-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Save / Cancel */}
              <div className="flex items-center gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="glass-btn-primary rounded-full flex-1 h-11 gap-2 text-sm font-medium flex items-center justify-center disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </motion.button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="glass-btn-secondary rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read-only role-specific info */}
      {!isEditing && (
        <>
          {/* Doctor info */}
          {role === 'doctor' && (
            <GlassCard>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <Stethoscope className="size-4 text-teal-600 dark:text-teal-400" />
                Información Profesional
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <Stethoscope className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Especialidad</p>
                    <p className="text-sm font-medium text-foreground">{profile.doctor_profile?.specialty || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <Award className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Cédula profesional</p>
                    <p className="text-sm font-medium text-foreground">{profile.doctor_profile?.license_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <Shield className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Clínica asignada</p>
                    <p className="text-sm font-medium text-foreground">{profile.doctor_profile?.clinic?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Patient info (read-only view when not editing) */}
          {role === 'patient' && profile.patient_profile && (
            <GlassCard>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <FileText className="size-4 text-teal-600 dark:text-teal-400" />
                Información Médica
              </h3>
              <div className="space-y-3">
                {profile.patient_profile.date_of_birth && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                      <p className="text-sm font-medium text-foreground">{profile.patient_profile.date_of_birth}</p>
                    </div>
                  </div>
                )}
                {profile.patient_profile.blood_type && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                    <Droplets className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Tipo de sangre</p>
                      <p className="text-sm font-medium text-foreground">{profile.patient_profile.blood_type}</p>
                    </div>
                  </div>
                )}
                {profile.patient_profile.allergies && profile.patient_profile.allergies.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Alergias</p>
                      <p className="text-sm font-medium text-foreground">{profile.patient_profile.allergies.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Pharmacy Manager info */}
          {role === 'pharmacy_manager' && (
            <GlassCard>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <Shield className="size-4 text-teal-600 dark:text-teal-400" />
                Información de Farmacia
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                <Shield className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Farmacia asignada</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.pharmacy_manager_profile?.pharmacy?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Receptionist info */}
          {role === 'receptionist' && (
            <GlassCard>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <Shield className="size-4 text-teal-600 dark:text-teal-400" />
                Información de Clínica
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                <Shield className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Clínica asignada</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.receptionist_profile?.clinic?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Delivery Driver info */}
          {role === 'delivery_driver' && profile.delivery_driver_profile && (
            <GlassCard>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <Car className="size-4 text-amber-600 dark:text-amber-400" />
                Información de Conductor
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <Car className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tipo de vehículo</p>
                    <p className="text-sm font-medium text-foreground">{profile.delivery_driver_profile.vehicle_type || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <Hash className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Placas</p>
                    <p className="text-sm font-medium text-foreground">{profile.delivery_driver_profile.license_plate || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                  <div className={cn(
                    'size-3 rounded-full',
                    profile.delivery_driver_profile.is_available ? 'bg-emerald-500' : 'bg-amber-500',
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {profile.delivery_driver_profile.is_available ? 'Disponible para entregas' : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Change Password Section */}
      <GlassCard>
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock className="size-4 text-teal-600 dark:text-teal-400" />
            Cambiar contraseña
          </h3>
          <motion.div animate={{ rotate: showPasswordSection ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <X className="size-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showPasswordSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contraseña actual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                </div>
                <button
                  disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="glass-btn-primary rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Actualizar contraseña
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={logout}
        className="w-full rounded-3xl p-4 glass flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-medium hover:bg-red-500/5 transition-colors"
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </motion.button>
    </div>
  );
}
