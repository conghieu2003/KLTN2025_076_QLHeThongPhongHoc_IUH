const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RequestTypeService {
  async getScheduleStatuses() {
    try {
      const requestTypes = await prisma.requestType.findMany({
        where: { id: { lte: 6 } }, // Chỉ lấy trạng thái lịch học (1-6)
        orderBy: { id: 'asc' }
      });

      return {
        success: true,
        data: requestTypes.map(type => ({
          id: type.id,
          name: type.name
        }))
      };
    } catch (error) {
      console.error('[RequestTypeService.getScheduleStatuses] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách trạng thái lịch học: ${error.message}`
      };
    }
  }

  // Lấy tất cả loại yêu cầu
  async getAllRequestTypes() {
    try {
      const requestTypes = await prisma.requestType.findMany({
        orderBy: { id: 'asc' }
      });

      return {
        success: true,
        data: requestTypes.map(type => ({
          id: type.id,
          name: type.name
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi lấy danh sách loại yêu cầu: ${error.message}`
      };
    }
  }

  // Lấy loại yêu cầu theo ID
  async getRequestTypeById(id) {
    try {
      const requestType = await prisma.requestType.findUnique({
        where: { id: parseInt(id) }
      });

      if (!requestType) {
        return {
          success: false,
          message: 'Không tìm thấy loại yêu cầu'
        };
      }

      return {
        success: true,
        data: {
          id: requestType.id,
          name: requestType.name
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi lấy thông tin loại yêu cầu: ${error.message}`
      };
    }
  }

  // Tạo loại yêu cầu mới
  async createRequestType(requestTypeData) {
    try {
      const { name } = requestTypeData;
      const existingType = await prisma.requestType.findFirst({
        where: { name }
      });

      if (existingType) {
        return {
          success: false,
          message: 'Tên loại yêu cầu đã tồn tại'
        };
      }

      const requestType = await prisma.requestType.create({
        data: { name }
      });

      return {
        success: true,
        data: {
          id: requestType.id,
          name: requestType.name
        },
        message: 'Tạo loại yêu cầu thành công'
      };
    } catch (error) {
      console.error('[RequestTypeService.createRequestType] Error:', error);
      return {
        success: false,
        message: `Lỗi tạo loại yêu cầu: ${error.message}`
      };
    }
  }

  // Cập nhật loại yêu cầu
  async updateRequestType(id, requestTypeData) {
    try {
      const { name } = requestTypeData;
      const existingType = await prisma.requestType.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingType) {
        return {
          success: false,
          message: 'Không tìm thấy loại yêu cầu'
        };
      }

      if (name && name !== existingType.name) {
        const existingName = await prisma.requestType.findFirst({
          where: { name }
        });

        if (existingName) {
          return {
            success: false,
            message: 'Tên loại yêu cầu đã tồn tại'
          };
        }
      }

      const requestType = await prisma.requestType.update({
        where: { id: parseInt(id) },
        data: { name: name || existingType.name }
      });

      return {
        success: true,
        data: {
          id: requestType.id,
          name: requestType.name
        },
        message: 'Cập nhật loại yêu cầu thành công'
      };
    } catch (error) {
      console.error('[RequestTypeService.updateRequestType] Error:', error);
      return {
        success: false,
        message: `Lỗi cập nhật loại yêu cầu: ${error.message}`
      };
    }
  }

  // Xóa loại yêu cầu
  async deleteRequestType(id) {
    try {
      const existingType = await prisma.requestType.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingType) {
        return {
          success: false,
          message: 'Không tìm thấy loại yêu cầu'
        };
      }

      const schedulesCount = await prisma.classSchedule.count({
        where: { statusId: parseInt(id) }
      });

      if (schedulesCount > 0) {
        return {
          success: false,
          message: 'Không thể xóa loại yêu cầu vì còn lịch học sử dụng loại này'
        };
      }

      // Kiểm tra có yêu cầu nào sử dụng loại này không
      const requestsCount = await prisma.scheduleRequest.count({
        where: { requestTypeId: parseInt(id) }
      });

      if (requestsCount > 0) {
        return {
          success: false,
          message: 'Không thể xóa loại yêu cầu vì còn yêu cầu sử dụng loại này'
        };
      }

      await prisma.requestType.delete({
        where: { id: parseInt(id) }
      });

      return {
        success: true,
        message: 'Xóa loại yêu cầu thành công'
      };
    } catch (error) {
      console.error('[RequestTypeService.deleteRequestType] Error:', error);
      return {
        success: false,
        message: `Lỗi xóa loại yêu cầu: ${error.message}`
      };
    }
  }
}

module.exports = new RequestTypeService();
