'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { GlassSidebar } from '@/components/oasis/glass-sidebar';
import { ContextualTopBar } from '@/components/oasis/contextual-top-bar';
import { MobileBottomBar } from '@/components/oasis/mobile-bottom-bar';
import { BottomSheetNav } from '@/components/oasis/bottom-sheet-nav';
import { ContextualFAB } from '@/components/oasis/contextual-fab';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

import { ChatOverlay } from '@/components/oasis/chat-overlay';
import { useTheme } from 'next-themes';
import { useClinics, usePharmacies } from '@/hooks/use-api';
import apiClient, { getErrorMessage, post } from '@/api/client';

// --- Notification Toast ---
function NotificationToast() {
  const { notification, setNotification } = useAuthStore();

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-teal-500/10 border-teal-500/20',
      text: 'text-teal-800 dark:text-teal-300',
      iconColor: 'text-teal-500',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-800 dark:text-red-300',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-800 dark:text-amber-300',
      iconColor: 'text-amber-500',
    },
    info: {
      icon: Info,
      bg: 'bg-sky-500/10 border-sky-500/20',
      text: 'text-sky-800 dark:text-sky-300',
      iconColor: 'text-sky-500',
    },
  };

  // Auto-dismiss logic
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  return (
    <AnimatePresence>
      {notification && (() => {
        const { icon: Icon, bg, text, iconColor } = config[notification.type as keyof typeof config];
        return (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[90%] sm:max-w-md px-4"
          >
            <div className={cn('flex items-center gap-3 rounded-full border px-5 py-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/20', bg)}>
              <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0 bg-white/20', iconColor)}>
                <Icon className="size-4.5" />
              </div>
              <p className={cn('text-sm font-bold flex-1 leading-tight', text)}>{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="shrink-0 rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="size-4 text-slate-400" />
              </button>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="border-t border-border/30 px-4 py-3">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-[8px]">O</span>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">OASIS</span>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} OASIS — Encuentra tu oasis de salud
        </p>
      </div>
    </footer>
  );
}

// --- Main Layout ---
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showDocModal, setShowDocModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  
  const [minsaFile, setMinsaFile] = useState<File | null>(null);
  const [rucFile, setRucFile] = useState<File | null>(null);
  
  const { data: clinicsData } = useClinics(undefined);
  const { data: pharmaciesData } = usePharmacies(undefined);
  const { setNotification } = useAuthStore();

  useEffect(() => {
    if (user?.verification_deadline) {
      const deadline = new Date(user.verification_deadline).getTime();
      const now = new Date().getTime();
      const diffTime = deadline - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays > 0 ? diffDays : 0);
    }
  }, [user]);

  useEffect(() => {
    const handleOpen = () => setShowDocModal(true);
    window.addEventListener('open-compliance-modal', handleOpen);
    return () => window.removeEventListener('open-compliance-modal', handleOpen);
  }, []);

  const handleUploadDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!minsaFile || !rucFile) {
      setNotification({ type: 'warning', message: 'Por favor selecciona ambos documentos solicitados' });
      return;
    }

    setUploading(true);
    try {
      let targetId = '';
      let targetType: 'doctor' | 'clinic' | 'pharmacy' = 'clinic';

      if (user.role === 'clinic_admin') {
        const owned = clinicsData?.data?.find((c: any) => c.ownerId === user.id || c.owner_id === user.id);
        targetId = owned?.id || '';
      } else if (user.role === 'pharmacy_admin') {
        const owned = pharmaciesData?.data?.find((p: any) => p.ownerId === user.id || p.owner_id === user.id);
        targetId = owned?.id || '';
        targetType = 'pharmacy';
      } else if (user.role === 'doctor') {
        targetId = user.id;
        targetType = 'doctor';
      }

      if (!targetId) {
        throw new Error('No se encontró el establecimiento o perfil asociado para realizar la carga.');
      }

      // Upload MINSA File
      const minsaFormData = new FormData();
      minsaFormData.append('file', minsaFile);
      minsaFormData.append('type', user.role === 'doctor' ? 'license' : 'minsa_certificate');
      minsaFormData.append('targetType', targetType);
      minsaFormData.append('targetId', targetId);

      const minsaRes = await apiClient.post<any>('/documents/upload', minsaFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);

      // Upload RUC File
      const rucFormData = new FormData();
      rucFormData.append('file', rucFile);
      rucFormData.append('type', 'ruc');
      rucFormData.append('targetType', targetType);
      rucFormData.append('targetId', targetId);

      const rucRes = await apiClient.post<any>('/documents/upload', rucFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);

      if (minsaRes.success && rucRes.success) {
        setNotification({ type: 'success', message: 'Documentos cargados con éxito para verificación legal' });
        setUser({
          ...user,
          verification_status: 'submitted'
        });
        setShowDocModal(false);
      } else {
        throw new Error('Error al registrar uno de los documentos.');
      }
    } catch (err) {
      console.error('Compliance upload error:', err);
      setNotification({ type: 'error', message: getErrorMessage(err) || 'Error al subir los documentos sanitarios' });
    } finally {
      setUploading(false);
    }
  };
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Clear query client cache on logout to avoid leaking context/data to another logged-in user
  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Handle ChunkLoadError globally and reload page automatically to fetch the newest deployment
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMsg = event.message || '';
      if (errorMsg.includes('ChunkLoadError') || errorMsg.includes('Failed to load chunk')) {
        console.warn('Oasis Auto-Recovery: ChunkLoadError detected, reloading page...');
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || event.reason?.name || '';
      if (errorMsg.includes('ChunkLoadError') || errorMsg.includes('Failed to load chunk')) {
        console.warn('Oasis Auto-Recovery: ChunkLoadError in promise detected, reloading page...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <OrganicBlobs />
        <main className="relative z-10 flex-1 flex items-center justify-center p-4">
          {children}
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-background relative overflow-hidden">
      <OrganicBlobs />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[260px] shrink-0">
        <GlassSidebar />
      </div>

      {/* Mobile Bottom Sheet */}
      <BottomSheetNav
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        {/* Top Bar */}
        <ContextualTopBar onMenuClick={() => setBottomSheetOpen(true)} />

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0 pb-24 lg:pb-6 space-y-6">
          {/* Banner de Cumplimiento Legal */}
          {user && (user.role === 'clinic_admin' || user.role === 'pharmacy_admin' || user.role === 'doctor') && (
            <AnimatePresence mode="wait">
              {user.verification_status === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent p-4 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ring-1 ring-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                      <AlertTriangle className="size-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        Cumplimiento Legal Obligatorio — MINSA / RUC
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
                        Para operar legalmente en la plataforma Oasis en Nicaragua, debes subir la <strong>Licencia Sanitaria de Funcionamiento emitida por el MINSA</strong> y tu <strong>Cédula RUC</strong>. Tienes un plazo estricto de 14 días desde tu registro o tu cuenta y establecimiento serán bloqueados temporalmente.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-400">
                          ⏳ Plazo restante: {daysRemaining !== null ? `${daysRemaining} días` : 'Cargando...'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocModal(true)}
                    className="self-start md:self-auto px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:shadow-lg hover:shadow-amber-500/20 transition duration-300 active:scale-95 shrink-0"
                  >
                    Subir Documentación
                  </button>
                </motion.div>
              )}

              {user.verification_status === 'submitted' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent p-4 backdrop-blur-md flex items-start gap-3 shadow-lg ring-1 ring-white/10"
                >
                  <div className="size-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 shrink-0 mt-0.5">
                    <CheckCircle className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-800 dark:text-teal-300">
                      Documentación en Revisión
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
                      ¡Excelente! Hemos recibido correctamente tu Licencia Sanitaria del MINSA y Cédula RUC. Nuestro equipo de cumplimiento legal las validará en un período menor a 24 horas. Recibirás una notificación push y por correo.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {children}
        </main>

        {/* Footer — desktop only */}
        <div className="hidden lg:block shrink-0">
          <Footer />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />

      {/* Mobile Contextual FAB */}
      <ContextualFAB />

      <ChatOverlay />
      <NotificationToast />

      {/* Modal de Cumplimiento Legal (MINSA / RUC) */}
      <AnimatePresence>
        {showDocModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/20 overflow-hidden"
            >
              <button
                onClick={() => setShowDocModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cumplimiento Legal Sanitario</h3>
                  <p className="text-xs text-slate-400">Requerido para establecimientos de salud en Nicaragua</p>
                </div>
              </div>

              <form onSubmit={handleUploadDocs} className="space-y-4">
                {/* Licencia Sanitaria del MINSA */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {user?.role === 'doctor' ? 'Cédula Profesional o Licencia MINSA *' : 'Licencia Sanitaria de Funcionamiento (MINSA) *'}
                  </label>
                  <label className="border border-dashed border-white/10 hover:border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition duration-300">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setMinsaFile(e.target.files?.[0] || null)}
                    />
                    {minsaFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="size-8 text-emerald-500 mb-2" />
                        <span className="text-xs font-bold text-white max-w-[320px] truncate">{minsaFile.name}</span>
                        <span className="text-[10px] text-emerald-400 mt-1">{(minsaFile.size / 1024 / 1024).toFixed(2)} MB - Listo</span>
                      </div>
                    ) : (
                      <>
                        <AlertTriangle className="size-8 text-amber-500/60 mb-2" />
                        <span className="text-xs font-bold text-white">Seleccionar archivo PDF / Imagen</span>
                        <span className="text-[10px] text-slate-500 mt-1">Debe estar vigente y visible</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Cédula RUC */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {user?.role === 'doctor' ? 'Título Universitario (PDF/Imagen) *' : 'Cédula RUC o Registro Comercial *'}
                  </label>
                  <label className="border border-dashed border-white/10 hover:border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition duration-300">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setRucFile(e.target.files?.[0] || null)}
                    />
                    {rucFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="size-8 text-emerald-500 mb-2" />
                        <span className="text-xs font-bold text-white max-w-[320px] truncate">{rucFile.name}</span>
                        <span className="text-[10px] text-emerald-400 mt-1">{(rucFile.size / 1024 / 1024).toFixed(2)} MB - Listo</span>
                      </div>
                    ) : (
                      <>
                        <AlertTriangle className="size-8 text-amber-500/60 mb-2" />
                        <span className="text-xs font-bold text-white">Seleccionar archivo PDF / Imagen</span>
                        <span className="text-[10px] text-slate-500 mt-1">Persona Natural o Jurídica</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-2">
                  <AlertTriangle className="size-5 text-amber-500 shrink-0" />
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-normal font-medium text-left">
                    Nota: De acuerdo a la Ley de Regulación Sanitaria de Nicaragua, la falsificación de licencias del MINSA conllevará a la suspensión definitiva y acciones legales con las autoridades correspondientes.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="flex-1 py-3 text-xs font-bold rounded-full bg-white/5 text-slate-300 hover:bg-white/10 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 text-xs font-bold rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Cargando Documentos...</span>
                      </>
                    ) : (
                      <span>Enviar Verificación</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
