const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ClassRoomTypeService {
  // LẤY DANH SÁCH LOẠI PHÒNG/LỚP
  async getAllClassRoomTypes() {
    try {
      const classRoomTypes = await prisma.classRoomType.findMany({
        orderBy: { id: 'asc' }
      });

      return {
        success: true,
        data: classRoomTypes.map(type => ({
          id: type.id,
          name: type.name
        }))
      };
    } catch (error) {
      console.error('[ClassRoomTypeService.getAllClassRoomTypes] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách loại phòng/lớp: ${error.message}`
      };
    }
  }

  // Lấy loại phòng/lớp theo ID
  async getClassRoomTypeById(id) {
    try {
      const classRoomType = await prisma.classRoomType.findUnique({
        where: { id: parseInt(id) }
      });

      if (!classRoomType) {
        return {
          success: false,
          message: 'Không tìm thấy loại phòng/lớp'
        };
      }

      return {
        success: true,
        data: {
          id: classRoomType.id,
          name: classRoomType.name
        }
      };
    } catch (error) {
      console.error('[ClassRoomTypeService.getClassRoomTypeById] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy thông tin loại phòng/lớp: ${error.message}`
      };
    }
  }

  // Tạo loại phòng/lớp mới
  async createClassRoomType(classRoomTypeData) {
    try {
      const { name } = classRoomTypeData;

      // Kiểm tra tên đã tồn tại
      const existingType = await prisma.classRoomType.findFirst({
        where: { name }
      });

      if (existingType) {
        return {
          success: false,
          message: 'Tên loại phòng/lớp đã tồn tại'
        };
      }

      const classRoomType = await prisma.classRoomType.create({
        data: { name }
      });

      return {
        success: true,
        data: {
          id: classRoomType.id,
          name: classRoomType.name
        },
        message: 'Tạo loại phòng/lớp thành công'
      };
    } catch (error) {
      console.error('[ClassRoomTypeService.createClassRoomType] Error:', error);
      return {
        success: false,
        message: `Lỗi tạo loại phòng/lớp: ${error.message}`
      };
    }
  }

  // Cập nhật loại phòng/lớp
  async updateClassRoomType(id, classRoomTypeData) {
    try {
      const { name } = classRoomTypeData;

      // Kiểm tra loại phòng/lớp có tồn tại
      const existingType = await prisma.classRoomType.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingType) {
        return {
          success: false,
          message: 'Không tìm thấy loại phòng/lớp'
        };
      }

      // Kiểm tra tên đã tồn tại (trừ loại hiện tại)
      if (name && name !== existingType.name) {
        const existingName = await prisma.classRoomType.findFirst({
          where: { name }
        });

        if (existingName) {
          return {
            success: false,
            message: 'Tên loại phòng/lớp đã tồn tại'
          };
        }
      }

      const classRoomType = await prisma.classRoomType.update({
        where: { id: parseInt(id) },
        data: { name: name || existingType.name }
      });

      return {
        success: true,
        data: {
          id: classRoomType.id,
          name: classRoomType.name
        },
        message: 'Cập nhật loại phòng/lớp thành công'
      };
    } catch (error) {
      console.error('[ClassRoomTypeService.updateClassRoomType] Error:', error);
      return {
        success: false,
        message: `Lỗi cập nhật loại phòng/lớp: ${error.message}`
      };
    }
  }

  // Xóa loại phòng/lớp
  async deleteClassRoomType(id) {
    try {
      // Kiểm tra loại phòng/lớp có tồn tại
      const existingType = await prisma.classRoomType.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingType) {
        return {
          success: false,
          message: 'Không tìm thấy loại phòng/lớp'
        };
      }

      // Kiểm tra có lớp học nào sử dụng loại này không
      const classesCount = await prisma.class.count({
        where: { classRoomTypeId: parseInt(id) }
      });

      if (classesCount > 0) {
        return {
          success: false,
          message: 'Không thể xóa loại phòng/lớp vì còn lớp học sử dụng loại này'
        };
      }

      // Kiểm tra có phòng học nào sử dụng loại này không
      const roomsCount = await prisma.classRoom.count({
        where: { classRoomTypeId: parseInt(id) }
      });

      if (roomsCount > 0) {
        return {
          success: false,
          message: 'Không thể xóa loại phòng/lớp vì còn phòng học sử dụng loại này'
        };
      }

      await prisma.classRoomType.delete({
        where: { id: parseInt(id) }
      });

      return {
        success: true,
        message: 'Xóa loại phòng/lớp thành công'
      };
    } catch (error) {
      console.error('[ClassRoomTypeService.deleteClassRoomType] Error:', error);
      return {
        success: false,
        message: `Lỗi xóa loại phòng/lớp: ${error.message}`
      };
    }
  }
}

module.exports = new ClassRoomTypeService();
