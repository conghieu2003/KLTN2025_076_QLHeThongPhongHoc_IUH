const axios = require('axios');

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
const BACKEND_TOKEN = process.env.BACKEND_TOKEN || 'backend-secret-token';

/**
 * Helper class to emit socket events from backend
 */
class SocketClient {
  /**
   * Emit room assigned event
   * @param {Object} data - Room assignment data
   */
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
      // Don't throw error - socket events are not critical
    }
  }

  /**
   * Emit room unassigned event
   * @param {Object} data - Room unassignment data
   */
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

  /**
   * Emit stats updated event
   * @param {Object} stats - Statistics data
   */
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

  /**
   * Emit schedule updated event
   * @param {Object} data - Schedule update data
   */
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

  /**
   * Emit schedule exception updated event
   * @param {Object} data - Schedule exception data
   */
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
}

module.exports = SocketClient;

