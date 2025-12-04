const roomService = require('../services/room.service');

class RoomController {
  // hỗ trợ trả về response
  sendResponse(res, statusCode, success, data, message = null) {
    return res.status(statusCode).json({
      success,
      data,
      message
    });
  }

  sendError(res, error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  // API lấy danh sách phòng
  async getAllRooms(req, res) {
    try {
      const rooms = await roomService.getAllRooms();
      return res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy phòng học theo khoa và loại phòng
  async getRoomsByDepartmentAndType(req, res) {
    try {
      const { departmentId, classRoomTypeId } = req.query;
      const rooms = await roomService.getRoomsByDepartmentAndType(departmentId, classRoomTypeId);
      return res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy thông tin phòng theo ID
  async getRoomById(req, res) {
    try {
      const { roomId } = req.params;
      const room = await roomService.getRoomById(roomId);
      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API tạo phòng mới
  async createRoom(req, res) {
    try {
      const room = await roomService.createRoom(req.body);
      return res.status(201).json({
        success: true,
        data: room,
        message: 'Tạo phòng học thành công'
      });
    } catch (error) {
      console.error('Room Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API cập nhật phòng
  async updateRoom(req, res) {
    try {
      const { roomId } = req.params;
      const room = await roomService.updateRoom(roomId, req.body);
      return res.status(200).json({
        success: true,
        data: room,
        message: 'Cập nhật phòng học thành công'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API xóa phòng
  async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;
      const result = await roomService.deleteRoom(roomId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Room Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy danh sách loại phòng
  async getClassRoomTypes(req, res) {
    try {
      const types = await roomService.getClassRoomTypes();
      return res.status(200).json({
        success: true,
        data: types
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }


  // API lấy danh sách loại yêu cầu
  async getRequestTypes(req, res) {
    try {
      const types = await roomService.getRequestTypes();
      return res.status(200).json({
        success: true,
        data: types
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy danh sách trạng thái yêu cầu
  async getRequestStatuses(req, res) {
    try {
      const statuses = await roomService.getRequestStatuses();
      return res.status(200).json({
        success: true,
        data: statuses
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy danh sách tiết học
  async getTimeSlots(req, res) {
    try {
      const timeSlots = await roomService.getTimeSlots();
      return res.status(200).json({
        success: true,
        data: timeSlots
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }


  // API lấy danh sách lớp học của giảng viên
  async getTeacherSchedules(req, res) {
    try {
      const { teacherId } = req.params; 
      const schedules = await roomService.getTeacherSchedules(teacherId);
      return res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Room Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy thông tin chi tiết của một lớp học
  async getClassScheduleById(req, res) {
    try {
      const { scheduleId } = req.params;
      const schedule = await roomService.getClassScheduleById(scheduleId);
      return res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy lịch học theo time slot và thứ trong tuần
  async getSchedulesByTimeSlotAndDate(req, res) {
    try {
      const { timeSlotId, dayOfWeek, date } = req.query; 

      if (!timeSlotId || !dayOfWeek) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu tham số timeSlotId hoặc dayOfWeek'
        });
      }

      const schedules = await roomService.getSchedulesByTimeSlotAndDate(
        timeSlotId, 
        dayOfWeek,
        date || null // Nếu không có date → lấy lịch cố định
      );

      return res.status(200).json({
        success: true,
        data: schedules,
        message: date 
          ? `Lấy lịch học cho ngày ${date} thành công` 
          : 'Lấy lịch học cố định thành công'
      });
    } catch (error) {
      console.error('Room Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // API lấy danh sách phòng available cho ngoại lệ 
  async getAvailableRoomsForException(req, res) {
    try {
      const { timeSlotId, dayOfWeek, date, capacity, classRoomTypeId, departmentId } = req.query;
      
      if (!timeSlotId || !dayOfWeek || !date) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: timeSlotId, dayOfWeek, date'
        });
      }

      const rooms = await roomService.getAvailableRoomsForException(
        parseInt(timeSlotId),
        parseInt(dayOfWeek),
        date,
        capacity ? parseInt(capacity) : 0,
        classRoomTypeId || null,
        departmentId || null
      );

      return res.status(200).json({
        success: true,
        data: rooms,
        message: `Tìm thấy ${rooms.normalRooms.length} phòng trống thường và ${rooms.freedRooms.length} phòng trống do ngoại lệ`
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new RoomController();