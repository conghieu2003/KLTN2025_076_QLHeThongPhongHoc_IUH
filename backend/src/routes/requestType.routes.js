const express = require('express');
const router = express.Router();
const requestTypeController = require('../controllers/requestType.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.use(verifyToken);

// GET: Lấy danh sách trạng thái lịch học
router.get('/schedule-statuses', requestTypeController.getScheduleStatuses);

// GET: Lấy tất cả loại yêu cầu
router.get('/', requestTypeController.getAllRequestTypes);

// GET: Lấy loại yêu cầu theo ID
router.get('/:id', requestTypeController.getRequestTypeById);

// POST: Tạo loại yêu cầu mới (chỉ admin)
router.post('/', authorize(['admin']), requestTypeController.createRequestType);

// PUT: Cập nhật loại yêu cầu (chỉ admin)
router.put('/:id', authorize(['admin']), requestTypeController.updateRequestType);

// DELETE: Xóa loại yêu cầu (chỉ admin)
router.delete('/:id', authorize(['admin']), requestTypeController.deleteRequestType);

module.exports = router;
