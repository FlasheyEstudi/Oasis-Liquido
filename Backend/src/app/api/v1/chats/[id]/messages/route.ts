import { db as prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    const { id } = await context.params;

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return successResponse(messages);
  } catch (error) {
    console.error('List messages error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { content } = body;

    const [message, _sessionUpdate] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId: id,
          senderId: req.user.userId,
          content
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true }
          }
        }
      }),
      prisma.chatSession.update({
        where: { id: id },
        data: { updatedAt: new Date() }
      })
    ]);

    return successResponse(message, 'Mensaje enviado', 201);
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
