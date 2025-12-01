const express = require('express');
const router = express.Router();
const scheduleRequestController = require('../controllers/scheduleRequest.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create a new schedule request
router.post('/', scheduleRequestController.createScheduleRequest);

// Get all schedule requests (with optional filters)
router.get('/', scheduleRequestController.getScheduleRequests);

// Get schedule requests for a specific teacher
router.get('/teacher/:teacherId', scheduleRequestController.getTeacherSchedules);

// Get a specific schedule request by ID
router.get('/:requestId', scheduleRequestController.getScheduleRequestById);

// Update schedule request status (approve/reject)
router.put('/:requestId/status', scheduleRequestController.updateScheduleRequestStatus);

// Update schedule request room (admin only)
router.put('/:requestId/room', scheduleRequestController.updateScheduleRequestRoom);

module.exports = router;
