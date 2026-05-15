// ============================================
// OASIS - Constantes de la aplicación
// "Encuentra tu oasis de salud"
// Todas las integraciones son reales, sin mocks
// ============================================

// URL base del API real
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.medired-dev.com';

// Estilo de mapa OpenFreeMap (sin API key)
export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE || 'https://openfreemap.org/styles/liberty.json';

// Nombre de la aplicación
export const APP_NAME = 'OASIS';
export const APP_TAGLINE = 'Encuentra tu oasis de salud';

// WebSockets habilitados
export const ENABLE_WEBSOCKETS = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKETS === 'true';

// Versión del API
export const API_VERSION = 'v1';

// Prefijo de rutas del API
export const API_PREFIX = `/api/${API_VERSION}`;

// Tiempo de expiración del access token (ms) - 15 minutos
export const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000;

// Tiempos de React Query
export const STALE_TIME = 30 * 1000; // 30 segundos
export const GC_TIME = 5 * 60 * 1000; // 5 minutos

// Ubicación por defecto (Managua, Nicaragua)
export const DEFAULT_LAT = 12.1364;
export const DEFAULT_LNG = -86.2514;
export const DEFAULT_ZOOM = 13;

// Radio de búsqueda por defecto (metros)
export const DEFAULT_SEARCH_RADIUS = 5000;

// Duración de cita por defecto (minutos)
export const DEFAULT_APPOINTMENT_DURATION = 30;

// Número de items por página
export const DEFAULT_PAGE_SIZE = 20;

// Intervalo de polling para seguimiento de entregas (ms)
export const DELIVERY_POLLING_INTERVAL = 10000;

// Claves de localStorage
export const STORAGE_KEYS = {
  USER: 'oasis_user',
  CURRENT_PAGE: 'oasis_current_page',
  SELECTED_CLINIC_ID: 'oasis_selected_clinic',
  SELECTED_PHARMACY_ID: 'oasis_selected_pharmacy',
  SELECTED_PRESCRIPTION_ID: 'oasis_selected_prescription',
  SELECTED_APPOINTMENT_ID: 'oasis_selected_appointment',
  SELECTED_DELIVERY_ID: 'oasis_selected_delivery',
} as const;

// Roles de usuario con labels e iconos para UI
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  receptionist: 'Recepcionista',
  patient: 'Paciente',
  pharmacy_manager: 'Farmacéutico',
  delivery_driver: 'Repartidor',
  clinic_admin: 'Admin Clínica',
  pharmacy_admin: 'Admin Farmacia',
};

export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  admin: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  doctor: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
  receptionist: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20' },
  patient: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  pharmacy_manager: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
  delivery_driver: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
};

// Colores de estado para citas
export const APPOINTMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  scheduled: { label: 'Programada', color: 'text-sky-700 dark:text-sky-400', bgColor: 'bg-sky-500/10' },
  confirmed: { label: 'Confirmada', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  in_progress: { label: 'En consulta', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  completed: { label: 'Completada', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelada', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-500/10' },
};

// Colores de estado para recetas
export const PRESCRIPTION_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Activa', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  partially_fulfilled: { label: 'Parcialmente surtida', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  fulfilled: { label: 'Surtida', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  expired: { label: 'Expirada', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-500/10' },
};

// Colores de estado para entregas
export const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-slate-700 dark:text-slate-400', bgColor: 'bg-slate-500/10' },
  assigned: { label: 'Asignada', color: 'text-sky-700 dark:text-sky-400', bgColor: 'bg-sky-500/10' },
  picked_up: { label: 'Recogido', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  in_transit: { label: 'En tránsito', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  delivered: { label: 'Entregado', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelado', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-500/10' },
};

// Tipos de sangre
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Formas de dosificación
export const DOSAGE_FORMS: Record<string, string> = {
  tablet: 'Tableta',
  syrup: 'Jarabe',
  injection: 'Inyección',
  capsule: 'Cápsula',
  cream: 'Crema',
  drops: 'Gotas',
  inhaler: 'Inhalador',
};
