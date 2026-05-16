// ============================================
// OASIS - Validadores de formularios
// ============================================

/** Valida formato de email */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/** Valida contraseña: mínimo 8 chars, al menos 1 mayúscula y 1 número */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos 1 mayúscula');
  if (!/[0-9]/.test(password)) errors.push('Al menos 1 número');
  return { valid: errors.length === 0, errors };
}

/** Valida que un campo no esté vacío */
export function isRequired(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0;
}

/** Valida longitud máxima */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/** Valida formato de teléfono */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s()-]{6,20}$/;
  return phoneRegex.test(phone);
}

/** Valida formato UUID */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/** Valida coordenadas geográficas */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Valida fecha ISO */
export function isValidISODate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

/** Valida que la fecha sea futura */
export function isFutureDate(date: string): boolean {
  return new Date(date) > new Date();
}

/** Valida tipo de sangre */
export function isValidBloodType(bloodType: string): boolean {
  const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validTypes.includes(bloodType);
}

/** Mensajes de error en español */
export const VALIDATION_MESSAGES = {
  required: 'Este campo es obligatorio',
  email: 'Ingresa un email válido',
  password: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número',
  phone: 'Ingresa un teléfono válido',
  maxLength: (max: number) => `Máximo ${max} caracteres`,
  futureDate: 'La fecha debe ser futura',
  invalidDate: 'Fecha inválida',
  emailMismatch: 'Los emails no coinciden',
  passwordMismatch: 'Las contraseñas no coinciden',
};
