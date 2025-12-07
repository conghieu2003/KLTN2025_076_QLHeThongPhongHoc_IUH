const express = require('express');
const router = express.Router();
const scheduleManagementController = require('../controllers/scheduleManagement.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// GET: Lấy thống kê lịch học
router.get('/stats', scheduleManagementController.getSchedulingStats);

// GET: Lấy danh sách lớp học cho scheduling
router.get('/classes', scheduleManagementController.getClassesForScheduling);
// GET: Lấy danh sách phòng học khả dụng cho một lịch học

router.get('/available-rooms/:scheduleId', scheduleManagementController.getAvailableRoomsForSchedule);
// GET: Lấy danh sách khoa
router.get('/departments', scheduleManagementController.getDepartments);
// GET: Lấy danh sách giảng viên
router.get('/teachers', scheduleManagementController.getTeachers);
router.get('/teachers/available', scheduleManagementController.getAvailableTeachers);
// GET: Lấy danh sách loại yêu cầu
router.get('/request-types', scheduleManagementController.getRequestTypes);
router.use(verifyToken);
// GET: Lấy lịch học theo tuần
router.get('/weekly-schedule', scheduleManagementController.getWeeklySchedule);
// POST: Gán phòng cho lịch học
router.post('/assign-room/:scheduleId', authorize(['admin']), scheduleManagementController.assignRoomToSchedule);
// DELETE: Hủy gán phòng
router.delete('/unassign-room/:scheduleId', authorize(['admin']), scheduleManagementController.unassignRoomFromSchedule);

module.exports = router;