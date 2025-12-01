const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Tất cả routes đều cần xác thực
router.use(verifyToken);

// GET /api/departments - Lấy tất cả khoa
router.get('/', departmentController.getAllDepartments);

// GET /api/departments/:id - Lấy khoa theo ID
router.get('/:id', departmentController.getDepartmentById);

// POST /api/departments - Tạo khoa mới (chỉ admin)
router.post('/', authorize(['admin']), departmentController.createDepartment);

// PUT /api/departments/:id - Cập nhật khoa (chỉ admin)
router.put('/:id', authorize(['admin']), departmentController.updateDepartment);

// DELETE /api/departments/:id - Xóa khoa (chỉ admin)
router.delete('/:id', authorize(['admin']), departmentController.deleteDepartment);

module.exports = router;
