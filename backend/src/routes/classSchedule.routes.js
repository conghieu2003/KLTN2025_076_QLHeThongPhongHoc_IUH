const express = require('express');
const router = express.Router();
const classScheduleController = require('../controllers/classSchedule.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.use(verifyToken);

// GET: Lấy danh sách lịch học (ClassScheduleGet)
router.get('/', classScheduleController.ClassScheduleGet);

// GET: Lấy thông tin lịch học theo ID lớp
router.get('/class/:classId', classScheduleController.ClassScheduleGetById);

// POST: Gán phòng cho lịch học (ClassScheduleUpdate)
router.post('/assign', classScheduleController.ClassScheduleUpdate);

// POST: Hủy gán phòng
router.post('/unassign', classScheduleController.ClassScheduleUnassign);

// GET: Lấy phòng khả dụng cho lịch học
router.get('/:scheduleId/available-rooms', classScheduleController.getAvailableRoomsForSchedule);

module.exports = router;
