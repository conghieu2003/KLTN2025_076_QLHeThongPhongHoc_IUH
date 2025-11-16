const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Allowed origins configured

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active connections by userId
const userSockets = new Map(); // userId -> Set of socketIds

// Socket.IO connection handling
io.on('connection', (socket) => {
  // User login - store socket connection
  socket.on('login', (userId) => {
    if (!userId) {
      console.warn(`[Socket Server] Đăng nhập không hợp lệ từ socket: ${socket.id}`);
      return;
    }

    // Store socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Store userId in socket data for easy access
    socket.data.userId = userId;

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Emit online users list
    const onlineUsers = Array.from(userSockets.keys());
    io.emit('users-online', { userIds: onlineUsers });
  });

  // User logout
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

  // Join room scheduling room - for real-time updates
  socket.on('join-room-scheduling', () => {
    socket.join('room-scheduling');
  });

  // Leave room scheduling room
  socket.on('leave-room-scheduling', () => {
    socket.leave('room-scheduling');
  });

  // Join weekly schedule room - for real-time schedule updates
  socket.on('join-weekly-schedule', (weekStartDate) => {
    if (!weekStartDate) return;
    const roomName = `weekly-schedule:${weekStartDate}`;
    socket.join(roomName);
  });

  // Leave weekly schedule room
  socket.on('leave-weekly-schedule', (weekStartDate) => {
    if (!weekStartDate) return;
    const roomName = `weekly-schedule:${weekStartDate}`;
    socket.leave(roomName);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    
    const userId = socket.data.userId;
    if (userId && userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
        
        // Emit user offline
        const onlineUsers = Array.from(userSockets.keys());
        io.emit('users-online', { userIds: onlineUsers });
      }
    }
  });

  // Health check
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// =====================================================
// Room Scheduling Events
// =====================================================

/**
 * Emit room assigned event to all clients in room-scheduling room
 * Called from backend when a room is assigned to a schedule
 */
function emitRoomAssigned(data) {
  io.to('room-scheduling').emit('room-assigned', data);
}

/**
 * Emit room unassigned event to all clients in room-scheduling room
 * Called from backend when a room is unassigned from a schedule
 */
function emitRoomUnassigned(data) {
  io.to('room-scheduling').emit('room-unassigned', data);
}

/**
 * Emit stats updated event when scheduling statistics change
 */
function emitStatsUpdated(stats) {
  io.to('room-scheduling').emit('stats-updated', stats);
}

// =====================================================
// Weekly Schedule Events
// =====================================================

/**
 * Emit schedule updated event for weekly schedule view
 * This will be sent to all clients viewing that week
 */
function emitScheduleUpdated(data) {
  // If weekStartDate is null or undefined, broadcast to ALL weekly-schedule rooms
  // This is because a schedule can appear in multiple weeks (recurring schedule)
  if (data.weekStartDate) {
    // Emit to specific week room
    const roomName = `weekly-schedule:${data.weekStartDate}`;
    io.to(roomName).emit('schedule-updated', data);
  } else {
    // Broadcast to ALL weekly-schedule rooms (for recurring schedules)
    // Get all rooms that match the pattern 'weekly-schedule:*'
    const rooms = io.sockets.adapter.rooms;
    const weeklyScheduleRooms = [];
    
    for (const [roomName, socketSet] of rooms) {
      if (roomName.startsWith('weekly-schedule:')) {
        weeklyScheduleRooms.push(roomName);
      }
    }
    
    // Emit to all weekly-schedule rooms
    weeklyScheduleRooms.forEach(roomName => {
      io.to(roomName).emit('schedule-updated', data);
    });
  }
  
  // Also emit to room-scheduling room for general updates (admin view)
  io.to('room-scheduling').emit('schedule-updated', data);
}

/**
 * Emit schedule exception updated event
 */
function emitScheduleExceptionUpdated(data) {
  if (data.weekStartDate) {
    const roomName = `weekly-schedule:${data.weekStartDate}`;
    io.to(roomName).emit('schedule-exception-updated', data);
  }
  io.to('room-scheduling').emit('schedule-exception-updated', data);
}

// =====================================================
// HTTP API for backend to emit events
// =====================================================

// Middleware to verify backend requests (optional - add authentication if needed)
const verifyBackendRequest = (req, res, next) => {
  const backendToken = req.headers['x-backend-token'];
  const expectedToken = process.env.BACKEND_TOKEN || 'backend-secret-token';
  
  if (backendToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// API endpoint for backend to emit room assigned event
app.post('/api/socket/room-assigned', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitRoomAssigned(data);
  res.json({ success: true, message: 'Room assigned event emitted' });
});

// API endpoint for backend to emit room unassigned event
app.post('/api/socket/room-unassigned', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitRoomUnassigned(data);
  res.json({ success: true, message: 'Room unassigned event emitted' });
});

// API endpoint for backend to emit stats updated event
app.post('/api/socket/stats-updated', verifyBackendRequest, (req, res) => {
  const stats = req.body;
  emitStatsUpdated(stats);
  res.json({ success: true, message: 'Stats updated event emitted' });
});

// API endpoint for backend to emit schedule updated event
app.post('/api/socket/schedule-updated', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitScheduleUpdated(data);
  res.json({ success: true, message: 'Schedule updated event emitted' });
});

// API endpoint for backend to emit schedule exception updated event
app.post('/api/socket/schedule-exception-updated', verifyBackendRequest, (req, res) => {
  const data = req.body;
  emitScheduleExceptionUpdated(data);
  res.json({ success: true, message: 'Schedule exception updated event emitted' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Classroom Socket Server',
    connections: io.engine.clientsCount,
    onlineUsers: userSockets.size
  });
});

// Root endpoint
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

// Export functions for direct use (if backend runs in same process)
module.exports = {
  io,
  emitRoomAssigned,
  emitRoomUnassigned,
  emitStatsUpdated,
  emitScheduleUpdated,
  emitScheduleExceptionUpdated
};

