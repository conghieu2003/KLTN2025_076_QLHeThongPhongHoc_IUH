const express = require('express');
const router = express.Router();
const scheduleRequestController = require('../controllers/scheduleRequest.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// POST: Tạo yêu cầu lịch học
router.post('/', scheduleRequestController.createScheduleRequest);

// GET: Lấy danh sách yêu cầu lịch học
router.get('/', scheduleRequestController.getScheduleRequests);

// GET: Lấy yêu cầu lịch học của một giảng viên
router.get('/teacher/:teacherId', scheduleRequestController.getTeacherSchedules);

// GET: Lấy yêu cầu lịch học theo ID
router.get('/:requestId', scheduleRequestController.getScheduleRequestById);

// PUT: Cập nhật trạng thái yêu cầu lịch học
router.put('/:requestId/status', scheduleRequestController.updateScheduleRequestStatus);

// PUT: Cập nhật phòng lịch học (chỉ admin)
router.put('/:requestId/room', scheduleRequestController.updateScheduleRequestRoom);

module.exports = router;
