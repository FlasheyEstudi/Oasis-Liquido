import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { DocumentService } from '@/lib/services/document.service';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/v1/documents/upload
 * Premium multi-part file upload endpoint for doctors and clinics.
 * Expects Form Data:
 * - file: File Object
 * - type: string ("degree", "ruc", "id_card_front", etc.)
 * - targetType: "doctor" | "clinic"
 * - targetId: string (doctorId or clinicId)
 * - expiryDate: string (optional, "YYYY-MM-DD")
 * - notes: string (optional)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const targetType = formData.get('targetType') as 'doctor' | 'clinic' | null;
    const targetId = formData.get('targetId') as string | null;
    const expiryDateStr = formData.get('expiryDate') as string | null;
    const notes = (formData.get('notes') as string | null) || undefined;

    if (!file || !type || !targetType || !targetId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'file, type, targetType y targetId son requeridos', 400);
    }

    // Validate size and mime type
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Formato de archivo inválido. Permitidos: ${allowedExtensions.join(', ')}`,
        400
      );
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'El archivo excede el tamaño máximo permitido (10MB)', 400);
    }

    // Safe filename generation
    const uniqueId = Math.random().toString(36).substring(2, 15) + Date.now();
    const safeFilename = `${targetType}_${type}_${uniqueId}${fileExtension}`;

    // Path setup inside public/uploads/documents/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);

    const documentUrl = `/uploads/documents/${safeFilename}`;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : undefined;

    let result;
    if (targetType === 'doctor') {
      result = await DocumentService.uploadDoctorDocument(
        targetId,
        { type, documentUrl, expiryDate, notes },
        req.headers.get('x-forwarded-for') || undefined,
        req.headers.get('user-agent') || undefined
      );
    } else {
      result = await DocumentService.uploadClinicDocument(
        targetId,
        req.user.userId,
        { type, documentUrl, expiryDate, notes },
        req.headers.get('x-forwarded-for') || undefined,
        req.headers.get('user-agent') || undefined
      );
    }

    return successResponse(result, 'Documento legal subido y registrado exitosamente en estado Pendiente', 201);
  } catch (error: any) {
    console.error('File upload error:', error);
    if (error.message === 'DOCTOR_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'El doctor especificado no existe', 404);
    }
    if (error.message === 'CLINIC_NOT_FOUND') {
      return errorResponse(ErrorCodes.NOT_FOUND, 'La clínica especificada no existe', 404);
    }
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'Error al procesar la subida del documento', 500);
  }
});
