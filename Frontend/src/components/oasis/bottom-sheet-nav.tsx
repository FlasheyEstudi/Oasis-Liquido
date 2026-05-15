'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS } from '@/utils/constants';
import type { AppPage, UserRole } from '@/types';
import { motion } from 'framer-motion';
import { Drawer } from 'vaul';
import {
  Home,
  Calendar,
  FileText,
  MapPin,
  Package,
  Stethoscope,
  Shield,
  Pill,
  Truck,
  Sun,
  Moon,
  LogOut,
  User,
  HeadphonesIcon,
  Droplets,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Full navigation items per role (more than bottom bar)
function getAllNavItems(role: UserRole): { page: AppPage; label: string; icon: React.ReactNode }[] {
  switch (role) {
    case 'patient':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-5" /> },
        { page: 'appointments', label: 'Mis Citas', icon: <Calendar className="size-5" /> },
        { page: 'new-appointment', label: 'Agendar Cita', icon: <Calendar className="size-5" /> },
        { page: 'prescriptions', label: 'Mis Recetas', icon: <FileText className="size-5" /> },
        { page: 'pharmacy-map', label: 'Farmacias Cercanas', icon: <MapPin className="size-5" /> },
        { page: 'order-tracking', label: 'Mis Pedidos', icon: <Truck className="size-5" /> },
      ];
    case 'doctor':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-5" /> },
        { page: 'consultation', label: 'Consulta Médica', icon: <Stethoscope className="size-5" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-5" /> },
      ];
    case 'pharmacy_manager':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-5" /> },
        { page: 'fulfillment', label: 'Surtir Receta', icon: <Pill className="size-5" /> },
        { page: 'inventory', label: 'Inventario', icon: <Package className="size-5" /> },
        { page: 'order-management', label: 'Pedidos', icon: <FileText className="size-5" /> },
      ];
    case 'delivery_driver':
      return [
        { page: 'driver-home', label: 'Inicio', icon: <Home className="size-5" /> },
        { page: 'delivery-detail', label: 'Entregas', icon: <Truck className="size-5" /> },
      ];
    case 'admin':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-5" /> },
        { page: 'manage-clinics', label: 'Clínicas', icon: <MapPin className="size-5" /> },
        { page: 'manage-pharmacies', label: 'Farmacias', icon: <Pill className="size-5" /> },
        { page: 'manage-users', label: 'Usuarios', icon: <Shield className="size-5" /> },
        { page: 'audit-logs', label: 'Auditoría', icon: <FileText className="size-5" /> },
      ];
    case 'receptionist':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-5" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-5" /> },
      ];
    default:
      return [];
  }
}

interface BottomSheetNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BottomSheetNav({ open, onOpenChange }: BottomSheetNavProps) {
  const { user, currentPage, navigate, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const navItems = getAllNavItems(user.role);
  const firstName = user.name?.split(' ')[0] || 'Usuario';

  const handleNavigate = (page: AppPage) => {
    navigate(page);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <Drawer.Portal>
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[85vh] flex-col rounded-t-3xl bg-background border-t border-border/50">
          <Drawer.Title className="sr-only">Navegación de Oasis</Drawer.Title>
          <Drawer.Description className="sr-only">Menú principal de navegación para el usuario</Drawer.Description>
          
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Droplets className="size-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{firstName}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
              <Drawer.Close className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground">
                <ChevronRight className="size-5 rotate-90" />
              </Drawer.Close>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = currentPage === item.page;
                return (
                  <motion.button
                    key={item.page}
                    onClick={() => handleNavigate(item.page)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-xl px-3 py-3 transition-colors',
                      isActive
                        ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-muted/50'
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
                    )}
                  </motion.button>
                );
              })}
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="border-t border-border/30 px-3 py-3 space-y-0.5">
            <button
              onClick={() => { handleNavigate('profile'); }}
              className={cn(
                'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-colors',
                currentPage === 'profile'
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-muted/50'
              )}
            >
              <User className="size-5 shrink-0" />
              <span className="text-sm font-medium">Mi Perfil</span>
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-muted/50 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="size-5 shrink-0" />
              ) : (
                <Moon className="size-5 shrink-0" />
              )}
              <span className="text-sm font-medium">
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </span>
            </button>

            <button
              onClick={() => { logout(); onOpenChange(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-colors"
            >
              <LogOut className="size-5 shrink-0" />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
