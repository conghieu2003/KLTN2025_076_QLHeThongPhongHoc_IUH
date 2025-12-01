const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DepartmentService {
  // =====================================================
  // LẤY DANH SÁCH KHOA
  // =====================================================
  
  async getAllDepartments() {
    try {
      const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' }
      });

      return {
        success: true,
        data: departments.map(dept => ({
          id: dept.id,
          code: dept.code,
          name: dept.name,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt
        }))
      };
    } catch (error) {
      console.error('[DepartmentService.getAllDepartments] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách khoa: ${error.message}`
      };
    }
  }

  // Lấy khoa theo ID
  async getDepartmentById(id) {
    try {
      const department = await prisma.department.findUnique({
        where: { id: parseInt(id) }
      });

      if (!department) {
        return {
          success: false,
          message: 'Không tìm thấy khoa'
        };
      }

      return {
        success: true,
        data: {
          id: department.id,
          code: department.code,
          name: department.name,
          createdAt: department.createdAt,
          updatedAt: department.updatedAt
        }
      };
    } catch (error) {
      console.error('[DepartmentService.getDepartmentById] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy thông tin khoa: ${error.message}`
      };
    }
  }

  // Tạo khoa mới
  async createDepartment(departmentData) {
    try {
      const { code, name } = departmentData;

      // Kiểm tra code đã tồn tại
      const existingCode = await prisma.department.findUnique({
        where: { code }
      });

      if (existingCode) {
        return {
          success: false,
          message: 'Mã khoa đã tồn tại'
        };
      }

      // Kiểm tra tên đã tồn tại
      const existingName = await prisma.department.findUnique({
        where: { name }
      });

      if (existingName) {
        return {
          success: false,
          message: 'Tên khoa đã tồn tại'
        };
      }

      const department = await prisma.department.create({
        data: {
          code,
          name
        }
      });

      return {
        success: true,
        data: {
          id: department.id,
          code: department.code,
          name: department.name,
          createdAt: department.createdAt,
          updatedAt: department.updatedAt
        },
        message: 'Tạo khoa thành công'
      };
    } catch (error) {
      console.error('[DepartmentService.createDepartment] Error:', error);
      return {
        success: false,
        message: `Lỗi tạo khoa: ${error.message}`
      };
    }
  }

  // Cập nhật khoa
  async updateDepartment(id, departmentData) {
    try {
      const { code, name } = departmentData;

      // Kiểm tra khoa có tồn tại
      const existingDepartment = await prisma.department.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingDepartment) {
        return {
          success: false,
          message: 'Không tìm thấy khoa'
        };
      }

      // Kiểm tra code đã tồn tại (trừ khoa hiện tại)
      if (code && code !== existingDepartment.code) {
        const existingCode = await prisma.department.findUnique({
          where: { code }
        });

        if (existingCode) {
          return {
            success: false,
            message: 'Mã khoa đã tồn tại'
          };
        }
      }

      // Kiểm tra tên đã tồn tại (trừ khoa hiện tại)
      if (name && name !== existingDepartment.name) {
        const existingName = await prisma.department.findUnique({
          where: { name }
        });

        if (existingName) {
          return {
            success: false,
            message: 'Tên khoa đã tồn tại'
          };
        }
      }

      const department = await prisma.department.update({
        where: { id: parseInt(id) },
        data: {
          code: code || existingDepartment.code,
          name: name || existingDepartment.name
        }
      });

      return {
        success: true,
        data: {
          id: department.id,
          code: department.code,
          name: department.name,
          createdAt: department.createdAt,
          updatedAt: department.updatedAt
        },
        message: 'Cập nhật khoa thành công'
      };
    } catch (error) {
      console.error('[DepartmentService.updateDepartment] Error:', error);
      return {
        success: false,
        message: `Lỗi cập nhật khoa: ${error.message}`
      };
    }
  }

  // Xóa khoa
  async deleteDepartment(id) {
    try {
      // Kiểm tra khoa có tồn tại
      const existingDepartment = await prisma.department.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingDepartment) {
        return {
          success: false,
          message: 'Không tìm thấy khoa'
        };
      }

      // Kiểm tra có lớp học nào thuộc khoa này không
      const classesCount = await prisma.class.count({
        where: { departmentId: parseInt(id) }
      });

      if (classesCount > 0) {
        return {
          success: false,
          message: 'Không thể xóa khoa vì còn lớp học thuộc khoa này'
        };
      }

      await prisma.department.delete({
        where: { id: parseInt(id) }
      });

      return {
        success: true,
        message: 'Xóa khoa thành công'
      };
    } catch (error) {
      console.error('[DepartmentService.deleteDepartment] Error:', error);
      return {
        success: false,
        message: `Lỗi xóa khoa: ${error.message}`
      };
    }
  }
}

module.exports = new DepartmentService();
