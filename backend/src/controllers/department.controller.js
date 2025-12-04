const departmentService = require('../services/department.service');

class DepartmentController {
  // Lấy tất cả khoa
  async getAllDepartments(req, res) {
    try {
      const result = await departmentService.getAllDepartments();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách khoa thành công',
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
        message: 'Lỗi server khi lấy danh sách khoa'
      });
    }
  }

  // Lấy khoa theo ID
  async getDepartmentById(req, res) {
    try {
      const { id } = req.params;
      const result = await departmentService.getDepartmentById(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy thông tin khoa thành công',
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
        message: 'Lỗi server khi lấy thông tin khoa'
      });
    }
  }

  // Tạo khoa mới
  async createDepartment(req, res) {
    try {
      const departmentData = req.body;
      const result = await departmentService.createDepartment(departmentData);
      
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
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo khoa'
      });
    }
  }

  // Cập nhật khoa
  async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const departmentData = req.body;
      const result = await departmentService.updateDepartment(id, departmentData);
      
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
        message: 'Lỗi server khi cập nhật khoa'
      });
    }
  }

  // Xóa khoa
  async deleteDepartment(req, res) {
    try {
      const { id } = req.params;
      const result = await departmentService.deleteDepartment(id);
      
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
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa khoa'
      });
    }
  }
}

module.exports = new DepartmentController();
