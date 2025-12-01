const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TeacherService {
  // =====================================================
  // LẤY DANH SÁCH GIẢNG VIÊN
  // =====================================================
  
  async getAllTeachers() {
    try {
      const teachers = await prisma.teacher.findMany({
        include: {
          user: true,
          department: true,
          major: true
        },
        orderBy: { user: { fullName: 'asc' } }
      });

      return {
        success: true,
        data: teachers.map(teacher => ({
          id: teacher.id,
          teacherCode: teacher.teacherCode,
          fullName: teacher.user.fullName,
          email: teacher.user.email,
          phone: teacher.user.phone,
          gender: teacher.user.gender,
          departmentId: teacher.departmentId,
          departmentName: teacher.department?.name || 'Chưa xác định',
          majorId: teacher.majorId,
          majorName: teacher.major?.name || 'Chưa xác định',
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt
        }))
      };
    } catch (error) {
      console.error('[TeacherService.getAllTeachers] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách giảng viên: ${error.message}`
      };
    }
  }

  // Lấy giảng viên theo ID
  async getTeacherById(id) {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          department: true,
          major: true
        }
      });

      if (!teacher) {
        return {
          success: false,
          message: 'Không tìm thấy giảng viên'
        };
      }

      return {
        success: true,
        data: {
          id: teacher.id,
          teacherCode: teacher.teacherCode,
          fullName: teacher.user.fullName,
          email: teacher.user.email,
          phone: teacher.user.phone,
          gender: teacher.user.gender,
          departmentId: teacher.departmentId,
          departmentName: teacher.department?.name || 'Chưa xác định',
          majorId: teacher.majorId,
          majorName: teacher.major?.name || 'Chưa xác định',
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt
        }
      };
    } catch (error) {
      console.error('[TeacherService.getTeacherById] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy thông tin giảng viên: ${error.message}`
      };
    }
  }

  // Lấy giảng viên theo khoa
  async getTeachersByDepartment(departmentId) {
    try {
      const teachers = await prisma.teacher.findMany({
        where: { departmentId: parseInt(departmentId) },
        include: {
          user: true,
          department: true,
          major: true
        },
        orderBy: { user: { fullName: 'asc' } }
      });

      return {
        success: true,
        data: teachers.map(teacher => ({
          id: teacher.id,
          teacherCode: teacher.teacherCode,
          fullName: teacher.user.fullName,
          email: teacher.user.email,
          phone: teacher.user.phone,
          gender: teacher.user.gender,
          departmentId: teacher.departmentId,
          departmentName: teacher.department?.name || 'Chưa xác định',
          majorId: teacher.majorId,
          majorName: teacher.major?.name || 'Chưa xác định'
        }))
      };
    } catch (error) {
      console.error('[TeacherService.getTeachersByDepartment] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách giảng viên theo khoa: ${error.message}`
      };
    }
  }

  // Tạo giảng viên mới
  async createTeacher(teacherData) {
    try {
      const { 
        teacherCode, 
        fullName, 
        email, 
        phone, 
        gender, 
        departmentId, 
        majorId 
      } = teacherData;

      // Kiểm tra mã giảng viên đã tồn tại
      const existingTeacherCode = await prisma.teacher.findUnique({
        where: { teacherCode }
      });

      if (existingTeacherCode) {
        return {
          success: false,
          message: 'Mã giảng viên đã tồn tại'
        };
      }

      // Kiểm tra email đã tồn tại
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return {
          success: false,
          message: 'Email đã tồn tại'
        };
      }

      // Tạo tài khoản
      const account = await prisma.account.create({
        data: {
          username: teacherCode.toLowerCase(),
          password: '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', // Default password
          role: 'teacher',
          isActive: true
        }
      });

      // Tạo user
      const user = await prisma.user.create({
        data: {
          accountId: account.id,
          fullName,
          email,
          phone,
          gender,
          dateOfBirth: new Date('1990-01-01') // Default date
        }
      });

      // Tạo teacher
      const teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          teacherCode,
          departmentId: parseInt(departmentId),
          majorId: majorId ? parseInt(majorId) : null
        },
        include: {
          user: true,
          department: true,
          major: true
        }
      });

      return {
        success: true,
        data: {
          id: teacher.id,
          teacherCode: teacher.teacherCode,
          fullName: teacher.user.fullName,
          email: teacher.user.email,
          phone: teacher.user.phone,
          gender: teacher.user.gender,
          departmentId: teacher.departmentId,
          departmentName: teacher.department?.name || 'Chưa xác định',
          majorId: teacher.majorId,
          majorName: teacher.major?.name || 'Chưa xác định'
        },
        message: 'Tạo giảng viên thành công'
      };
    } catch (error) {
      console.error('[TeacherService.createTeacher] Error:', error);
      return {
        success: false,
        message: `Lỗi tạo giảng viên: ${error.message}`
      };
    }
  }

  // Cập nhật giảng viên
  async updateTeacher(id, teacherData) {
    try {
      const { 
        teacherCode, 
        fullName, 
        email, 
        phone, 
        gender, 
        departmentId, 
        majorId 
      } = teacherData;

      // Kiểm tra giảng viên có tồn tại
      const existingTeacher = await prisma.teacher.findUnique({
        where: { id: parseInt(id) },
        include: { user: true }
      });

      if (!existingTeacher) {
        return {
          success: false,
          message: 'Không tìm thấy giảng viên'
        };
      }

      // Kiểm tra mã giảng viên đã tồn tại (trừ giảng viên hiện tại)
      if (teacherCode && teacherCode !== existingTeacher.teacherCode) {
        const existingTeacherCode = await prisma.teacher.findUnique({
          where: { teacherCode }
        });

        if (existingTeacherCode) {
          return {
            success: false,
            message: 'Mã giảng viên đã tồn tại'
          };
        }
      }

      // Kiểm tra email đã tồn tại (trừ giảng viên hiện tại)
      if (email && email !== existingTeacher.user.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email }
        });

        if (existingEmail) {
          return {
            success: false,
            message: 'Email đã tồn tại'
          };
        }
      }

      // Cập nhật user
      await prisma.user.update({
        where: { id: existingTeacher.userId },
        data: {
          fullName: fullName || existingTeacher.user.fullName,
          email: email || existingTeacher.user.email,
          phone: phone || existingTeacher.user.phone,
          gender: gender || existingTeacher.user.gender
        }
      });

      // Cập nhật teacher
      const teacher = await prisma.teacher.update({
        where: { id: parseInt(id) },
        data: {
          teacherCode: teacherCode || existingTeacher.teacherCode,
          departmentId: departmentId ? parseInt(departmentId) : existingTeacher.departmentId,
          majorId: majorId ? parseInt(majorId) : existingTeacher.majorId
        },
        include: {
          user: true,
          department: true,
          major: true
        }
      });

      return {
        success: true,
        data: {
          id: teacher.id,
          teacherCode: teacher.teacherCode,
          fullName: teacher.user.fullName,
          email: teacher.user.email,
          phone: teacher.user.phone,
          gender: teacher.user.gender,
          departmentId: teacher.departmentId,
          departmentName: teacher.department?.name || 'Chưa xác định',
          majorId: teacher.majorId,
          majorName: teacher.major?.name || 'Chưa xác định'
        },
        message: 'Cập nhật giảng viên thành công'
      };
    } catch (error) {
      console.error('[TeacherService.updateTeacher] Error:', error);
      return {
        success: false,
        message: `Lỗi cập nhật giảng viên: ${error.message}`
      };
    }
  }

  // Xóa giảng viên
  async deleteTeacher(id) {
    try {
      // Kiểm tra giảng viên có tồn tại
      const existingTeacher = await prisma.teacher.findUnique({
        where: { id: parseInt(id) },
        include: { user: true }
      });

      if (!existingTeacher) {
        return {
          success: false,
          message: 'Không tìm thấy giảng viên'
        };
      }

      // Kiểm tra có lớp học nào thuộc giảng viên này không
      const classesCount = await prisma.class.count({
        where: { teacherId: parseInt(id) }
      });

      if (classesCount > 0) {
        return {
          success: false,
          message: 'Không thể xóa giảng viên vì còn lớp học thuộc giảng viên này'
        };
      }

      // Xóa teacher (sẽ cascade xóa user và account)
      await prisma.teacher.delete({
        where: { id: parseInt(id) }
      });

      return {
        success: true,
        message: 'Xóa giảng viên thành công'
      };
    } catch (error) {
      console.error('[TeacherService.deleteTeacher] Error:', error);
      return {
        success: false,
        message: `Lỗi xóa giảng viên: ${error.message}`
      };
    }
  }
}

module.exports = new TeacherService();
