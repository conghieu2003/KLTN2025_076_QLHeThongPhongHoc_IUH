const scheduleManagementService = require('../services/scheduleManagement.service');

class ScheduleManagementController {
  // Lấy danh sách lớp học cần sắp xếp phòng
  async getClassesForScheduling(req, res) {
    try {
      const classes = await scheduleManagementService.getClassesForScheduling();
      return res.status(200).json({
        success: true,
        data: classes
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy thống kê sắp xếp phòng
  async getSchedulingStats(req, res) {
    try {
      const stats = await scheduleManagementService.getSchedulingStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy danh sách phòng khả dụng cho lịch học
  async getAvailableRoomsForSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const rooms = await scheduleManagementService.getAvailableRoomsForSchedule(scheduleId);
      return res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Gán phòng cho lịch học
  async assignRoomToSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const { roomId } = req.body;
      const assignedBy = req.user.id;

      const result = await scheduleManagementService.assignRoomToSchedule(scheduleId, roomId, assignedBy);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Gán phòng thành công'
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Hủy gán phòng
  async unassignRoomFromSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const result = await scheduleManagementService.unassignRoomFromSchedule(scheduleId);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Hủy gán phòng thành công'
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy danh sách khoa
  async getDepartments(req, res) {
    try {
      const departments = await scheduleManagementService.getDepartments();
      return res.status(200).json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy danh sách giảng viên
  async getTeachers(req, res) {
    try {
      const teachers = await scheduleManagementService.getTeachers();
      return res.status(200).json({
        success: true,
        data: teachers
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy danh sách giảng viên trống vào thời điểm cụ thể
  async getAvailableTeachers(req, res) {
    try {
      const { date, timeSlotId, departmentId } = req.query;
      
      if (!date || !timeSlotId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu tham số: date và timeSlotId là bắt buộc'
        });
      }

      const teachers = await scheduleManagementService.getAvailableTeachers(
        date,
        timeSlotId,
        departmentId || null
      );
      
      return res.status(200).json({
        success: true,
        data: teachers
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy danh sách trạng thái lịch học
  async getRequestTypes(req, res) {
    try {
      const requestTypes = await scheduleManagementService.getRequestTypes();
      return res.status(200).json({
        success: true,
        data: requestTypes
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Lấy lịch học theo tuần
  async getWeeklySchedule(req, res) {
    try {
      const { weekStartDate } = req.query;
      const filters = {
        departmentId: req.query.departmentId,
        classId: req.query.classId,
        teacherId: req.query.teacherId
      };

      if (!weekStartDate) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu tham số weekStartDate'
        });
      }

      // Lấy thông tin user từ token (nếu có)
      const userRole = req.user?.role || 'admin';
      const userId = req.user?.id || null;

      const schedules = await scheduleManagementService.getWeeklySchedule(weekStartDate, filters, userRole, userId);
      return res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Schedule Management Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new ScheduleManagementController();