const express = require('express');
const router = express.Router();
const scheduleExceptionController = require('../controllers/scheduleException.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.verifyToken);

router.post('/', scheduleExceptionController.createScheduleException);

router.get('/', scheduleExceptionController.getScheduleExceptions);

router.get('/:id', scheduleExceptionController.getScheduleExceptionById);

router.put('/:id', scheduleExceptionController.updateScheduleException);

router.delete('/:id', scheduleExceptionController.deleteScheduleException);

router.get('/available/schedules', scheduleExceptionController.getAvailableSchedules);

module.exports = router;
