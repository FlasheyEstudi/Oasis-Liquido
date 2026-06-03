import { io, Socket } from 'socket.io-client';
import { getDynamicUrl } from '@/utils/constants';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    
    // Usar la URL directa de Render en producción para WebSockets, ya que Vercel Serverless no los soporta
    const isProductionClient = typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1';
      
    const socketUrl = isProductionClient
      ? (process.env.NEXT_PUBLIC_SOCKET_URL || 'https://oasis-liquido.onrender.com')
      : getDynamicUrl(rawUrl);

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
      // Auto re-join active rooms on connection / reconnection
      if (activeUserId && socket) {
        socket.emit('join:user', activeUserId);
        console.log(`📡 [Socket.io] Auto-rejoined personal room for user: ${activeUserId}`);
      }
      if (activeOrderId && socket) {
        socket.emit('join:order', activeOrderId);
        console.log(`📡 [Socket.io] Auto-rejoined order room: ${activeOrderId}`);
      }
      if (activeChatSessionId && socket) {
        socket.emit('join:chat', activeChatSessionId);
        console.log(`📡 [Socket.io] Auto-rejoined chat room: ${activeChatSessionId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 Disconnected from Oasis Socket Server');
    });
  }
  return socket;
};

let activeUserId: string | null = null;
let activeOrderId: string | null = null;
let activeChatSessionId: string | null = null;

export const joinOrderRoom = (orderId: string) => {
  activeOrderId = orderId;
  const s = getSocket();
  s.emit('join:order', orderId);
};

export const joinChatRoom = (sessionId: string) => {
  activeChatSessionId = sessionId;
  const s = getSocket();
  s.emit('join:chat', sessionId);
};

export const joinUserRoom = (userId: string) => {
  activeUserId = userId;
  const s = getSocket();
  s.emit('join:user', userId);
};

export const disconnectSocket = () => {
  activeUserId = null;
  activeOrderId = null;
  activeChatSessionId = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

