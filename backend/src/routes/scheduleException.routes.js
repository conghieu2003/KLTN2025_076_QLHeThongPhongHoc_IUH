const express = require('express');
const router = express.Router();
const scheduleExceptionController = require('../controllers/scheduleException.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Tất cả routes đều yêu cầu authentication
router.use(authMiddleware.verifyToken);

// Tạo ngoại lệ lịch học
router.post('/', scheduleExceptionController.createScheduleException);

// Lấy danh sách ngoại lệ lịch học
router.get('/', scheduleExceptionController.getScheduleExceptions);

// Lấy chi tiết ngoại lệ lịch học
router.get('/:id', scheduleExceptionController.getScheduleExceptionById);

// Cập nhật ngoại lệ lịch học
router.put('/:id', scheduleExceptionController.updateScheduleException);

// Xóa ngoại lệ lịch học
router.delete('/:id', scheduleExceptionController.deleteScheduleException);

// Lấy lịch học có thể tạo ngoại lệ
router.get('/available/schedules', scheduleExceptionController.getAvailableSchedules);

module.exports = router;
