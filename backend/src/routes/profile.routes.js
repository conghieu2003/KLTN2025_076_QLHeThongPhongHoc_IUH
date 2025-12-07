const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// GET: Lấy thông tin profile của user hiện tại
router.get('/', profileController.getProfile);

// GET: Lấy thông tin profile của user khác (admin only)
router.get('/:userId', profileController.getProfileById);

// PUT: Cập nhật thông tin cá nhân
router.put('/personal', profileController.updatePersonalProfile);

// PUT: Cập nhật thông tin gia đình
router.put('/family', profileController.updateFamilyInfo);

// PUT: Cập nhật thông tin học vấn
router.put('/academic', profileController.updateAcademicProfile);

module.exports = router;
