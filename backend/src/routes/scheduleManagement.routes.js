const express = require('express');
const router = express.Router();
const scheduleManagementController = require('../controllers/scheduleManagement.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/schedule-management/stats:
 *   get:
 *     summary: Lấy thống kê lịch học
 *     tags: [Schedule Management]
 *     description: Lấy thống kê về số lượng lớp học, lớp đã gán phòng, lớp chờ gán phòng
 *     responses:
 *       200:
 *         description: Thống kê lịch học thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalClasses:
 *                       type: number
 *                       description: Tổng số lớp học
 *                     pendingClasses:
 *                       type: number
 *                       description: Số lớp chờ gán phòng
 *                     assignedClasses:
 *                       type: number
 *                       description: Số lớp đã gán phòng
 *                     assignmentRate:
 *                       type: number
 *                       description: Tỷ lệ gán phòng (%)
 */
router.get('/stats', scheduleManagementController.getSchedulingStats);

/**
 * @swagger
 * /api/schedule-management/classes:
 *   get:
 *     summary: Lấy danh sách lớp học cho scheduling
 *     tags: [Schedule Management]
 *     description: Lấy danh sách tất cả lớp học để quản lý và gán phòng
 *     responses:
 *       200:
 *         description: Danh sách lớp học
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/classes', scheduleManagementController.getClassesForScheduling);

/**
 * @swagger
 * /api/schedule-management/available-rooms/{scheduleId}:
 *   get:
 *     summary: Lấy danh sách phòng học khả dụng cho một lịch học
 *     tags: [Schedule Management]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch học
 *     responses:
 *       200:
 *         description: Danh sách phòng học khả dụng
 */
router.get('/available-rooms/:scheduleId', scheduleManagementController.getAvailableRoomsForSchedule);

/**
 * @swagger
 * /api/schedule-management/departments:
 *   get:
 *     summary: Lấy danh sách khoa
 *     tags: [Schedule Management]
 *     responses:
 *       200:
 *         description: Danh sách khoa
 */
router.get('/departments', scheduleManagementController.getDepartments);

/**
 * @swagger
 * /api/schedule-management/teachers:
 *   get:
 *     summary: Lấy danh sách giảng viên
 *     tags: [Schedule Management]
 *     responses:
 *       200:
 *         description: Danh sách giảng viên
 */
router.get('/teachers', scheduleManagementController.getTeachers);

/**
 * @swagger
 * /api/schedule-management/request-types:
 *   get:
 *     summary: Lấy danh sách loại yêu cầu
 *     tags: [Schedule Management]
 *     responses:
 *       200:
 *         description: Danh sách loại yêu cầu
 */
router.get('/request-types', scheduleManagementController.getRequestTypes);

// Routes yêu cầu xác thực
router.use(verifyToken);

/**
 * @swagger
 * /api/schedule-management/weekly-schedule:
 *   get:
 *     summary: Lấy lịch học theo tuần
 *     tags: [Schedule Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu tuần (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lịch học theo tuần
 *       401:
 *         description: Unauthorized
 */
router.get('/weekly-schedule', scheduleManagementController.getWeeklySchedule);

/**
 * @swagger
 * /api/schedule-management/assign-room/{scheduleId}:
 *   post:
 *     summary: Gán phòng cho lịch học
 *     tags: [Schedule Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch học
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: ID của phòng học
 *     responses:
 *       200:
 *         description: Gán phòng thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ admin mới có quyền
 */
router.post('/assign-room/:scheduleId', authorize(['admin']), scheduleManagementController.assignRoomToSchedule);

/**
 * @swagger
 * /api/schedule-management/unassign-room/{scheduleId}:
 *   delete:
 *     summary: Hủy gán phòng cho lịch học
 *     tags: [Schedule Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch học
 *     responses:
 *       200:
 *         description: Hủy gán phòng thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ admin mới có quyền
 */
router.delete('/unassign-room/:scheduleId', authorize(['admin']), scheduleManagementController.unassignRoomFromSchedule);

module.exports = router;