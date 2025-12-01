const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

// Routes cho lịch học
router.get('/schedules', scheduleController.getSchedules);
router.get('/schedules/weekly', scheduleController.getWeeklySchedule);
router.get('/schedules/print', scheduleController.printSchedule);
router.post('/schedules', scheduleController.createSchedule);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);

// Routes cho dữ liệu filter
router.get('/departments', scheduleController.getDepartments);
router.get('/classes', scheduleController.getClasses);
router.get('/teachers', scheduleController.getTeachers);

module.exports = router;