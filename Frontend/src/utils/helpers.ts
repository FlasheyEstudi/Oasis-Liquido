// ============================================
// MediRed - Funciones auxiliares
// ============================================

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/** Formatea una fecha ISO a formato legible en español */
export function formatDate(isoDate: string, fmt: string = 'dd/MM/yyyy'): string {
  try {
    const date = parseISO(isoDate);
    if (!isValid(date)) return isoDate;
    return format(date, fmt, { locale: es });
  } catch {
    return isoDate;
  }
}

/** Formatea fecha y hora */
export function formatDateTime(isoDate: string): string {
  return formatDate(isoDate, "dd/MM/yyyy HH:mm");
}

/** Tiempo relativo (hace 5 minutos, etc.) */
export function timeAgo(isoDate: string): string {
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: es });
  } catch {
    return isoDate;
  }
}

/** Formatea distancia en metros o kilómetros */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Formatea precio como moneda (MXN) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/** Formatea duración en minutos */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/** Trunca texto con elipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Obtiene las iniciales de un nombre */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Genera un UUID v4 simple (para mock data) */
export function generateMockUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Construye query string a partir de un objeto */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/** Calcula distancia entre dos puntos (Haversine) */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Debounce genérico */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Clasifica el estado de stock */
export function getStockStatus(quantity: number): { label: string; color: string } {
  if (quantity === 0) return { label: 'Sin stock', color: 'text-red-600' };
  if (quantity < 10) return { label: 'Stock bajo', color: 'text-amber-600' };
  return { label: 'En stock', color: 'text-green-600' };
}
