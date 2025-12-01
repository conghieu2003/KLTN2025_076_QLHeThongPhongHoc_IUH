const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Tất cả routes đều cần authentication
router.use(verifyToken);

// GET /api/profile - Lấy thông tin profile của user hiện tại
router.get('/', profileController.getProfile);

// GET /api/profile/:userId - Lấy thông tin profile của user khác (admin only)
router.get('/:userId', profileController.getProfileById);

// PUT /api/profile/personal - Cập nhật thông tin cá nhân
router.put('/personal', profileController.updatePersonalProfile);

// PUT /api/profile/family - Cập nhật thông tin gia đình
router.put('/family', profileController.updateFamilyInfo);

// PUT /api/profile/academic - Cập nhật thông tin học vấn
router.put('/academic', profileController.updateAcademicProfile);

module.exports = router;
