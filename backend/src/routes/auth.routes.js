const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/register', authController.register);
router.use(verifyToken);
router.post('/change-password', authController.changePassword);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

module.exports = router; 