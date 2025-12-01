const requestTypeService = require('../services/requestType.service');

class RequestTypeController {
  // Lấy danh sách trạng thái lịch học
  async getScheduleStatuses(req, res) {
    try {
      const result = await requestTypeService.getScheduleStatuses();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách trạng thái lịch học thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[RequestTypeController.getScheduleStatuses] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách trạng thái lịch học'
      });
    }
  }

  // Lấy tất cả loại yêu cầu
  async getAllRequestTypes(req, res) {
    try {
      const result = await requestTypeService.getAllRequestTypes();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy danh sách loại yêu cầu thành công',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[RequestTypeController.getAllRequestTypes] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách loại yêu cầu'
      });
    }
  }

  // Lấy loại yêu cầu theo ID
  async getRequestTypeById(req, res) {
    try {
      const { id } = req.params;
      const result = await requestTypeService.getRequestTypeById(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lấy thông tin loại yêu cầu thành công',
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[RequestTypeController.getRequestTypeById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin loại yêu cầu'
      });
    }
  }

  // Tạo loại yêu cầu mới
  async createRequestType(req, res) {
    try {
      const requestTypeData = req.body;
      const result = await requestTypeService.createRequestType(requestTypeData);
      
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
      console.error('[RequestTypeController.createRequestType] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo loại yêu cầu'
      });
    }
  }

  // Cập nhật loại yêu cầu
  async updateRequestType(req, res) {
    try {
      const { id } = req.params;
      const requestTypeData = req.body;
      const result = await requestTypeService.updateRequestType(id, requestTypeData);
      
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
      console.error('[RequestTypeController.updateRequestType] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật loại yêu cầu'
      });
    }
  }

  // Xóa loại yêu cầu
  async deleteRequestType(req, res) {
    try {
      const { id } = req.params;
      const result = await requestTypeService.deleteRequestType(id);
      
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
      console.error('[RequestTypeController.deleteRequestType] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa loại yêu cầu'
      });
    }
  }
}

module.exports = new RequestTypeController();
