const classScheduleService = require('../services/classSchedule.service');

class ClassScheduleController {
  // lấy danh sách lịch học
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
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin lịch học'
      });
    }
  }
  // cập nhật gán phòng
  async ClassScheduleUpdate(req, res) {
    try {
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
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi gán phòng'
      });
    }
  }

  // hủy gán phòng
  async ClassScheduleUnassign(req, res) {
    try {
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

  // lấy phòng trống cho lịch học
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
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách phòng khả dụng'
      });
    }
  }
}

module.exports = new ClassScheduleController();
