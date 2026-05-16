// OASIS - Zod Validators
// All input validation schemas for the API endpoints

import { z } from 'zod/v4';

// ============================
// Auth Validators
// ============================
export const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['patient']).default('patient'), // Only patient for public registration
});

export const forgotPasswordSchema = z.object({
  email: z.email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  new_password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token requerido'),
});

// ============================
// User Validators
// ============================
export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['patient', 'doctor', 'pharmacy_manager', 'delivery_driver', 'receptionist', 'admin']),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  role: z.enum(['patient', 'doctor', 'pharmacy_manager', 'delivery_driver', 'receptionist', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const updatePatientProfileSchema = z.object({
  date_of_birth: z.string().optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  medical_notes: z.string().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Contraseña actual requerida'),
  new_password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ============================
// Appointment Validators
// ============================
export const createAppointmentSchema = z.object({
  doctor_id: z.string().min(1, 'Doctor requerido'),
  clinic_id: z.string().min(1, 'Clínica requerida'),
  date_time: z.string().min(1, 'Fecha y hora requeridas'),
  duration_minutes: z.number().int().min(15).max(120).default(30),
  notes: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  cancellation_reason: z.string().optional(),
});

// ============================
// Clinic Validators
// ============================
export const createClinicSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
});

export const updateClinicSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================
// Pharmacy Validators
// ============================
export const createPharmacySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
});

export const updatePharmacySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  delivery_fee: z.number().min(0).optional(),
});

// ============================
// Inventory Validators
// ============================
export const adjustInventorySchema = z.object({
  medicine_id: z.string().min(1, 'Medicamento requerido'),
  quantity_change: z.number().int('El cambio debe ser un número entero'),
  new_price: z.number().min(0).optional(),
  reason: z.string().optional(),
});

export const seedInventorySchema = z.object({
  items: z.array(z.object({
    medicine_id: z.string().min(1),
    quantity: z.number().int().min(0),
    unit_price: z.number().min(0),
    min_stock: z.number().int().min(0).optional(),
  })).min(1, 'Al menos un item requerido'),
});

// ============================
// Prescription Validators
// ============================
export const createPrescriptionSchema = z.object({
  patient_id: z.string().min(1, 'Paciente requerido'),
  clinic_id: z.string().min(1, 'Clínica requerida'),
  appointment_id: z.string().optional(),
  expiration_date: z.string().min(1, 'Fecha de expiración requerida'),
  notes: z.string().optional(),
  lines: z.array(z.object({
    medicine_id: z.string().min(1, 'Medicamento requerido'),
    quantity: z.number().int().min(1, 'Cantidad mínima: 1'),
    dosage_instructions: z.string().min(1, 'Instrucciones de dosificación requeridas'),
  })).min(1, 'Al menos una línea de receta requerida'),
});

export const validatePrescriptionSchema = z.object({
  qr_data: z.string().min(1, 'QR data requerido'),
});

export const fulfillPrescriptionSchema = z.object({
  pharmacy_id: z.string().min(1, 'Farmacia requerida'),
  items: z.array(z.object({
    prescription_line_id: z.string().min(1),
    quantity_fulfilled: z.number().int().min(1),
  })).min(1, 'Al menos un item requerido'),
});

// ============================
// Sale Validators
// ============================
export const createSaleSchema = z.object({
  items: z.array(z.object({
    medicine_id: z.string().min(1, 'Medicamento requerido'),
    quantity: z.number().int().min(1, 'Cantidad mínima: 1'),
    unit_price: z.number().min(0).optional(),
  })).min(1, 'Al menos un item requerido'),
  prescription_id: z.string().optional(),
  patient_id: z.string().optional(),
  clinic_id: z.string().optional(),
  appointment_id: z.string().optional(),
  is_delivery: z.boolean().default(false),
  delivery_address: z.string().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  notes: z.string().optional(),
});

// ============================
// Delivery Validators
// ============================
export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled']),
  delivery_driver_id: z.string().optional(),
});

// ============================
// Helper: Validate and return data or error response
// ============================
import { NextResponse } from 'next/server';
import { ErrorCodes } from '../utils/api-response';

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: messages,
          },
        },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}
