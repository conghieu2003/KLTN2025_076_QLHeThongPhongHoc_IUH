const classRoomTypeService = require('../services/classRoomType.service');

class ClassRoomTypeController {
  // Lấy tất cả loại phòng/lớp
  async getAllClassRoomTypes(req, res) {
    try {
      const result = await classRoomTypeService.getAllClassRoomTypes();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách loại phòng/lớp thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassRoomTypeController.getAllClassRoomTypes] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách loại phòng/lớp'
      });
    }
  }

  // Lấy loại phòng/lớp theo ID
  async getClassRoomTypeById(req, res) {
    try {
      const { id } = req.params;
      const result = await classRoomTypeService.getClassRoomTypeById(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy thông tin loại phòng/lớp thành công',
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassRoomTypeController.getClassRoomTypeById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin loại phòng/lớp'
      });
    }
  }

  // Tạo loại phòng/lớp mới
  async createClassRoomType(req, res) {
    try {
      const classRoomTypeData = req.body;
      const result = await classRoomTypeService.createClassRoomType(classRoomTypeData);
      
      if (result.success) {
        res.status(201).json({
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
      console.error('[ClassRoomTypeController.createClassRoomType] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo loại phòng/lớp'
      });
    }
  }

  // Cập nhật loại phòng/lớp
  async updateClassRoomType(req, res) {
    try {
      const { id } = req.params;
      const classRoomTypeData = req.body;
      const result = await classRoomTypeService.updateClassRoomType(id, classRoomTypeData);
      
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
      console.error('[ClassRoomTypeController.updateClassRoomType] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật loại phòng/lớp'
      });
    }
  }

  // Xóa loại phòng/lớp
  async deleteClassRoomType(req, res) {
    try {
      const { id } = req.params;
      const result = await classRoomTypeService.deleteClassRoomType(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[ClassRoomTypeController.deleteClassRoomType] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa loại phòng/lớp'
      });
    }
  }
}

module.exports = new ClassRoomTypeController();
