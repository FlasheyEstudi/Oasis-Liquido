import { db as prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

/**
 * GET /api/v1/reviews
 * List reviews with optional filters
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const limit = parseInt(searchParams.get('limit') || '20');

    const reviews = await prisma.review.findMany({
      where: {
        ...(targetId ? { targetId } : {}),
        ...(targetType ? { targetType } : {})
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return successResponse(reviews);
  } catch (error) {
    console.error('List reviews error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});

/**
 * POST /api/v1/reviews
 * Create a new review with validation to prevent self-review and duplicates
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { targetId, targetType, rating, comment } = body;

    if (!targetId || !targetType || !rating) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Faltan campos obligatorios', 400);
    }

    // 1. Prevent self-reviewing
    if (targetType === 'pharmacy' && req.user.role === 'pharmacy_manager') {
      const managerProfile = await prisma.pharmacyManagerProfile.findFirst({
        where: { userId: req.user.userId }
      });
      if (managerProfile && managerProfile.pharmacyId === targetId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No puedes calificar tu propia farmacia', 403);
      }
    }

    if (targetType === 'doctor' && req.user.role === 'doctor' && req.user.userId === targetId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'No puedes calificarte a ti mismo', 403);
    }

    // 2. Prevent duplicate reviews (one per user per target)
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: req.user.userId,
        targetId,
        targetType
      }
    });

    if (existingReview) {
      return errorResponse(ErrorCodes.CONFLICT, 'Ya has calificado este servicio', 409);
    }

    // 3. Create review
    const review = await prisma.review.create({
      data: {
        userId: req.user.userId,
        targetId,
        targetType,
        rating: Number(rating),
        comment: comment?.trim() || null
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    return successResponse(review, 'Reseña enviada correctamente', 201);
  } catch (error) {
    console.error('Create review error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
