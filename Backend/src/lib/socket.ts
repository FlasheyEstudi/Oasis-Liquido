import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketServer;

export function initSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
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

    socket.on('disconnect', () => {
      console.log('👋 Socket disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Emit delivery location update to specific order room
 */
export function emitDeliveryLocation(orderId: string, lat: number, lng: number) {
  if (io) {
    io.to(`order:${orderId}`).emit('delivery:locationUpdate', { orderId, lat, lng });
  }
}

/**
 * Emit new chat message to specific session room
 */
export function emitChatMessage(sessionId: string, message: any) {
  if (io) {
    io.to(`chat:${sessionId}`).emit('chat:message', message);
  }
}
