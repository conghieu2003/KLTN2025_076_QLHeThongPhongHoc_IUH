const express = require('express');
const router = express.Router();
const classScheduleController = require('../controllers/classSchedule.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Tất cả routes đều cần xác thực
router.use(verifyToken);

// =====================================================
// CLASS SCHEDULE GET - LẤY DANH SÁCH LỊCH HỌC
// =====================================================

// GET /api/class-schedules - Lấy danh sách lịch học (ClassScheduleGet)
router.get('/', classScheduleController.ClassScheduleGet);

// GET /api/class-schedules/class/:classId - Lấy thông tin lịch học theo ID lớp
router.get('/class/:classId', classScheduleController.ClassScheduleGetById);

// =====================================================
// CLASS SCHEDULE UPDATE - CẬP NHẬT GÁN PHÒNG
// =====================================================

// POST /api/class-schedules/assign - Gán phòng cho lịch học (ClassScheduleUpdate)
router.post('/assign', classScheduleController.ClassScheduleUpdate);

// POST /api/class-schedules/unassign - Hủy gán phòng
router.post('/unassign', classScheduleController.ClassScheduleUnassign);

// =====================================================
// LẤY PHÒNG KHẢ DỤNG
// =====================================================

// GET /api/class-schedules/:scheduleId/available-rooms - Lấy phòng khả dụng cho lịch học
router.get('/:scheduleId/available-rooms', classScheduleController.getAvailableRoomsForSchedule);

module.exports = router;
