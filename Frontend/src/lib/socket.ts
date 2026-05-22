import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
    });
    
    socket.on('connect', () => {
      console.log('⚡ Connected to Oasis Socket Server');
    });

    socket.on('disconnect', () => {
      console.log('👋 Disconnected from Oasis Socket Server');
    });
  }
  return socket;
};

export const joinOrderRoom = (orderId: string) => {
  const s = getSocket();
  s.emit('join:order', orderId);
};

export const joinChatRoom = (sessionId: string) => {
  const s = getSocket();
  s.emit('join:chat', sessionId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
