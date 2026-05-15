import { db as prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const sessions = await prisma.chatSession.findMany({
      where: {
        participants: {
          some: { userId: req.user.userId }
        },
        ...(type ? { type } : {})
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return successResponse(sessions);
  } catch (error) {
    console.error('List sessions error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { type, targetId, participantIds } = body;

    // Ensure current user is in participants
    const allParticipantIds = Array.from(new Set([...(participantIds || []), req.user.userId]));

    const session = await prisma.chatSession.create({
      data: {
        type,
        targetId,
        participants: {
          create: allParticipantIds.map(id => ({ userId: id }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      }
    });

    return successResponse(session, 'Sesión de chat creada', 201);
  } catch (error) {
    console.error('Create session error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
