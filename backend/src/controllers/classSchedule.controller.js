const classScheduleService = require('../services/classSchedule.service');

class ClassScheduleController {
  // =====================================================
  // CLASS SCHEDULE GET - LẤY DANH SÁCH LỊCH HỌC
  // =====================================================
  
  async ClassScheduleGet(req, res) {
    try {
      const result = await classScheduleService.ClassScheduleGet();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách lịch học thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassScheduleController.ClassScheduleGet] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách lịch học'
      });
    }
  }

  // Lấy thông tin chi tiết lịch học theo ID lớp
  async ClassScheduleGetById(req, res) {
    try {
      const { classId } = req.params;
      const result = await classScheduleService.ClassScheduleGetById(classId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy thông tin lịch học thành công',
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassScheduleController.ClassScheduleGetById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin lịch học'
      });
    }
  }

  // =====================================================
  // CLASS SCHEDULE UPDATE - CẬP NHẬT GÁN PHÒNG
  // =====================================================
  
  async ClassScheduleUpdate(req, res) {
    try {
      // Chỉ admin mới được quyền gán phòng
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ admin mới có quyền gán phòng'
        });
      }

      const { scheduleId, roomId } = req.body;
      const assignedBy = req.user.id;

      if (!scheduleId || !roomId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin scheduleId hoặc roomId'
        });
      }

      const result = await classScheduleService.ClassScheduleUpdate(scheduleId, roomId, assignedBy);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassScheduleController.ClassScheduleUpdate] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi gán phòng'
      });
    }
  }

  // Hủy gán phòng
  async ClassScheduleUnassign(req, res) {
    try {
      // Chỉ admin mới được quyền hủy gán phòng
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ admin mới có quyền hủy gán phòng'
        });
      }

      const { scheduleId } = req.body;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin scheduleId'
        });
      }

      const result = await classScheduleService.ClassScheduleUnassign(scheduleId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassScheduleController.ClassScheduleUnassign] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi hủy gán phòng'
      });
    }
  }

  // Lấy phòng khả dụng cho lịch học
  async getAvailableRoomsForSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const result = await classScheduleService.getAvailableRoomsForSchedule(scheduleId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách phòng khả dụng thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassScheduleController.getAvailableRoomsForSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách phòng khả dụng'
      });
    }
  }
}

module.exports = new ClassScheduleController();
