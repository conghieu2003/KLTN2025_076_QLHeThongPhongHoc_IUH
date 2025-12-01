const express = require('express');
const router = express.Router();
const classRoomTypeController = require('../controllers/classRoomType.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Tất cả routes đều cần xác thực
router.use(verifyToken);

// GET /api/classroom-types - Lấy tất cả loại phòng/lớp
router.get('/', classRoomTypeController.getAllClassRoomTypes);

// GET /api/classroom-types/:id - Lấy loại phòng/lớp theo ID
router.get('/:id', classRoomTypeController.getClassRoomTypeById);

// POST /api/classroom-types - Tạo loại phòng/lớp mới (chỉ admin)
router.post('/', authorize(['admin']), classRoomTypeController.createClassRoomType);

// PUT /api/classroom-types/:id - Cập nhật loại phòng/lớp (chỉ admin)
router.put('/:id', authorize(['admin']), classRoomTypeController.updateClassRoomType);

// DELETE /api/classroom-types/:id - Xóa loại phòng/lớp (chỉ admin)
router.delete('/:id', authorize(['admin']), classRoomTypeController.deleteClassRoomType);

module.exports = router;
