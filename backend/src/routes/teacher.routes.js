const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.use(verifyToken);

// GET: Lấy tất cả giảng viên
router.get('/', teacherController.getAllTeachers);

// GET: Lấy giảng viên theo ID
router.get('/:id', teacherController.getTeacherById);

// GET: Lấy giảng viên theo khoa
router.get('/department/:departmentId', teacherController.getTeachersByDepartment);

// POST: Tạo giảng viên mới (chỉ admin)
router.post('/', authorize(['admin']), teacherController.createTeacher);

// PUT: Cập nhật giảng viên (chỉ admin)
router.put('/:id', authorize(['admin']), teacherController.updateTeacher);

// DELETE: Xóa giảng viên (chỉ admin)
router.delete('/:id', authorize(['admin']), teacherController.deleteTeacher);

module.exports = router;
