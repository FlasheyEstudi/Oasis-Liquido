'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { APP_NAME, ROLE_LABELS, ROLE_COLORS } from '@/utils/constants';
import type { AppPage, UserRole } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
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
  Droplets,
  MessageSquare,
  Users,
  Activity,
  DollarSign,
  Store,
  Settings,
  Pin,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Navigation items per role
function getNavItems(role: UserRole): { page: AppPage; label: string; icon: React.ReactNode }[] {
  switch (role) {
    case 'clinic_admin':
      return [
        { page: 'manage-clinics', label: 'Mi Clínica', icon: <MapPin className="size-[18px]" /> },
        { page: 'appointments', label: 'Agenda & Citas', icon: <Calendar className="size-[18px]" /> },
        { page: 'consultation', label: 'Consulta / ECE', icon: <Stethoscope className="size-[18px]" /> },
        { page: 'clinic-staff', label: 'Mi Personal', icon: <Users className="size-[18px]" /> },
        { page: 'clinic-finances', label: 'Arqueo de Caja', icon: <DollarSign className="size-[18px]" /> },
        { page: 'clinic-analytics', label: 'Métricas & KPIs', icon: <Activity className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'pharmacy_admin':
      return [
        { page: 'manage-pharmacies', label: 'Mi Farmacia', icon: <Store className="size-[18px]" /> },
        { page: 'inventory', label: 'Inventario FEFO', icon: <Package className="size-[18px]" /> },
        { page: 'fulfillment', label: 'Surtir Receta', icon: <Pill className="size-[18px]" /> },
        { page: 'pos', label: 'Punto de Venta (POS)', icon: <DollarSign className="size-[18px]" /> },
        { page: 'order-management', label: 'Pedidos Delivery', icon: <Truck className="size-[18px]" /> },
        { page: 'pharmacy-staff', label: 'Mi Personal', icon: <Users className="size-[18px]" /> },
        { page: 'pharmacy-finances', label: 'Arqueo de Caja', icon: <DollarSign className="size-[18px]" /> },
        { page: 'pharmacy-analytics', label: 'Métricas & KPIs', icon: <Activity className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'patient':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-[18px]" /> },
        { page: 'new-appointment', label: 'Agendar', icon: <Calendar className="size-[18px]" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-[18px]" /> },
        { page: 'pharmacy-map', label: 'Farmacias', icon: <MapPin className="size-[18px]" /> },
        { page: 'order-tracking', label: 'Mis Pedidos', icon: <Truck className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'doctor':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'consultation', label: 'Consulta', icon: <Stethoscope className="size-[18px]" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'pharmacy_manager':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'fulfillment', label: 'Surtir Receta', icon: <Pill className="size-[18px]" /> },
        { page: 'inventory', label: 'Inventario', icon: <Package className="size-[18px]" /> },
        { page: 'order-management', label: 'Pedidos', icon: <FileText className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'delivery_driver':
      return [
        { page: 'driver-home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'delivery-detail', label: 'Entregas', icon: <Truck className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'admin':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'manage-clinics', label: 'Clínicas', icon: <MapPin className="size-[18px]" /> },
        { page: 'manage-pharmacies', label: 'Farmacias', icon: <Pill className="size-[18px]" /> },
        { page: 'manage-users', label: 'Usuarios', icon: <Shield className="size-[18px]" /> },
        { page: 'manage-documents', label: 'Acreditaciones', icon: <FileText className="size-[18px]" /> },
        { page: 'audit-logs', label: 'Auditoría', icon: <FileText className="size-[18px]" /> },
        { page: 'manage-feedback', label: 'Beta Feedback', icon: <MessageSquare className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    case 'receptionist':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-[18px]" /> },
        { page: 'manage-settings', label: 'Configuración', icon: <Settings className="size-[18px]" /> },
      ];
    default:
      return [];
  }
}

export function GlassSidebar() {
  const { user, currentPage, navigate, logout } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('oasis_sidebar_pinned');
      setPinned(saved === 'true');
    }
  }, []);

  const handleTogglePin = () => {
    const nextPinned = !pinned;
    setPinned(nextPinned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('oasis_sidebar_pinned', String(nextPinned));
    }
  };

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const expanded = pinned || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: expanded ? '260px' : '70px' }}
      className="hidden lg:flex glass-sidebar clarity-shield sticky left-0 top-0 h-screen z-40 flex-col overflow-hidden shrink-0 border-r border-sidebar-border transition-all duration-300 ease-in-out"
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-sidebar-border gap-2">
        <motion.button
          onClick={() => navigate('inicio')}
          className="flex items-center gap-3 overflow-hidden flex-1"
          whileTap={{ scale: 0.95 }}
        >
          <div className="size-9 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Droplets className="size-5 text-white" />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="font-extrabold text-lg tracking-tight text-teal-700 dark:text-teal-400 whitespace-nowrap"
              >
                OASIS
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        
        {expanded && (
          <button
            onClick={handleTogglePin}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-slate-500/10 transition-colors shrink-0"
            title={pinned ? "Desfijar barra lateral" : "Fijar barra lateral"}
          >
            <Pin className={cn("size-4 transition-transform", pinned && "rotate-45 text-teal-500 fill-teal-500/20")} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <motion.button
                key={item.page}
                onClick={() => navigate(item.page)}
                onMouseEnter={() => setHoveredItem(item.page)}
                onMouseLeave={() => setHoveredItem(null)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex items-center gap-3 w-full rounded-xl transition-all duration-200',
                  expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
                  isActive
                    ? 'bg-teal-500/[0.08] dark:bg-teal-400/[0.08] border border-teal-500/15 dark:border-teal-400/15 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] text-teal-700 dark:text-teal-400 font-semibold'
                    : 'border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/5'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-teal-500 dark:bg-teal-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <span className="relative z-10 shrink-0">{item.icon}</span>

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {!expanded && hoveredItem === item.page && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg glass-strong text-sm font-medium text-foreground whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>


      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {/* Profile */}
        <motion.button
          onClick={() => navigate('profile')}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
            expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
            currentPage === 'profile'
              ? 'bg-teal-500/[0.08] dark:bg-teal-400/[0.08] border border-teal-500/15 dark:border-teal-400/15 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.06),inset_2px_2px_6px_rgba(0,0,0,0.15)] text-teal-700 dark:text-teal-400 font-semibold'
              : 'border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/5'
          )}
        >
          <User className="size-[18px] shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Perfil
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Theme Toggle */}
        {mounted && (
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
              expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
              'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/5'
            )}
          >
            {theme === 'dark' ? <Sun className="size-[18px] shrink-0" /> : <Moon className="size-[18px] shrink-0" />}
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Beta Feedback Trigger */}
        <motion.button
          onClick={() => window.dispatchEvent(new CustomEvent('open-beta-feedback'))}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
            expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
            'text-slate-500 dark:text-slate-400 hover:text-teal-500 hover:bg-teal-500/5'
          )}
        >
          <MessageSquare className="size-[18px] shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Enviar Feedback
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Logout */}
        <motion.button
          onClick={logout}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
            expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
            'text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5'
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

      </div>
    </aside>
  );
}
