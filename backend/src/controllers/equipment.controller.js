const equipmentService = require('../services/equipment.service');

class EquipmentController {
  sendError(res, error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  // lấy danh sách thiết bị
  async getAllEquipment(req, res) {
    try {
      const equipment = await equipmentService.getAllEquipment();
      return res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // lấy thiết bị theo ID
  async getEquipmentById(req, res) {
    try {
      const { equipmentId } = req.params;
      const equipment = await equipmentService.getEquipmentById(equipmentId);
      return res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // tạo thiết bị mới
  async createEquipment(req, res) {
    try {
      const equipment = await equipmentService.createEquipment(req.body);
      return res.status(201).json({
        success: true,
        data: equipment,
        message: 'Tạo thiết bị thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // cập nhật thiết bị
  async updateEquipment(req, res) {
    try {
      const { equipmentId } = req.params;
      const equipment = await equipmentService.updateEquipment(equipmentId, req.body);
      return res.status(200).json({
        success: true,
        data: equipment,
        message: 'Cập nhật thiết bị thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // xóa thiết bị
  async deleteEquipment(req, res) {
    try {
      const { equipmentId } = req.params;
      const result = await equipmentService.deleteEquipment(equipmentId);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Xóa thiết bị thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // lấy thiết bị của phòng học
  async getRoomEquipment(req, res) {
    try {
      const { roomId } = req.params;
      const equipment = await equipmentService.getRoomEquipment(roomId);
      return res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // thêm thiết bị vào phòng học
  async addRoomEquipment(req, res) {
    try {
      const { roomId } = req.params;
      const equipment = await equipmentService.addRoomEquipment(roomId, req.body);
      return res.status(201).json({
        success: true,
        data: equipment,
        message: 'Thêm thiết bị vào phòng học thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // cập nhật thiết bị phòng học
  async updateRoomEquipment(req, res) {
    try {
      const { roomEquipmentId } = req.params;
      const equipment = await equipmentService.updateRoomEquipment(roomEquipmentId, req.body);
      return res.status(200).json({
        success: true,
        data: equipment,
        message: 'Cập nhật thiết bị phòng học thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // xóa thiết bị khỏi phòng học
  async removeRoomEquipment(req, res) {
    try {
      const { roomEquipmentId } = req.params;
      const result = await equipmentService.removeRoomEquipment(roomEquipmentId);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Xóa thiết bị khỏi phòng học thành công'
      });
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

const controller = new EquipmentController();

// Bind all methods to preserve 'this' context when used as route handlers
module.exports = {
  getAllEquipment: controller.getAllEquipment.bind(controller),
  getEquipmentById: controller.getEquipmentById.bind(controller),
  createEquipment: controller.createEquipment.bind(controller),
  updateEquipment: controller.updateEquipment.bind(controller),
  deleteEquipment: controller.deleteEquipment.bind(controller),
  getRoomEquipment: controller.getRoomEquipment.bind(controller),
  addRoomEquipment: controller.addRoomEquipment.bind(controller),
  updateRoomEquipment: controller.updateRoomEquipment.bind(controller),
  removeRoomEquipment: controller.removeRoomEquipment.bind(controller)
};

