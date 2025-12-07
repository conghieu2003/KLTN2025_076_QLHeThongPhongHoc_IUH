const express = require('express');
const router = express.Router();
const classRoomTypeController = require('../controllers/classRoomType.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', classRoomTypeController.getAllClassRoomTypes);

// GET: Lấy loại phòng/lớp theo ID
router.get('/:id', classRoomTypeController.getClassRoomTypeById);

// POST: Tạo loại phòng/lớp mới 
router.post('/', authorize(['admin']), classRoomTypeController.createClassRoomType);

// PUT: Cập nhật loại phòng/lớp 
router.put('/:id', authorize(['admin']), classRoomTypeController.updateClassRoomType);

// DELETE: Xóa loại phòng/lớp 
router.delete('/:id', authorize(['admin']), classRoomTypeController.deleteClassRoomType);

module.exports = router;
