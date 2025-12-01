const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Tất cả routes đều cần xác thực
router.use(verifyToken);

// GET /api/teachers - Lấy tất cả giảng viên
router.get('/', teacherController.getAllTeachers);

// GET /api/teachers/:id - Lấy giảng viên theo ID
router.get('/:id', teacherController.getTeacherById);

// GET /api/teachers/department/:departmentId - Lấy giảng viên theo khoa
router.get('/department/:departmentId', teacherController.getTeachersByDepartment);

// POST /api/teachers - Tạo giảng viên mới (chỉ admin)
router.post('/', authorize(['admin']), teacherController.createTeacher);

// PUT /api/teachers/:id - Cập nhật giảng viên (chỉ admin)
router.put('/:id', authorize(['admin']), teacherController.updateTeacher);

// DELETE /api/teachers/:id - Xóa giảng viên (chỉ admin)
router.delete('/:id', authorize(['admin']), teacherController.deleteTeacher);

module.exports = router;
