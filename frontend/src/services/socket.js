import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
    });
  }

  return socket;
};

export const joinRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_room', userId);
  }
};

export const joinSession = (sessionId) => {
  const s = getSocket();
  if (s && sessionId) {
    s.emit('join_session', sessionId);
  }
};

export const leaveSession = (sessionId) => {
  const s = getSocket();
  if (s && sessionId) {
    s.emit('leave_session', sessionId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  getSocket,
  joinRoom,
  joinSession,
  leaveSession,
  disconnectSocket,
};
