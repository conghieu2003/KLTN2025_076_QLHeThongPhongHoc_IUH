const teacherService = require('../services/teacher.service');

class TeacherController {
  // Lấy tất cả giảng viên
  async getAllTeachers(req, res) {
    try {
      const result = await teacherService.getAllTeachers();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách giảng viên thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[TeacherController.getAllTeachers] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách giảng viên'
      });
    }
  }

  // Lấy giảng viên theo ID
  async getTeacherById(req, res) {
    try {
      const { id } = req.params;
      const result = await teacherService.getTeacherById(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy thông tin giảng viên thành công',
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[TeacherController.getTeacherById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin giảng viên'
      });
    }
  }

  // Lấy giảng viên theo khoa
  async getTeachersByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const result = await teacherService.getTeachersByDepartment(departmentId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách giảng viên theo khoa thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[TeacherController.getTeachersByDepartment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách giảng viên theo khoa'
      });
    }
  }

  // Tạo giảng viên mới
  async createTeacher(req, res) {
    try {
      const teacherData = req.body;
      const result = await teacherService.createTeacher(teacherData);
      
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
      console.error('[TeacherController.createTeacher] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo giảng viên'
      });
    }
  }

  // Cập nhật giảng viên
  async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const teacherData = req.body;
      const result = await teacherService.updateTeacher(id, teacherData);
      
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
      console.error('[TeacherController.updateTeacher] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật giảng viên'
      });
    }
  }

  // Xóa giảng viên
  async deleteTeacher(req, res) {
    try {
      const { id } = req.params;
      const result = await teacherService.deleteTeacher(id);
      
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
      console.error('[TeacherController.deleteTeacher] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa giảng viên'
      });
    }
  }
}

module.exports = new TeacherController();
