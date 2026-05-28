import { io, Socket } from 'socket.io-client';
import { getDynamicUrl } from '@/utils/constants';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    const socketUrl = getDynamicUrl(rawUrl);
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['polling', 'websocket'], // Start with HTTP polling, upgrade to WebSocket to prevent ERR_CONNECTION failures on serverless Vercel
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

export const joinUserRoom = (userId: string) => {
  const s = getSocket();
  s.emit('join:user', userId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
