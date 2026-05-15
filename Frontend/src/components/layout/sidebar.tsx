'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import type { AppPage, UserRole } from '@/types';
import {
  LayoutDashboard,
  Building2,
  Pill,
  Users,
  FileText,
  CalendarDays,
  Home,
  QrCode,
  MapPin,
  ShoppingBag,
  Package,
  Truck,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// --- Navigation items per role ---
interface NavItem {
  page: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { page: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'manage-clinics', label: 'Clínicas', icon: Building2 },
    { page: 'manage-pharmacies', label: 'Farmacias', icon: Pill },
    { page: 'manage-users', label: 'Usuarios', icon: Users },
    { page: 'audit-logs', label: 'Auditoría', icon: FileText },
  ],
  doctor: [
    { page: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'appointments', label: 'Mis Citas', icon: CalendarDays },
  ],
  receptionist: [
    { page: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'appointments', label: 'Citas', icon: CalendarDays },
  ],
  patient: [
    { page: 'home', label: 'Inicio', icon: Home },
    { page: 'appointments', label: 'Mis Citas', icon: CalendarDays },
    { page: 'prescriptions', label: 'Mis Recetas', icon: FileText },
    { page: 'pharmacy-map', label: 'Buscar Farmacias', icon: MapPin },
    { page: 'order-management', label: 'Mis Pedidos', icon: ShoppingBag },
  ],
  pharmacy_manager: [
    { page: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'inventory', label: 'Inventario', icon: Package },
    { page: 'fulfillment', label: 'Recetas (QR)', icon: QrCode },
    { page: 'order-management', label: 'Pedidos', icon: ClipboardList },
  ],
  delivery_driver: [
    { page: 'driver-home', label: 'Mis Entregas', icon: Truck },
  ],
};

// --- Sub-pages that highlight their parent nav item ---
const PARENT_PAGE_MAP: Partial<Record<AppPage, AppPage>> = {
  'new-appointment': 'appointments',
  'appointment-detail': 'appointments',
  'prescription-detail': 'prescriptions',
  'pharmacy-detail': 'pharmacy-map',
  'delivery-request': 'pharmacy-map',
  'order-tracking': 'order-management',
  'consultation': 'appointments',
  'delivery-detail': 'driver-home',
  'profile': 'home',
};

function getActiveParentPage(currentPage: AppPage): AppPage {
  return PARENT_PAGE_MAP[currentPage] ?? currentPage;
}

// --- Sidebar content (shared between desktop and mobile) ---
interface SidebarContentProps {
  collapsed: boolean;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

function SidebarContent({ collapsed, onNavigate, onLogout }: SidebarContentProps) {
  const { user, currentPage } = useAuthStore();

  if (!user) return null;

  const role = user.role;
  const navItems = NAV_ITEMS[role] ?? [];
  const activeParent = getActiveParentPage(currentPage);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* User info at top */}
      <div className={cn(
        'flex items-center gap-3 border-b px-4 py-4',
        collapsed && 'justify-center px-2'
      )}>
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.avatar_url} alt={user.name} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeParent === item.page;
            const Icon = item.icon;

            const navButton = (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn(
                  'size-5 shrink-0',
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                )} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navButton;
          })}
        </nav>
      </ScrollArea>

      {/* Bottom: Logout */}
      <div className="border-t px-2 py-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="size-5 text-gray-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Cerrar sesión
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-5 text-gray-400" />
            <span>Cerrar sesión</span>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Desktop Sidebar ---
interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DesktopSidebar({ collapsed, onToggleCollapse }: DesktopSidebarProps) {
  const { navigate, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        onNavigate={(page) => navigate(page)}
        onLogout={logout}
      />
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-7 z-10 flex size-6 items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5 text-gray-500" />
        ) : (
          <ChevronLeft className="size-3.5 text-gray-500" />
        )}
      </button>
    </aside>
  );
}

// --- Mobile Sidebar (Sheet) ---
interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { navigate, logout } = useAuthStore();

  const handleNavigate = (page: AppPage) => {
    navigate(page);
    onOpenChange(false);
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú de navegación</SheetTitle>
        </SheetHeader>
        <SidebarContent
          collapsed={false}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </SheetContent>
    </Sheet>
  );
}

// --- Page title mapping ---
export const PAGE_TITLES: Record<AppPage, string> = {
  landing: 'MediRed',
  login: 'Iniciar Sesión',
  register: 'Registro',
  'forgot-password': 'Recuperar Contraseña',
  'reset-password': 'Restablecer Contraseña',
  home: 'Dashboard',
  appointments: 'Citas',
  'new-appointment': 'Nueva Cita',
  'appointment-detail': 'Detalle de Cita',
  prescriptions: 'Recetas',
  'prescription-detail': 'Detalle de Receta',
  'pharmacy-map': 'Farmacias',
  'pharmacy-detail': 'Detalle de Farmacia',
  'delivery-request': 'Solicitar Entrega',
  'order-tracking': 'Seguimiento de Pedido',
  consultation: 'Consulta',
  'manage-clinics': 'Clínicas',
  'manage-pharmacies': 'Farmacias',
  'manage-users': 'Usuarios',
  inventory: 'Inventario',
  fulfillment: 'Surtir Recetas',
  'order-management': 'Pedidos',
  'driver-home': 'Mis Entregas',
  'delivery-detail': 'Detalle de Entrega',
  profile: 'Mi Perfil',
  'audit-logs': 'Auditoría',
};

export function getPageTitle(page: AppPage): string {
  return PAGE_TITLES[page] ?? page;
}
