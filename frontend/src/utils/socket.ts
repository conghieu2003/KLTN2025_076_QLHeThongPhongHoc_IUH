import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const initSocket = (userId?: string | number): Socket => {
  if (socket?.connected) {
    if (userId) {
      socket.emit('login', userId.toString());
      console.log(`[Socket] Đã kết nối socket, gửi thông tin đăng nhập cho user: ${userId}`);
    }
    return socket;
  }
  if (socket && !socket.connected) {
    socket.connect();
    if (userId) {
      socket.once('connect', () => {
        socket?.emit('login', userId.toString());
        console.log(`[Socket] Kết nối lại socket, gửi thông tin đăng nhập cho user: ${userId}`);
      });
    }
    return socket;
  }
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log(`[Socket] Đã kết nối socket thành công, ID: ${socket?.id}`);
    if (userId) {
      socket?.emit('login', userId.toString());
      console.log(`[Socket] Đã gửi sự kiện đăng nhập cho user: ${userId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Đã ngắt kết nối socket, lý do: ${reason}`);
  });

  socket.on('connect_error', (error: Error) => {
    console.error(`[Socket] Lỗi kết nối socket: ${error.message}`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`[Socket] Kết nối lại socket thành công sau ${attemptNumber} lần thử`);
    if (userId) {
      socket?.emit('login', userId.toString());
      console.log(`[Socket] Đã gửi lại sự kiện đăng nhập sau khi kết nối lại cho user: ${userId}`);
    }
  });

  socket.on('reconnect_attempt', () => {
    console.log('[Socket] Đang thử kết nối lại socket...');
  });

  socket.on('reconnect_failed', () => {
    console.error('[Socket] Không thể kết nối lại socket');
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const loginSocket = (userId: string | number) => {
  if (!socket) {
    initSocket(userId);
    return;
  }
  socket.emit('login', userId.toString());
};

export const logoutSocket = (userId: string | number) => {
  if (socket) {
    socket.emit('logout', userId.toString());
  }
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

export default socket;

