const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// GET: Lấy danh sách khoa
router.get('/departments', userController.departments);
router.get('/majors', userController.majors);

// GET: Lấy danh sách chuyên ngành
router.use(verifyToken);
// POST: Tạo danh sách người dùng
router.post('/list', authorize(['admin']), userController.list);
// GET: Lấy mã tiếp theo
router.get('/next-code', authorize(['admin']), userController.nextCode);
// POST: Tạo người dùng mới
router.post('/create', authorize(['admin']), userController.create);
// PUT: Cập nhật người dùng
router.put('/:userId', authorize(['admin']), userController.update);
// POST: Gửi email
router.post('/send-email', authorize(['admin']), userController.sendEmail);

module.exports = router;


