const axios = require('axios');

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'https://kltn2025-076-qlhethongphonghoc-iuh-socket.onrender.com';
const BACKEND_TOKEN = process.env.BACKEND_TOKEN || '';

// helper class to emit socket events from backend
class SocketClient {
// gửi sự kiện gán phòng
  static async emitRoomAssigned(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/room-assigned`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện room-assigned:', error.message);
    }
  }

// gửi sự kiện bỏ gán phòng
  static async emitRoomUnassigned(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/room-unassigned`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện room-unassigned:', error.message);
    }
  }

// gửi sự kiện cập nhật thống kê
  static async emitStatsUpdated(stats) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/stats-updated`, stats, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện stats-updated:', error.message);
    }
  }

// gửi sự kiện cập nhật lịch học
  static async emitScheduleUpdated(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/schedule-updated`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện schedule-updated:', error.message);
    }
  }

// gửi sự kiện cập nhật ngoại lệ lịch học
  static async emitScheduleExceptionUpdated(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/schedule-exception-updated`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện schedule-exception-updated:', error.message);
    }
  }
// gửi sự kiện tạo yêu cầu lịch học
  static async emitScheduleRequestCreated(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/schedule-request-created`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện schedule-request-created:', error.message);
    }
  }

// gửi sự kiện tạo vấn đề phòng học
  static async emitRoomIssueCreated(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/room-issue-created`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện room-issue-created:', error.message);
    }
  }

// gửi sự kiện cập nhật vấn đề phòng học
  static async emitRoomIssueUpdated(data) {
    try {
      await axios.post(`${SOCKET_SERVER_URL}/api/socket/room-issue-updated`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-backend-token': BACKEND_TOKEN
        }
      });
    } catch (error) {
      console.error('[Socket Client] Lỗi khi gửi sự kiện room-issue-updated:', error.message);
    }
  }
}

module.exports = SocketClient;

