import { db as prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    const { id } = await context.params;

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventory: {
          pharmacyId: id
        }
      },
      include: {
        inventory: {
          include: {
            medicine: {
              select: { name: true, concentration: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return successResponse(movements);
  } catch (error) {
    console.error('List movements error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
