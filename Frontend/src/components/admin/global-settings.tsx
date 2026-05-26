'use client';

import { useState, useEffect } from 'react';
import { 
  Sliders, 
  CheckCircle2, 
  Loader2, 
  DollarSign, 
  Percent, 
  Truck, 
  AlertCircle,
  User,
  Settings,
  Languages,
  Shield,
  Clock,
  Bell,
  Mail,
  Smartphone,
  Lock,
  Calendar,
  Activity,
  Package,
  CheckCircle,
  Store,
  MapPin
} from 'lucide-react';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserSettings, 
  updateUserSettings, 
  getClinicSettings, 
  updateClinicSettings, 
  getPharmacySettings, 
  updatePharmacySettings, 
  type UserSettings, 
  type ClinicSettings, 
  type PharmacySettings 
} from '@/api/settings';
import { useGlobalSettings, useUpdateGlobalSetting } from '@/hooks/use-api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsTab = 'profile' | 'clinic' | 'pharmacy' | 'global';

export function GlobalSettingsPanel() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Tab control based on role
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Super Admin Global settings hooks
  const { data: globalSettingsResult, isLoading: isGlobalLoading, refetch: refetchGlobal } = useGlobalSettings({
    enabled: user?.role === 'admin'
  });
  const updateGlobalSetting = useUpdateGlobalSetting();

  // 1. Fetch User Settings
  const { data: userSettings, isLoading: isUserLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
    enabled: !!user,
  });

  // 2. Fetch Clinic Settings (only for clinic_admin)
  const isClinicAdmin = user?.role === 'clinic_admin';
  const { data: clinicSettings, isLoading: isClinicLoading } = useQuery({
    queryKey: ['clinicSettings'],
    queryFn: getClinicSettings,
    enabled: !!user && isClinicAdmin,
  });

  // 3. Fetch Pharmacy Settings (only for pharmacy_admin)
  const isPharmacyAdmin = user?.role === 'pharmacy_admin';
  const { data: pharmacySettings, isLoading: isPharmacyLoading } = useQuery({
    queryKey: ['pharmacySettings'],
    queryFn: getPharmacySettings,
    enabled: !!user && isPharmacyAdmin,
  });

  // Local state for Global Super Admin
  const [globalDeliveryFee, setGlobalDeliveryFee] = useState('15.00');
  const [globalVat, setGlobalVat] = useState('15.00');
  const [globalCoverageRadius, setGlobalCoverageRadius] = useState('15');
  const [globalMaxDocUploadDays, setGlobalMaxDocUploadDays] = useState('30');

  // Local state for User settings
  const [lang, setLang] = useState('es');
  const [theme, setTheme] = useState('dark');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  // Local state for Clinic settings
  const [clinicConsultationFee, setClinicConsultationFee] = useState(500);
  const [clinicOnlineBooking, setClinicOnlineBooking] = useState(true);
  const [clinicPreBookingDays, setClinicPreBookingDays] = useState(30);
  const [clinicCancelHours, setClinicCancelHours] = useState(24);
  const [clinicAutoReminders, setClinicAutoReminders] = useState(true);
  const [clinicReminderChannel, setClinicReminderChannel] = useState('email');
  const [clinicBreakTime, setClinicBreakTime] = useState(15);

  // Local state for Pharmacy settings
  const [pharmacyLowStockAlert, setPharmacyLowStockAlert] = useState(true);
  const [pharmacyMinStockAlert, setPharmacyMinStockAlert] = useState(10);
  const [pharmacyNearExpiryDays, setPharmacyNearExpiryDays] = useState(90);
  const [pharmacyDeliveryFeeDefault, setPharmacyDeliveryFeeDefault] = useState(40);
  const [pharmacyCashOnDelivery, setPharmacyCashOnDelivery] = useState(true);
  const [pharmacyCardOnDelivery, setPharmacyCardOnDelivery] = useState(true);
  const [pharmacyAutoReorder, setPharmacyAutoReorder] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Initialize states
  useEffect(() => {
    if (userSettings) {
      setLang(userSettings.language);
      setTheme(userSettings.theme);
      setEmailNotif(userSettings.emailNotifications);
      setPushNotif(userSettings.pushNotifications);
      setSmsNotif(userSettings.smsNotifications);
      setTwoFactor(userSettings.twoFactorEnabled);
      setSessionTimeout(userSettings.sessionTimeoutMinutes);
    }
  }, [userSettings]);

  useEffect(() => {
    if (clinicSettings) {
      setClinicConsultationFee(clinicSettings.consultationFeeDefault);
      setClinicOnlineBooking(clinicSettings.allowOnlineBooking);
      setClinicPreBookingDays(clinicSettings.preBookingDaysLimit);
      setClinicCancelHours(clinicSettings.cancellationHoursLimit);
      setClinicAutoReminders(clinicSettings.sendAutomaticReminders);
      setClinicReminderChannel(clinicSettings.reminderChannel);
      setClinicBreakTime(clinicSettings.doctorBreakTimeMinutes);
    }
  }, [clinicSettings]);

  useEffect(() => {
    if (pharmacySettings) {
      setPharmacyLowStockAlert(pharmacySettings.lowStockAlertEnabled);
      setPharmacyMinStockAlert(pharmacySettings.minStockAlertThreshold);
      setPharmacyNearExpiryDays(pharmacySettings.medicineNearExpiryDays);
      setPharmacyDeliveryFeeDefault(pharmacySettings.deliveryFeeDefault);
      setPharmacyCashOnDelivery(pharmacySettings.allowCashOnDelivery);
      setPharmacyCardOnDelivery(pharmacySettings.allowCardOnDelivery);
      setPharmacyAutoReorder(pharmacySettings.autoReorderEnabled);
    }
  }, [pharmacySettings]);

  useEffect(() => {
    const globalSettings = globalSettingsResult?.data ?? globalSettingsResult ?? [];
    if (globalSettings && Array.isArray(globalSettings)) {
      const deliveryFeeSetting = globalSettings.find((s: any) => s.key === 'delivery_fee_per_km');
      const vatSetting = globalSettings.find((s: any) => s.key === 'vat_percentage');
      const coverageRadiusSetting = globalSettings.find((s: any) => s.key === 'delivery_coverage_radius_km');
      const maxDocUploadDaysSetting = globalSettings.find((s: any) => s.key === 'max_document_upload_days');
      if (deliveryFeeSetting) setGlobalDeliveryFee(deliveryFeeSetting.value);
      if (vatSetting) setGlobalVat(vatSetting.value);
      if (coverageRadiusSetting) setGlobalCoverageRadius(coverageRadiusSetting.value);
      if (maxDocUploadDaysSetting) setGlobalMaxDocUploadDays(maxDocUploadDaysSetting.value);
    }
  }, [globalSettingsResult]);

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) => updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast.success('Preferencias de cuenta actualizadas');
    },
    onError: () => toast.error('Error al actualizar preferencias'),
  });

  const updateClinicMutation = useMutation({
    mutationFn: (data: Partial<ClinicSettings>) => updateClinicSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicSettings'] });
      toast.success('Configuración de clínica guardada exitosamente');
    },
    onError: () => toast.error('Error al guardar configuración de clínica'),
  });

  const updatePharmacyMutation = useMutation({
    mutationFn: (data: Partial<PharmacySettings>) => updatePharmacySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacySettings'] });
      toast.success('Configuración de farmacia guardada exitosamente');
    },
    onError: () => toast.error('Error al guardar configuración de farmacia'),
  });

  const handleSaveUserSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate({
      language: lang,
      theme,
      emailNotifications: emailNotif,
      pushNotifications: pushNotif,
      smsNotifications: smsNotif,
      twoFactorEnabled: twoFactor,
      sessionTimeoutMinutes: Number(sessionTimeout),
    });
  };

  const handleSaveClinicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicMutation.mutate({
      consultationFeeDefault: Number(clinicConsultationFee),
      allowOnlineBooking: clinicOnlineBooking,
      preBookingDaysLimit: Number(clinicPreBookingDays),
      cancellationHoursLimit: Number(clinicCancelHours),
      sendAutomaticReminders: clinicAutoReminders,
      reminderChannel: clinicReminderChannel,
      doctorBreakTimeMinutes: Number(clinicBreakTime),
    });
  };

  const handleSavePharmacySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePharmacyMutation.mutate({
      lowStockAlertEnabled: pharmacyLowStockAlert,
      minStockAlertThreshold: Number(pharmacyMinStockAlert),
      medicineNearExpiryDays: Number(pharmacyNearExpiryDays),
      deliveryFeeDefault: Number(pharmacyDeliveryFeeDefault),
      allowCashOnDelivery: pharmacyCashOnDelivery,
      allowCardOnDelivery: pharmacyCardOnDelivery,
      autoReorderEnabled: pharmacyAutoReorder,
    });
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateGlobalSetting.mutateAsync({
        key: 'delivery_fee_per_km',
        value: parseFloat(globalDeliveryFee).toFixed(2)
      });
      await updateGlobalSetting.mutateAsync({
        key: 'vat_percentage',
        value: parseFloat(globalVat).toFixed(2)
      });
      await updateGlobalSetting.mutateAsync({
        key: 'delivery_coverage_radius_km',
        value: String(parseInt(globalCoverageRadius) || 15)
      });
      await updateGlobalSetting.mutateAsync({
        key: 'max_document_upload_days',
        value: String(parseInt(globalMaxDocUploadDays) || 30)
      });
      toast.success('Configuración global de Oasis actualizada');
      refetchGlobal();
    } catch {
      toast.error('Error al guardar la configuración global');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || (isClinicAdmin && isClinicLoading) || (isPharmacyAdmin && isPharmacyLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="size-10 animate-spin text-teal-600 dark:text-teal-400" />
        <p className="text-sm text-muted-foreground animate-pulse">Cargando tu panel de configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-6 text-teal-600 dark:text-teal-400" />
          Ajustes del Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configura tus preferencias de cuenta, seguridad y configuraciones operativas de tu rol.
        </p>
      </div>

      {/* Tabs list (responsive sliding pills) */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5",
            activeTab === 'profile'
              ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/5"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <User className="size-4" />
          Cuenta & Notificaciones
        </button>

        {isClinicAdmin && (
          <button
            onClick={() => setActiveTab('clinic')}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5",
              activeTab === 'clinic'
                ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <MapPin className="size-4" />
            Parámetros de Clínica
          </button>
        )}

        {isPharmacyAdmin && (
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5",
              activeTab === 'pharmacy'
                ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Store className="size-4" />
            Parámetros de Farmacia
          </button>
        )}

        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('global')}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5",
              activeTab === 'global'
                ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Sliders className="size-4" />
            Configuración Global (Oasis)
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <form onSubmit={handleSaveUserSettings} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Preferences */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Languages className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Idioma & Apariencia</h3>
                        <p className="text-[10px] text-muted-foreground">Configuración visual general</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Language Selection */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Idioma Preferido</Label>
                        <select
                          value={lang}
                          onChange={(e) => setLang(e.target.value)}
                          className="h-11 rounded-xl glass-input w-full px-3 text-xs bg-transparent border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          <option value="es" className="dark:bg-slate-900">Español (Nicaragua)</option>
                          <option value="en" className="dark:bg-slate-900">Inglés (EE. UU.)</option>
                        </select>
                      </div>

                      {/* Theme */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Tema Visual</Label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          className="h-11 rounded-xl glass-input w-full px-3 text-xs bg-transparent border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          <option value="dark" className="dark:bg-slate-900">Modo Oscuro (Glassmorphism)</option>
                          <option value="light" className="dark:bg-slate-900">Modo Claro (Clean)</option>
                        </select>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Security */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <Shield className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Seguridad & Sesión</h3>
                        <p className="text-[10px] text-muted-foreground">Protección de acceso</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Session Timeout */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          Tiempo de Expiración (Minutos)
                        </Label>
                        <Input 
                          type="number"
                          min="5"
                          max="120"
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(Number(e.target.value))}
                          className="h-11 rounded-xl glass-input w-full px-3 font-semibold text-xs"
                        />
                      </div>

                      {/* Two Factor Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Lock className="size-3.5 text-violet-500" />
                            Autenticación Multifactor (2FA)
                          </Label>
                          <p className="text-[10px] text-muted-foreground">Exigir código PIN adicional al iniciar sesión</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={twoFactor}
                          onChange={(e) => setTwoFactor(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Notifications Channel Settings */}
                  <GlassCard className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Bell className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Canales de Notificación</h3>
                        <p className="text-[10px] text-muted-foreground">Decide cómo quieres recibir las alertas del sistema</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Email Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="flex items-center gap-2">
                          <Mail className="size-4 text-rose-500" />
                          <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Correo Electrónico</Label>
                            <p className="text-[9px] text-muted-foreground">Alertas en tu correo</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={emailNotif}
                          onChange={(e) => setEmailNotif(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>

                      {/* Push Notifications Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="flex items-center gap-2">
                          <Smartphone className="size-4 text-sky-500" />
                          <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Notificaciones Push</Label>
                            <p className="text-[9px] text-muted-foreground">Campana & escritorio</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={pushNotif}
                          onChange={(e) => setPushNotif(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>

                      {/* SMS Notifications Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="flex items-center gap-2">
                          <Smartphone className="size-4 text-emerald-500" />
                          <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Mensajes de Texto (SMS)</Label>
                            <p className="text-[9px] text-muted-foreground">Alertas telefónicas</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={smsNotif}
                          onChange={(e) => setSmsNotif(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="h-11 font-bold px-6 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 rounded-xl text-xs"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-2" />
                        Guardar Preferencias
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'clinic' && isClinicAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <form onSubmit={handleSaveClinicSettings} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Financial & Appointments */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Tarifas & Agendamiento</h3>
                        <p className="text-[10px] text-muted-foreground">Configura los límites de citas</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Default Consultation Fee */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Tarifa de Consulta por Defecto (NIO)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">C$</span>
                          <Input 
                            type="number"
                            min="0"
                            value={clinicConsultationFee}
                            onChange={(e) => setClinicConsultationFee(Number(e.target.value))}
                            className="pl-8 h-11 rounded-xl glass-input w-full font-bold text-xs"
                          />
                        </div>
                      </div>

                      {/* Doctor Break Time */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Intervalo de Descanso Médico (Minutos)</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="60"
                          value={clinicBreakTime}
                          onChange={(e) => setClinicBreakTime(Number(e.target.value))}
                          className="h-11 rounded-xl glass-input w-full px-3 text-xs"
                        />
                      </div>

                      {/* Online Booking Switch */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Permitir Reservas Online</Label>
                          <p className="text-[10px] text-muted-foreground">Los pacientes agendan desde su portal</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={clinicOnlineBooking}
                          onChange={(e) => setClinicOnlineBooking(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Limits and reminders */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Calendar className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Plazos & Recordatorios Automáticos</h3>
                        <p className="text-[10px] text-muted-foreground">Configura los límites de tiempo</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Pre booking Days Limit */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Antelación Máxima para Reservas (Días)</Label>
                        <Input 
                          type="number"
                          min="1"
                          max="180"
                          value={clinicPreBookingDays}
                          onChange={(e) => setClinicPreBookingDays(Number(e.target.value))}
                          className="h-11 rounded-xl glass-input w-full px-3 text-xs"
                        />
                      </div>

                      {/* Cancellation hours Limit */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Límite para Cancelar sin Cargo (Horas)</Label>
                        <Input 
                          type="number"
                          min="1"
                          max="72"
                          value={clinicCancelHours}
                          onChange={(e) => setClinicCancelHours(Number(e.target.value))}
                          className="h-11 rounded-xl glass-input w-full px-3 text-xs"
                        />
                      </div>

                      {/* Automatic Reminder Switch */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Enviar Recordatorios Automáticos</Label>
                          <p className="text-[10px] text-muted-foreground">Alertas 24 horas antes de la cita</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={clinicAutoReminders}
                          onChange={(e) => setClinicAutoReminders(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>

                      {/* Reminder Channel Selection */}
                      {clinicAutoReminders && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Canal de Recordatorio</Label>
                          <select
                            value={clinicReminderChannel}
                            onChange={(e) => setClinicReminderChannel(e.target.value)}
                            className="h-11 rounded-xl glass-input w-full px-3 text-xs bg-transparent border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            <option value="email" className="dark:bg-slate-900">Correo Electrónico (Gratis)</option>
                            <option value="whatsapp" className="dark:bg-slate-900">WhatsApp Business</option>
                            <option value="sms" className="dark:bg-slate-900">Mensajería SMS</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="h-11 font-bold px-6 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 rounded-xl text-xs"
                    disabled={updateClinicMutation.isPending}
                  >
                    {updateClinicMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-2" />
                        Guardar Parámetros de Clínica
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'pharmacy' && isPharmacyAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <form onSubmit={handleSavePharmacySettings} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Stock and Expiry */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Package className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Inventario & Alertas FEFO</h3>
                        <p className="text-[10px] text-muted-foreground">Configura los límites de stock</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Stock Alert Switch */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Alerta de Stock Mínimo Activa</Label>
                          <p className="text-[10px] text-muted-foreground">Notificación instantánea ante desabastecimiento</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={pharmacyLowStockAlert}
                          onChange={(e) => setPharmacyLowStockAlert(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>

                      {/* Stock threshold */}
                      {pharmacyLowStockAlert && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Umbral Crítico de Stock (Unidades)</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={pharmacyMinStockAlert}
                            onChange={(e) => setPharmacyMinStockAlert(Number(e.target.value))}
                            className="h-11 rounded-xl glass-input w-full px-3 text-xs"
                          />
                        </div>
                      )}

                      {/* Expiry limit */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Antelación para Alerta de Vencimiento (Días)</Label>
                        <Input 
                          type="number"
                          min="15"
                          max="365"
                          value={pharmacyNearExpiryDays}
                          onChange={(e) => setPharmacyNearExpiryDays(Number(e.target.value))}
                          className="h-11 rounded-xl glass-input w-full px-3 text-xs"
                        />
                      </div>

                      {/* Auto reorder Switch */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Reordenamiento Automático</Label>
                          <p className="text-[10px] text-muted-foreground">Genera órdenes de compra automáticas al proveedor</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={pharmacyAutoReorder}
                          onChange={(e) => setPharmacyAutoReorder(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Delivery & Payments */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Truck className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Delivery & Medios de Pago</h3>
                        <p className="text-[10px] text-muted-foreground">Establece precios y cobros</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Default Delivery Fee */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Tarifa Base de Envío a Domicilio (NIO)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">C$</span>
                          <Input 
                            type="number"
                            min="0"
                            value={pharmacyDeliveryFeeDefault}
                            onChange={(e) => setPharmacyDeliveryFeeDefault(Number(e.target.value))}
                            className="pl-8 h-11 rounded-xl glass-input w-full font-bold text-xs"
                          />
                        </div>
                      </div>

                      {/* COD Switch */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Permitir Pago en Efectivo (Contra Entrega)</Label>
                          <p className="text-[10px] text-muted-foreground">El repartidor recibe billetes físicos</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={pharmacyCashOnDelivery}
                          onChange={(e) => setPharmacyCashOnDelivery(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>

                      {/* Card on Delivery Switch */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-500/[0.02]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Permitir Pago con Tarjeta (POS Móvil)</Label>
                          <p className="text-[10px] text-muted-foreground">El repartidor lleva datáfono inalámbrico</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={pharmacyCardOnDelivery}
                          onChange={(e) => setPharmacyCardOnDelivery(e.target.checked)}
                          className="size-4 rounded accent-teal-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="h-11 font-bold px-6 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 rounded-xl text-xs"
                    disabled={updatePharmacyMutation.isPending}
                  >
                    {updatePharmacyMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-2" />
                        Guardar Parámetros de Farmacia
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'global' && user?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <form onSubmit={handleSaveGlobalSettings} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tarifa de Delivery */}
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Truck className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Tarifas de Delivery</h3>
                        <p className="text-[10px] text-muted-foreground">Parámetro: `delivery_fee_per_km`</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Costo por Kilómetro (NIO)</Label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">C$</span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            value={globalDeliveryFee}
                            onChange={(e) => setGlobalDeliveryFee(e.target.value)}
                            className="pl-8 h-11 rounded-xl glass-input w-full font-bold text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Monto cobrado al paciente por cada kilómetro de ruta calculado entre la farmacia y la dirección de entrega del pedido.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Impuestos / IVA */}
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Percent className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Impuestos Generales</h3>
                        <p className="text-[10px] text-muted-foreground">Parámetro: `vat_percentage`</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Porcentaje del IVA (%)</Label>
                        <div className="relative">
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={globalVat}
                            onChange={(e) => setGlobalVat(e.target.value)}
                            className="pr-8 h-11 rounded-xl glass-input w-full font-bold text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Porcentaje de Impuesto sobre el Valor Agregado (IVA) nacional que se aplica a los servicios médicos y compra de medicamentos en POS.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Radio de Cobertura de Entregas */}
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Cobertura de Entrega</h3>
                        <p className="text-[10px] text-muted-foreground">Parámetro: `delivery_coverage_radius_km`</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Radio de Cobertura (km)</Label>
                        <div className="relative">
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">km</span>
                          <Input 
                            type="number"
                            min="1"
                            max="500"
                            value={globalCoverageRadius}
                            onChange={(e) => setGlobalCoverageRadius(e.target.value)}
                            className="pr-8 h-11 rounded-xl glass-input w-full font-bold text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Radio geográfico máximo permitido para el despacho a domicilio de medicamentos medido en kilómetros radiales desde cada farmacia local.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Plazo Máximo de Carga de Documentos */}
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Clock className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Plazo Máximo de Documentos</h3>
                        <p className="text-[10px] text-muted-foreground">Parámetro: `max_document_upload_days`</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Plazo Límite (días)</Label>
                        <div className="relative">
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">días</span>
                          <Input 
                            type="number"
                            min="1"
                            max="365"
                            value={globalMaxDocUploadDays}
                            onChange={(e) => setGlobalMaxDocUploadDays(e.target.value)}
                            className="pr-8 h-11 rounded-xl glass-input w-full font-bold text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Límite de días permitidos para que el personal de clínicas o farmacias cargue certificaciones y documentación requerida antes del bloqueo preventivo.
                      </p>
                    </div>
                  </GlassCard>
                </div>

                {/* Audit Disclaimer */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400">
                  <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Aviso de seguridad y auditoría:</strong> Al guardar estos parámetros, se generará una entrada inmutable de auditoría a tu nombre detallando los valores modificados, tu dirección IP y tu información del dispositivo para cumplir con el estándar normativo.
                  </p>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  <Button 
                    type="submit"
                    className="h-11 font-bold px-6 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 rounded-xl text-xs"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-2" />
                        Guardar Configuración Global
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
