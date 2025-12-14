const roomIssueService = require('../services/roomIssue.service');

class RoomIssueController {
  sendError(res, error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  // API lấy danh sách vấn đề phòng học
  async getAllRoomIssues(req, res) {
    try {
      const filters = {
        classRoomId: req.query.classRoomId,
        status: req.query.status,
        severity: req.query.severity,
        issueType: req.query.issueType
      };
      
      const issues = await roomIssueService.getAllRoomIssues(filters);
      return res.status(200).json({
        success: true,
        data: issues
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API lấy vấn đề theo ID
  async getRoomIssueById(req, res) {
    try {
      const { issueId } = req.params;
      const issue = await roomIssueService.getRoomIssueById(issueId);
      return res.status(200).json({
        success: true,
        data: issue
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API tạo vấn đề mới
  async createRoomIssue(req, res) {
    try {
      const issue = await roomIssueService.createRoomIssue(req.body);
      return res.status(201).json({
        success: true,
        data: issue,
        message: 'Báo cáo vấn đề thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API cập nhật vấn đề
  async updateRoomIssue(req, res) {
    try {
      const { issueId } = req.params;
      const issue = await roomIssueService.updateRoomIssue(issueId, req.body);
      return res.status(200).json({
        success: true,
        data: issue,
        message: 'Cập nhật vấn đề thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API nhận/phân công vấn đề
  async acceptRoomIssue(req, res) {
    try {
      const { issueId } = req.params;
      const { assignedBy } = req.body; // ID của người nhận/phân công
      const issue = await roomIssueService.acceptRoomIssue(issueId, assignedBy);
      return res.status(200).json({
        success: true,
        data: issue,
        message: 'Đã nhận/phân công vấn đề thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API phân công vấn đề cho maintenance cụ thể (admin only)
  async assignRoomIssue(req, res) {
    try {
      const { issueId } = req.params;
      const { maintenanceUserId, assignedBy } = req.body;
      const issue = await roomIssueService.assignRoomIssue(issueId, maintenanceUserId, assignedBy);
      return res.status(200).json({
        success: true,
        data: issue,
        message: 'Đã phân công vấn đề thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API lấy danh sách maintenance users
  async getMaintenanceUsers(req, res) {
    try {
      const users = await roomIssueService.getMaintenanceUsers();
      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // API xóa vấn đề
  async deleteRoomIssue(req, res) {
    try {
      const { issueId } = req.params;
      const result = await roomIssueService.deleteRoomIssue(issueId);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Xóa vấn đề thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

const controller = new RoomIssueController();

// Bind all methods to preserve 'this' context when used as route handlers
module.exports = {
  getAllRoomIssues: controller.getAllRoomIssues.bind(controller),
  getRoomIssueById: controller.getRoomIssueById.bind(controller),
  createRoomIssue: controller.createRoomIssue.bind(controller),
  updateRoomIssue: controller.updateRoomIssue.bind(controller),
  acceptRoomIssue: controller.acceptRoomIssue.bind(controller),
  assignRoomIssue: controller.assignRoomIssue.bind(controller),
  getMaintenanceUsers: controller.getMaintenanceUsers.bind(controller),
  deleteRoomIssue: controller.deleteRoomIssue.bind(controller)
};

