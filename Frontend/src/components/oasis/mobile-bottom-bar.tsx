'use client';

import { useAuthStore } from '@/store/auth-store';
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
  Users,
  DollarSign,
  Activity,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation items per role — only 3-4 most important
function getMobileNavItems(role: UserRole): { page: AppPage; label: string; icon: React.ReactNode }[] {
  switch (role) {
    case 'clinic_admin':
      return [
        { page: 'manage-clinics', label: 'Clínica', icon: <Building2 className="size-[20px]" /> },
        { page: 'clinic-staff', label: 'Personal', icon: <Users className="size-[20px]" /> },
        { page: 'clinic-finances', label: 'Caja', icon: <DollarSign className="size-[20px]" /> },
        { page: 'clinic-analytics', label: 'Métricas', icon: <Activity className="size-[20px]" /> },
      ];
    case 'pharmacy_admin':
      return [
        { page: 'manage-pharmacies', label: 'Farmacia', icon: <Store className="size-[20px]" /> },
        { page: 'pharmacy-staff', label: 'Personal', icon: <Users className="size-[20px]" /> },
        { page: 'pharmacy-finances', label: 'Caja', icon: <DollarSign className="size-[20px]" /> },
        { page: 'pharmacy-analytics', label: 'Métricas', icon: <Activity className="size-[20px]" /> },
      ];
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

// Fallback dummy for missing icons
const Building2 = (props: any) => <Store {...props} />;

export function MobileBottomBar() {
  const { user, currentPage, navigate, isElderlyMode } = useAuthStore();

  if (!user) return null;

  const navItems = getMobileNavItems(user.role);

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.15 }}
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 lg:hidden max-w-lg mx-auto transition-all duration-300",
        isElderlyMode && "bottom-5 left-3 right-3"
      )}
    >
      <div className={cn(
        "bg-white/70 dark:bg-zinc-950/70 border border-slate-200/50 dark:border-white/10 rounded-[2rem] flex items-center justify-around shadow-2xl backdrop-blur-xl select-none transition-all duration-300",
        isElderlyMode ? "py-2.5 px-3 rounded-[2.25rem] border-amber-500/25 ring-4 ring-amber-500/10" : "py-2 px-2"
      )}>
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <motion.button
              key={item.page}
              onClick={() => navigate(item.page)}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 flex-1 text-center',
                isActive
                  ? 'text-teal-655 dark:text-teal-400 font-extrabold'
                  : 'text-slate-450 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300',
                isElderlyMode ? 'py-2 gap-1.5' : 'py-1.5 gap-0.5'
              )}
            >
              {/* Active sliding droplet background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-droplet"
                    className="absolute inset-0 rounded-[1.25rem] bg-teal-500/10 border border-teal-500/20 shadow-md shadow-teal-500/5 z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon container */}
              <span className={cn(
                "relative z-10 transition-transform duration-300",
                isActive && "scale-105"
              )}>
                {item.icon}
              </span>

              {/* Label */}
              <span className={cn(
                'relative z-10 font-black uppercase tracking-wider leading-none',
                isElderlyMode ? 'text-[11px]' : 'text-[9px]',
                isActive ? 'text-teal-655 dark:text-teal-400' : 'text-slate-500 dark:text-zinc-500'
              )}>
                {item.label}
              </span>

              {/* Active bottom anchor dot */}
              {isActive && (
                <motion.span 
                  layoutId="mobile-nav-active-dot"
                  className="absolute bottom-1 size-1 rounded-full bg-teal-500" 
                  transition={{ type: 'spring', stiffness: 385, damping: 28 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Profile button */}
        <motion.button
          onClick={() => navigate('profile')}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 flex-1 text-center',
            currentPage === 'profile'
              ? 'text-teal-655 dark:text-teal-400 font-extrabold'
              : 'text-slate-450 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-350',
            isElderlyMode ? 'py-2 gap-1.5' : 'py-1.5 gap-0.5'
          )}
        >
          <AnimatePresence>
            {currentPage === 'profile' && (
              <motion.div
                layoutId="mobile-nav-droplet"
                className="absolute inset-0 rounded-[1.25rem] bg-teal-500/10 border border-teal-500/20 shadow-md shadow-teal-500/5 z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
          </AnimatePresence>

          <span className={cn(
            "relative z-10 transition-transform duration-300",
            currentPage === 'profile' && "scale-105"
          )}>
            <User className="size-[20px]" />
          </span>

          <span className={cn(
            'relative z-10 font-black uppercase tracking-wider leading-none',
            isElderlyMode ? 'text-[11px]' : 'text-[9px]',
            currentPage === 'profile' ? 'text-teal-655 dark:text-teal-400' : 'text-slate-500 dark:text-zinc-500'
          )}>
            Perfil
          </span>

          {currentPage === 'profile' && (
            <motion.span 
              layoutId="mobile-nav-active-dot"
              className="absolute bottom-1 size-1 rounded-full bg-teal-500" 
              transition={{ type: 'spring', stiffness: 385, damping: 28 }}
            />
          )}
        </motion.button>
      </div>
    </motion.nav>
  );
}
