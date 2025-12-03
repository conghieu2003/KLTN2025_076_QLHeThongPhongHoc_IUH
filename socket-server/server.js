const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const userSockets = new Map();
io.on('connection', (socket) => {
  socket.on('login', (userId) => {
    if (!userId) {
      console.warn(`[Socket Server] Đăng nhập không hợp lệ từ socket: ${socket.id}`);
      return;
    }

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    socket.data.userId = userId;  
    socket.join(`user:${userId}`);
    const onlineUsers = Array.from(userSockets.keys());
    io.emit('users-online', { userIds: onlineUsers });
  });
  
  socket.on('logout', (userId) => {
    if (!userId) return;
    
    if (userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
      }
    }

    socket.leave(`user:${userId}`);
    socket.data.userId = null;

    const onlineUsers = Array.from(userSockets.keys());
    io.emit('users-online', { userIds: onlineUsers });
  });

  socket.on('disconnect', () => {
    
    const userId = socket.data.userId;
    if (userId && userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
        
        const onlineUsers = Array.from(userSockets.keys());
        io.emit('users-online', { userIds: onlineUsers });
      }
    }
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

function emitRoomAssigned(data) {
  io.emit('room-assigned', data);
}

function emitRoomUnassigned(data) {
  io.emit('room-unassigned', data);
}

function emitStatsUpdated(stats) {
  io.emit('stats-updated', stats);
}

function emitScheduleUpdated(data) {
  if (data.userIds && Array.isArray(data.userIds) && data.userIds.length > 0) {
    data.userIds.forEach(userId => {
      io.to(`user:${userId}`).emit('schedule-updated', {
        ...data,
        userIds: undefined
      });
    });
  } else {
    io.emit('schedule-updated', data);
  }
}

function emitScheduleExceptionUpdated(data) {
  if (data.userIds && Array.isArray(data.userIds) && data.userIds.length > 0) {
    data.userIds.forEach(userId => {
      io.to(`user:${userId}`).emit('schedule-exception-updated', {
        ...data,
        userIds: undefined
      });
    });
  } else {
    io.emit('schedule-exception-updated', data);
  }
}

const verifyBackendRequest = (req, res, next) => {
  const backendToken = req.headers['x-backend-token'];
  const expectedToken = process.env.BACKEND_TOKEN || 'backend-secret-token';
  
  if (backendToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
app.post('/api/socket/room-assigned', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitRoomAssigned(data);
  res.json({ success: true, message: 'Room assigned event emitted' });
});

app.post('/api/socket/room-unassigned', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitRoomUnassigned(data);
  res.json({ success: true, message: 'Room unassigned event emitted' });
});

app.post('/api/socket/stats-updated', verifyBackendRequest, (req, res) => {
  const stats = req.body;
  emitStatsUpdated(stats);
  res.json({ success: true, message: 'Stats updated event emitted' });
});

app.post('/api/socket/schedule-updated', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitScheduleUpdated(data);
  res.json({ success: true, message: 'Schedule updated event emitted' });
});

app.post('/api/socket/schedule-exception-updated', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitScheduleExceptionUpdated(data);
  res.json({ success: true, message: 'Schedule exception updated event emitted' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Classroom Socket Server',
    connections: io.engine.clientsCount,
    onlineUsers: userSockets.size
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Classroom Management System Socket Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.SOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log('[Socket Server] Server đang chạy');
  console.log(`[Socket Server] Socket server: http://localhost:${PORT}`);
  console.log(`[Socket Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Socket Server] Allowed origins:`, allowedOrigins);
});

module.exports = {
  io,
  emitRoomAssigned,
  emitRoomUnassigned,
  emitStatsUpdated,
  emitScheduleUpdated,
  emitScheduleExceptionUpdated
};

