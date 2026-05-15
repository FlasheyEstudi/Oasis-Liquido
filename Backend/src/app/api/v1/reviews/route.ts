import { db as prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

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

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { targetId, targetType, rating, comment } = body;

    const review = await prisma.review.create({
      data: {
        userId: req.user.userId,
        targetId,
        targetType,
        rating,
        comment
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    return successResponse(review, 'Reseña creada', 201);
  } catch (error) {
    console.error('Create review error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
