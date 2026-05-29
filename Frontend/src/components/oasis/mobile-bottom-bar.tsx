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

  // Group all navigation items including Profile for a unified coordinate loop
  const allItems = [
    ...navItems,
    { page: 'profile' as AppPage, label: 'Perfil', icon: <User className="size-[20px]" /> }
  ];

  // Calculate coordinates dynamically based on the current page
  const activeIndex = currentPage === 'profile'
    ? navItems.length
    : Math.max(0, navItems.findIndex(item => item.page === currentPage));
  const totalItems = allItems.length;

  // Render high-contrast simple layout with text labels if accessibility mode (Elderly) is active
  if (isElderlyMode) {
    return (
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.15 }}
        className="fixed bottom-5 left-3 right-3 z-50 lg:hidden max-w-lg mx-auto transition-all duration-300"
      >
        <div className="bg-white/95 dark:bg-zinc-950/95 border border-amber-500/25 ring-4 ring-amber-500/10 rounded-[2.25rem] flex items-center justify-around shadow-2xl backdrop-blur-xl select-none py-2.5 px-3">
          {allItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <motion.button
                key={item.page}
                onClick={() => navigate(item.page)}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 flex-1 text-center py-2 gap-1.5',
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-350'
                )}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-droplet-elderly"
                      className="absolute inset-0 rounded-[1.25rem] bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/5 z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}
                </AnimatePresence>

                <span className={cn(
                  "relative z-10 transition-transform duration-300",
                  isActive && "scale-105"
                )}>
                  {item.icon}
                </span>

                <span className="relative z-10 font-black uppercase tracking-wider leading-none text-[11px]">
                  {item.label}
                </span>

                {isActive && (
                  <motion.span 
                    layoutId="mobile-nav-active-dot-elderly"
                    className="absolute bottom-1 size-1 rounded-full bg-amber-500" 
                    transition={{ type: 'spring', stiffness: 385, damping: 28 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    );
  }

  // --- Premium Translucent Curved Pill Layout (Original Glass Colors + Teal Accent) ---
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.15 }}
      className="fixed bottom-5 left-4 right-4 z-50 lg:hidden max-w-lg mx-auto transition-all duration-300 select-none"
    >
      <div className="bg-white/80 dark:bg-zinc-950/80 border border-slate-200/50 dark:border-white/10 rounded-[2.25rem] flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl py-2 px-3 relative overflow-hidden">
        
        {/* Subtle holographic glare effect inside the navbar */}
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 via-transparent to-emerald-500/5 opacity-60 pointer-events-none" />

        {allItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <motion.button
              key={item.page}
              onClick={() => navigate(item.page)}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 flex-1 text-center py-1.5 gap-1 z-10',
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-extrabold'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-350'
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
                isActive && "scale-110"
              )}>
                {item.icon}
              </span>

              {/* Label */}
              <span className={cn(
                'relative z-10 font-black uppercase tracking-wider leading-none text-[9px]',
                isActive ? 'text-teal-650 dark:text-teal-400' : 'text-slate-500 dark:text-zinc-500'
              )}>
                {item.label}
              </span>

              {/* Active bottom anchor dot */}
              {isActive && (
                <motion.span 
                  layoutId="mobile-nav-active-dot"
                  className="absolute bottom-0.5 size-1 rounded-full bg-teal-500" 
                  transition={{ type: 'spring', stiffness: 385, damping: 28 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
