import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketServer;

export function initSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // Allow all client connections (localhost:3000, etc.)
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

