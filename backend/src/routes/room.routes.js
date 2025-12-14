const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.get('/', roomController.getAllRooms);
router.get('/filter', roomController.getRoomsByDepartmentAndType);
router.get('/types', roomController.getClassRoomTypes);
router.get('/request-types', roomController.getRequestTypes);
router.get('/request-statuses', roomController.getRequestStatuses);
router.get('/time-slots', roomController.getTimeSlots);
router.get('/teacher/:teacherId/schedules', roomController.getTeacherSchedules);
router.get('/schedule/:scheduleId', roomController.getClassScheduleById);
router.get('/schedules/by-time-slot', roomController.getSchedulesByTimeSlotAndDate);
router.get('/available-for-exception', roomController.getAvailableRoomsForException);

router.use(verifyToken);

router.get('/:roomId', authorize(['admin', 'teacher', 'student', 'maintenance']), roomController.getRoomById);
router.get('/:roomId/details', authorize(['admin', 'teacher', 'student', 'maintenance']), roomController.getRoomDetails);
router.post('/', authorize(['admin', 'maintenance']), roomController.createRoom);
router.put('/:roomId', authorize(['admin', 'maintenance']), roomController.updateRoom);
router.delete('/:roomId', authorize(['admin']), roomController.deleteRoom);

module.exports = router;