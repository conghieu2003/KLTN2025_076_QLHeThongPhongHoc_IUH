const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.use(verifyToken);

// GET: Lấy tất cả khoa
router.get('/', departmentController.getAllDepartments);

// GET: Lấy khoa theo ID
router.get('/:id', departmentController.getDepartmentById);

// POST: Tạo khoa mới (chỉ admin)
router.post('/', authorize(['admin']), departmentController.createDepartment);

// PUT: Cập nhật khoa (chỉ admin)
router.put('/:id', authorize(['admin']), departmentController.updateDepartment);

// DELETE: Xóa khoa (chỉ admin)
router.delete('/:id', authorize(['admin']), departmentController.deleteDepartment);

module.exports = router;
