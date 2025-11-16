import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Initialize socket connection
 */
export const initSocket = (userId?: string | number): Socket => {
  // If socket already exists and is connected, just login if userId provided
  if (socket?.connected) {
    if (userId) {
      socket.emit('login', userId.toString());
      console.log(`[Socket] Đã kết nối socket, gửi thông tin đăng nhập cho user: ${userId}`);
    }
    return socket;
  }

  // If socket exists but not connected, reconnect it
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

  // Create new socket connection
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

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Login user (store socket connection)
 */
export const loginSocket = (userId: string | number) => {
  if (!socket) {
    initSocket(userId);
    return;
  }
  socket.emit('login', userId.toString());
};

/**
 * Logout user
 */
export const logoutSocket = (userId: string | number) => {
  if (socket) {
    socket.emit('logout', userId.toString());
  }
};

/**
 * Join room scheduling room
 */
export const joinRoomScheduling = () => {
  if (socket && socket.connected) {
    socket.emit('join-room-scheduling');
    console.log('[Socket] Đã tham gia phòng sắp xếp phòng học');
  } else {
    console.warn('[Socket] Socket chưa kết nối, không thể tham gia phòng sắp xếp phòng học');
    // Try to join after connection
    if (socket) {
      socket.once('connect', () => {
        socket?.emit('join-room-scheduling');
        console.log('[Socket] Đã tham gia phòng sắp xếp phòng học sau khi kết nối');
      });
    }
  }
};

/**
 * Leave room scheduling room
 */
export const leaveRoomScheduling = () => {
  if (socket && socket.connected) {
    socket.emit('leave-room-scheduling');
    console.log('[Socket] Đã rời phòng sắp xếp phòng học');
  }
};

/**
 * Join weekly schedule room
 */
export const joinWeeklySchedule = (weekStartDate: string) => {
  if (socket && socket.connected) {
    socket.emit('join-weekly-schedule', weekStartDate);
    console.log(`[Socket] Đã tham gia phòng lịch tuần: ${weekStartDate}`);
  } else {
    console.warn(`[Socket] Socket chưa kết nối, không thể tham gia phòng lịch tuần: ${weekStartDate}`);
    // Try to join after connection
    if (socket) {
      socket.once('connect', () => {
        socket?.emit('join-weekly-schedule', weekStartDate);
        console.log(`[Socket] Đã tham gia phòng lịch tuần sau khi kết nối: ${weekStartDate}`);
      });
    } else {
      console.error('[Socket] Socket không tồn tại, không thể tham gia phòng lịch tuần');
    }
  }
};

/**
 * Leave weekly schedule room
 */
export const leaveWeeklySchedule = (weekStartDate: string) => {
  if (socket && socket.connected) {
    socket.emit('leave-weekly-schedule', weekStartDate);
    console.log(`[Socket] Đã rời phòng lịch tuần: ${weekStartDate}`);
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

export default socket;

