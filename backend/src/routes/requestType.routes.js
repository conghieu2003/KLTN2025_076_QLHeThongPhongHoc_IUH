const express = require('express');
const router = express.Router();
const requestTypeController = require('../controllers/requestType.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Tất cả routes đều cần xác thực
router.use(verifyToken);

// GET /api/request-types/schedule-statuses - Lấy danh sách trạng thái lịch học
router.get('/schedule-statuses', requestTypeController.getScheduleStatuses);

// GET /api/request-types - Lấy tất cả loại yêu cầu
router.get('/', requestTypeController.getAllRequestTypes);

// GET /api/request-types/:id - Lấy loại yêu cầu theo ID
router.get('/:id', requestTypeController.getRequestTypeById);

// POST /api/request-types - Tạo loại yêu cầu mới (chỉ admin)
router.post('/', authorize(['admin']), requestTypeController.createRequestType);

// PUT /api/request-types/:id - Cập nhật loại yêu cầu (chỉ admin)
router.put('/:id', authorize(['admin']), requestTypeController.updateRequestType);

// DELETE /api/request-types/:id - Xóa loại yêu cầu (chỉ admin)
router.delete('/:id', authorize(['admin']), requestTypeController.deleteRequestType);

module.exports = router;
