const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Routes công khai (không cần xác thực)
router.get('/departments', userController.departments);
router.get('/majors', userController.majors);

// Routes yêu cầu xác thực
router.use(verifyToken);
router.post('/list', authorize(['admin']), userController.list);
router.get('/next-code', authorize(['admin']), userController.nextCode);
router.post('/create', authorize(['admin']), userController.create);
router.put('/:userId', authorize(['admin']), userController.update);
router.post('/send-email', authorize(['admin']), userController.sendEmail);

module.exports = router;


