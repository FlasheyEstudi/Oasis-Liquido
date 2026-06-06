import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from './db';

let io: SocketServer;

export function initSocket(server: HTTPServer) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
    : ['http://localhost:3000', 'https://oasis-liquido.vercel.app'];

  io = new SocketServer(server, {
    cors: {
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin or in the allowed origins whitelist, and all in non-production
        if (!requestOrigin || allowedOrigins.includes(requestOrigin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  io.on('connection', (socket) => {
    console.log('⚡ Socket connected:', socket.id);

    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`👤 User joined order room: ${orderId}`);
    });

    socket.on('join:chat', (sessionId: string) => {
      socket.join(`chat:${sessionId}`);
      console.log(`👤 User joined chat room: ${sessionId}`);
    });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`👤 User joined personal room: ${userId}`);
    });

    socket.on('driver-location', async (data: { orderId: string; points: { lat: number; lng: number; timestamp: number }[] }) => {
      try {
        const { orderId, points } = data;
        if (!orderId || !points || points.length === 0) return;

        const lastPoint = points[points.length - 1];

        // Broadcast the latest coordinate immediately to the order room (low latency update)
        io.to(`order:${orderId}`).emit('delivery:locationUpdate', {
          orderId,
          lat: lastPoint.lat,
          lng: lastPoint.lng
        });

        // Async batch write to database
        db.deliveryRoute.createMany({
          data: points.map(pt => ({
            deliveryOrderId: orderId,
            driverLat: pt.lat,
            driverLng: pt.lng,
            createdAt: new Date(pt.timestamp)
          }))
        }).catch(err => {
          console.error('Error batch saving delivery routes:', err);
        });

        // Update driver's current position using the deliveryOrder relationship
        db.deliveryOrder.findUnique({
          where: { id: orderId },
          select: { deliveryDriverId: true }
        }).then(order => {
          if (order && order.deliveryDriverId) {
            db.deliveryDriverProfile.update({
              where: { userId: order.deliveryDriverId },
              data: { currentLat: lastPoint.lat, currentLng: lastPoint.lng }
            }).catch(err => {
              console.error('Error updating driver profile location:', err);
            });
          }
        }).catch(err => {
          console.error('Error finding order for driver location update:', err);
        });

      } catch (err: any) {
        console.warn('⚠️ Error processing driver-location event:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 Socket disconnected:', socket.id);
    });
  });

  // Bind to global variable to be accessed safely by Next.js API Routes
  (global as any).io = io;
  return io;
}

export function getIO() {
  const globalIo = (global as any).io;
  if (globalIo) return globalIo;
  if (io) return io;
  return null;
}

/**
 * Emit delivery location update to specific order room
 */
export function emitDeliveryLocation(orderId: string, lat: number, lng: number) {
  try {
    const ioInstance = getIO();
    if (ioInstance) {
      ioInstance.to(`order:${orderId}`).emit('delivery:locationUpdate', { orderId, lat, lng });
      console.log(`📡 [Socket.io] Emitted location update for order ${orderId}: (${lat}, ${lng})`);
    } else {
      console.log(`ℹ️ [Socket.io] Server not active, skipped location update for order ${orderId}.`);
    }
  } catch (err: any) {
    console.warn('⚠️ Could not emit delivery location via socket:', err.message);
  }
}

/**
 * Emit new chat message to specific session room
 */
export function emitChatMessage(sessionId: string, message: any) {
  try {
    const ioInstance = getIO();
    if (ioInstance) {
      ioInstance.to(`chat:${sessionId}`).emit('chat:message', message);
      console.log(`💬 [Socket.io] Emitted chat message to session ${sessionId}`);
    } else {
      console.log(`ℹ️ [Socket.io] Server not active, skipped chat message to session ${sessionId}.`);
    }
  } catch (err: any) {
    console.warn('⚠️ Could not emit chat message via socket:', err.message);
  }
}

/**
 * Emit a new notification to a specific user
 */
export function emitNotification(userId: string, notification: any) {
  try {
    const ioInstance = getIO();
    if (ioInstance) {
      ioInstance.to(`user:${userId}`).emit('notification:new', notification);
      console.log(`🔔 [Socket.io] Emitted notification to user ${userId}`);
    } else {
      console.log(`ℹ️ [Socket.io] Server not active, skipped notification emit for user ${userId}.`);
    }
  } catch (err: any) {
    console.warn('⚠️ Could not emit notification via socket:', err.message);
  }
}

