'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Droplets, Loader2, Check, X, Shield, Truck, Compass, Award, Building, Phone, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { APP_NAME } from '@/utils/constants';
import { post, get, getErrorMessage } from '@/api/client';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import type { Variants } from 'framer-motion';

import type { AuthResponse } from '@/types';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5 },
  }),
};

interface ClinicOrPharmacyListItem {
  id: string;
  name: string;
  address: string;
}

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Al menos 1 mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Al menos 1 número', met: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1.5 text-xs">
          {check.met ? (
            <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          ) : (
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={check.met ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Dynamic Fields States
  const [pharmacyId, setPharmacyId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [vehicleType, setVehicleType] = useState('motocicleta');
  const [licensePlate, setLicensePlate] = useState('');
  const [entityName, setEntityName] = useState('');
  const [entityAddress, setEntityAddress] = useState('');
  const [entityPhone, setEntityPhone] = useState('');

  // Dropdown lists
  const [pharmacies, setPharmacies] = useState<ClinicOrPharmacyListItem[]>([]);
  const [clinics, setClinics] = useState<ClinicOrPharmacyListItem[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const { navigate, login, setNotification } = useAuthStore();

  // Load pharmacies and clinics lists dynamically based on role
  useEffect(() => {
    async function fetchLists() {
      if (role === 'pharmacy_owner' || role === 'pharmacy_manager') {
        if (pharmacies.length > 0) return;
        setIsLoadingLists(true);
        try {
          const res = await get<ClinicOrPharmacyListItem[]>('/pharmacies/list');
          if (res.success && Array.isArray(res.data)) {
            setPharmacies(res.data);
            if (res.data.length > 0) setPharmacyId(res.data[0].id);
          }
        } catch (err) {
          console.error('Error fetching pharmacies:', err);
        } finally {
          setIsLoadingLists(false);
        }
      } else if (role === 'clinic_owner' || role === 'clinic_admin') {
        if (clinics.length > 0) return;
        setIsLoadingLists(true);
        try {
          const res = await get<ClinicOrPharmacyListItem[]>('/clinics/list');
          if (res.success && Array.isArray(res.data)) {
            setClinics(res.data);
            if (res.data.length > 0) setClinicId(res.data[0].id);
          }
        } catch (err) {
          console.error('Error fetching clinics:', err);
        } finally {
          setIsLoadingLists(false);
        }
      }
    }

    fetchLists();
  }, [role, pharmacies.length, clinics.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setApiError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setApiError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setApiError('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.');
      return;
    }

    // Role specific form validations
    if ((role === 'pharmacy_owner' || role === 'pharmacy_admin') && (!entityName.trim() || !entityAddress.trim())) {
      setApiError('Por favor ingresa el nombre y la dirección de tu farmacia.');
      return;
    }

    if (role === 'pharmacy_manager' && !pharmacyId) {
      setApiError('Por favor selecciona una farmacia.');
      return;
    }

    if ((role === 'clinic_owner' || role === 'clinic_admin') && (!entityName.trim() || !entityAddress.trim())) {
      setApiError('Por favor ingresa el nombre y la dirección de tu clínica.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        name,
        email,
        password,
        role: role === 'clinic_admin' ? 'clinic_owner' : (role === 'pharmacy_admin' ? 'pharmacy_owner' : role),
      };

      // Inject dynamic fields
      if (role === 'pharmacy_owner' || role === 'pharmacy_admin') {
        payload.entityName = entityName;
        payload.entityAddress = entityAddress;
        payload.entityPhone = entityPhone || undefined;
      } else if (role === 'pharmacy_manager') {
        payload.pharmacyId = pharmacyId;
      } else if (role === 'clinic_owner' || role === 'clinic_admin') {
        payload.entityName = entityName;
        payload.entityAddress = entityAddress;
        payload.entityPhone = entityPhone || undefined;
      } else if (role === 'delivery_driver') {
        payload.vehicleType = vehicleType;
        payload.licensePlate = licensePlate;
      }

      console.log('[REGISTER-FRONTEND] Enviando registro:', payload);

      const response = await post<AuthResponse['data']>('/auth/register', payload);

      if (response.success && response.data) {
        login(response.data.user, response.data.access_token);
        setNotification({ type: 'success', message: '¡Cuenta creada con éxito!' });
      } else {
        setApiError('Error inesperado. Intenta de nuevo.');
      }
    } catch (error) {
      const msg = getErrorMessage(error);
      setApiError(msg);
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 overflow-hidden">
      <OrganicBlobs />

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <motion.div custom={0} variants={fadeInUp} className="flex flex-col items-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/25 mb-4">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Crea tu cuenta</h1>
            <p className="text-sm text-muted-foreground mt-1">Tu oasis de salud te espera</p>
          </motion.div>

          {/* API Error */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-6"
            >
              {apiError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <motion.div custom={1} variants={fadeInUp}>
              <label htmlFor="register-name" className="block text-sm font-medium text-foreground mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-name"
                  type="text"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div custom={2} variants={fadeInUp}>
              <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-email"
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
              </div>
            </motion.div>

            {/* Role Selector */}
            <motion.div custom={3} variants={fadeInUp}>
              <label htmlFor="register-role" className="block text-sm font-medium text-foreground mb-1.5">
                Tipo de cuenta (Rol)
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <select
                  id="register-role"
                  disabled={isSubmitting}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setApiError(null);
                  }}
                  className="glass-input w-full h-11 pl-11 pr-10 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50 appearance-none bg-transparent"
                >
                  <option value="patient" className="bg-slate-800 text-white">Paciente</option>
                  <option value="clinic_admin" className="bg-slate-800 text-white">Administrador de Clínica</option>
                  <option value="pharmacy_admin" className="bg-slate-800 text-white">Administrador de Farmacia</option>
                  <option value="delivery_driver" className="bg-slate-800 text-white">Repartidor / Delivery</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              </div>
            </motion.div>

            {/* Dynamic Fields Section */}
            <AnimatePresence mode="wait">
              {/* Pharmacy Linkage */}
              {/* Pharmacy Creation (for Pharmacy Owner) */}
              {(role === 'pharmacy_owner' || role === 'pharmacy_admin') && (
                <motion.div
                  key="pharmacy-create"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="register-pharmacy-name" className="block text-sm font-medium text-foreground">
                      Nombre de la Farmacia
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-pharmacy-name"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        placeholder="Ej. Farmacia Oasis Central Nicaragua"
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-pharmacy-address" className="block text-sm font-medium text-foreground">
                      Dirección de la Farmacia
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-pharmacy-address"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={entityAddress}
                        onChange={(e) => setEntityAddress(e.target.value)}
                        placeholder="Ej. Del Parque Central 2 cuadras al norte, Masaya"
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-pharmacy-phone" className="block text-sm font-medium text-foreground">
                      Teléfono de Contacto (Opcional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-pharmacy-phone"
                        type="tel"
                        disabled={isSubmitting}
                        value={entityPhone}
                        onChange={(e) => setEntityPhone(e.target.value)}
                        placeholder="Ej. +505 8888-8888"
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Pharmacy Linkage (for Pharmacy Manager) */}
              {role === 'pharmacy_manager' && (
                <motion.div
                  key="pharmacy-select"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1.5"
                >
                  <label htmlFor="register-pharmacy" className="block text-sm font-medium text-foreground">
                    Asociar con Farmacia
                  </label>
                  <div className="relative">
                    <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    {isLoadingLists ? (
                      <div className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                        <span>Cargando farmacias...</span>
                      </div>
                    ) : (
                      <>
                        <select
                          id="register-pharmacy"
                          disabled={isSubmitting}
                          value={pharmacyId}
                          onChange={(e) => setPharmacyId(e.target.value)}
                          className="glass-input w-full h-11 pl-11 pr-10 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50 appearance-none bg-transparent"
                        >
                          {pharmacies.length === 0 ? (
                            <option value="" className="bg-slate-800 text-white">No hay farmacias activas</option>
                          ) : (
                            pharmacies.map((pharmacy) => (
                              <option key={pharmacy.id} value={pharmacy.id} className="bg-slate-800 text-white">
                                {pharmacy.name} ({pharmacy.address})
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Clinic Creation (for Clinic Owner) */}
              {(role === 'clinic_owner' || role === 'clinic_admin') && (
                <motion.div
                  key="clinic-create"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="register-clinic-name" className="block text-sm font-medium text-foreground">
                      Nombre de la Clínica
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-clinic-name"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        placeholder="Ej. Clínica Médica San Rafael"
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-clinic-address" className="block text-sm font-medium text-foreground">
                      Dirección de la Clínica
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-clinic-address"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={entityAddress}
                        onChange={(e) => setEntityAddress(e.target.value)}
                        placeholder="Ej. Frente a Iglesia El Calvario, León"
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-clinic-phone" className="block text-sm font-medium text-foreground">
                      Teléfono de Contacto (Opcional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-clinic-phone"
                        type="tel"
                        disabled={isSubmitting}
                        value={entityPhone}
                        onChange={(e) => setEntityPhone(e.target.value)}
                        placeholder="Ej. +505 2222-2222"
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Delivery Extra Fields */}
              {role === 'delivery_driver' && (
                <motion.div
                  key="delivery-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="register-vehicle" className="block text-sm font-medium text-foreground">
                      Tipo de Vehículo
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <select
                        id="register-vehicle"
                        disabled={isSubmitting}
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-10 rounded-full text-sm text-foreground focus:outline-none disabled:opacity-50 appearance-none bg-transparent"
                      >
                        <option value="motocicleta" className="bg-slate-800 text-white">Motocicleta</option>
                        <option value="bicicleta" className="bg-slate-800 text-white">Bicicleta / E-bike</option>
                        <option value="automovil" className="bg-slate-800 text-white">Automóvil</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-plate" className="block text-sm font-medium text-foreground">
                      Placa de Licencia (Patente)
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        id="register-plate"
                        type="text"
                        placeholder="M-123456 (Opcional)"
                        disabled={isSubmitting}
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        className="glass-input w-full h-11 pl-11 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <motion.div custom={4} variants={fadeInUp}>
              <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordRequirements password={password} />
            </motion.div>

            {/* Confirm Password */}
            <motion.div custom={5} variants={fadeInUp}>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-foreground mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  id="register-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full h-11 pl-11 pr-11 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div custom={5} variants={fadeInUp}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="glass-btn-primary w-full h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Crear cuenta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Login link */}
          <motion.div custom={6} variants={fadeInUp} className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('entrar')}
                disabled={isSubmitting}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors disabled:opacity-50"
              >
                Iniciar sesión
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
