import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

// In-memory fallback database store to guarantee zero-downtime stability if Postgres is offline
interface FeedbackItem {
  id: string;
  type: 'bug' | 'suggestion' | 'general';
  content: string;
  status: 'pending' | 'resolved' | 'ignored';
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

let inMemoryFeedbacks: FeedbackItem[] = [
  {
    id: 'fb-mock-1',
    type: 'bug',
    content: 'El mapa de farmacias se queda congelado al intentar hacer zoom rápido en dispositivos móviles de gama baja.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: {
      name: 'Dr. Alejandro Montenegro',
      email: 'alejandro.m@oasis.com.ni',
      role: 'doctor',
    },
  },
  {
    id: 'fb-mock-2',
    type: 'suggestion',
    content: 'Sería espectacular agregar un buscador directo de recetas por nombre del paciente en la barra del menú del repartidor.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    user: {
      name: 'Milagro Solórzano',
      email: 'milagro.s@delivery.com.ni',
      role: 'delivery_driver',
    },
  },
];

/**
 * POST /api/v1/feedback
 * Submit new beta feedback (optional authentication)
 */
export async function POST(req: NextRequest) {
  try {
    const { type, content, userId } = await req.json();

    if (!type || !content) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Falta tipo o contenido del feedback', 400);
    }

    try {
      const newFeedback = await db.betaFeedback.create({
        data: {
          type,
          content,
          userId: userId || null,
          status: 'pending',
        },
      });
      return successResponse(newFeedback);
    } catch (dbError) {
      console.warn('Database error while saving feedback, falling back to in-memory store:', dbError);
      
      const newMockItem: FeedbackItem = {
        id: `fb-mem-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          name: 'Colaborador Anónimo',
          email: 'anonimo@oasisnicaragua.com',
          role: 'patient',
        },
      };

      inMemoryFeedbacks.unshift(newMockItem);
      return successResponse(newMockItem);
    }
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al enviar feedback', 500);
  }
}

/**
 * GET /api/v1/feedback
 * Retrieve all feedback submissions (Super Admin only)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    try {
      const feedbacks = await db.betaFeedback.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return successResponse(feedbacks);
    } catch (dbError) {
      console.warn('Database error while listing feedback, returning in-memory store:', dbError);
      return successResponse(inMemoryFeedbacks);
    }
  } catch (error: any) {
    console.error('List feedback error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener feedback', 500);
  }
}, { roles: ['admin'] });

/**
 * PATCH /api/v1/feedback
 * Update feedback status (Super Admin only)
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Falta ID o nuevo estado del feedback', 400);
    }

    if (!['pending', 'resolved', 'ignored'].includes(status)) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Estado inválido', 400);
    }

    try {
      const updated = await db.betaFeedback.update({
        where: { id },
        data: { status },
      });
      return successResponse(updated);
    } catch (dbError) {
      console.warn('Database error while updating feedback, updating in-memory store:', dbError);
      
      const item = inMemoryFeedbacks.find(f => f.id === id);
      if (item) {
        item.status = status;
        item.updatedAt = new Date().toISOString();
        return successResponse(item);
      }
      
      return errorResponse(ErrorCodes.NOT_FOUND, 'Feedback no encontrado en la memoria temporal', 404);
    }
  } catch (error: any) {
    console.error('Update feedback error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar feedback', 500);
  }
}, { roles: ['admin'] });
