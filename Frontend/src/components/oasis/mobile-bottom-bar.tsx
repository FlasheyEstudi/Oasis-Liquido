'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS } from '@/utils/constants';
import type { AppPage, UserRole } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  FileText,
  MapPin,
  Package,
  Stethoscope,
  Pill,
  Truck,
  Shield,
  User,
  Droplets,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation items per role — only 3-4 most important
function getMobileNavItems(role: UserRole): { page: AppPage; label: string; icon: React.ReactNode }[] {
  switch (role) {
    case 'patient':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[20px]" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-[20px]" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-[20px]" /> },
        { page: 'pharmacy-map', label: 'Farmacias', icon: <MapPin className="size-[20px]" /> },
      ];
    case 'doctor':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[20px]" /> },
        { page: 'consultation', label: 'Consulta', icon: <Stethoscope className="size-[20px]" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-[20px]" /> },
      ];
    case 'pharmacy_manager':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[20px]" /> },
        { page: 'fulfillment', label: 'Surtir', icon: <Pill className="size-[20px]" /> },
        { page: 'inventory', label: 'Inventario', icon: <Package className="size-[20px]" /> },
        { page: 'order-management', label: 'Pedidos', icon: <FileText className="size-[20px]" /> },
      ];
    case 'delivery_driver':
      return [
        { page: 'driver-home', label: 'Inicio', icon: <Home className="size-[20px]" /> },
        { page: 'delivery-detail', label: 'Entregas', icon: <Truck className="size-[20px]" /> },
      ];
    case 'admin':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[20px]" /> },
        { page: 'manage-users', label: 'Usuarios', icon: <Shield className="size-[20px]" /> },
        { page: 'manage-clinics', label: 'Clínicas', icon: <MapPin className="size-[20px]" /> },
      ];
    case 'receptionist':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[20px]" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-[20px]" /> },
      ];
    default:
      return [];
  }
}

export function MobileBottomBar() {
  const { user, currentPage, navigate } = useAuthStore();

  if (!user) return null;

  const navItems = getMobileNavItems(user.role);

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
    >
      <div className="glass-strong rounded-2xl px-2 py-1.5 flex items-center justify-around shadow-xl">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <motion.button
              key={item.page}
              onClick={() => navigate(item.page)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
                isActive
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300'
              )}
            >
              {/* Active background pill */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-xl bg-teal-500/10 dark:bg-teal-400/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ position: 'absolute' }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">{item.icon}</span>
              <span className={cn(
                'relative z-10 text-[10px] font-medium leading-tight',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}

        {/* Profile button */}
        <motion.button
          onClick={() => navigate('profile')}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
            currentPage === 'profile'
              ? 'text-teal-700 dark:text-teal-400'
              : 'text-slate-400 dark:text-slate-500'
          )}
        >
          <AnimatePresence>
            {currentPage === 'profile' && (
              <motion.div
                layoutId="mobile-nav-active"
                className="absolute inset-0 rounded-xl bg-teal-500/10 dark:bg-teal-400/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </AnimatePresence>
          <span className="relative z-10">
            <User className="size-[20px]" />
          </span>
          <span className="relative z-10 text-[10px] font-medium leading-tight">Perfil</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
