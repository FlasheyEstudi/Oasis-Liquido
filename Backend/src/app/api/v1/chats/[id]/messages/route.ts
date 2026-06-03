import { db as prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { emitChatMessage } from '@/lib/socket';
import { NotificationService } from '@/lib/services/notification.service';

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

    // Emit message in real-time to active participants in room
    emitChatMessage(id, message);

    // Fetch participants of this session to notify them
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: id },
        include: {
          participants: true
        }
      });

      if (session) {
        const otherParticipants = session.participants.filter(p => p.userId !== req.user.userId);
        for (const p of otherParticipants) {
          await NotificationService.createNotification({
            userId: p.userId,
            title: `Mensaje de ${message.sender.name}`,
            body: content.length > 60 ? `${content.substring(0, 60)}...` : content,
            type: 'chat',
            link: 'inicio', // Redirects automatically to the role home
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to dispatch real-time chat notifications:', notifErr);
    }

    return successResponse(message, 'Mensaje enviado', 201);
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
});
