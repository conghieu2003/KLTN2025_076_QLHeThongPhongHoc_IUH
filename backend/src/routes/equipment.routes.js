const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Public routes
router.get('/', equipmentController.getAllEquipment);
router.get('/:equipmentId', equipmentController.getEquipmentById);

// Protected routes
router.use(verifyToken);

// Equipment CRUD (admin only)
router.post('/', authorize(['admin']), equipmentController.createEquipment);
router.put('/:equipmentId', authorize(['admin']), equipmentController.updateEquipment);
router.delete('/:equipmentId', authorize(['admin']), equipmentController.deleteEquipment);

// Room Equipment (admin, maintenance)
router.get('/room/:roomId', authorize(['admin', 'teacher', 'maintenance']), equipmentController.getRoomEquipment);
router.post('/room/:roomId', authorize(['admin', 'maintenance']), equipmentController.addRoomEquipment);
router.put('/room-equipment/:roomEquipmentId', authorize(['admin', 'maintenance']), equipmentController.updateRoomEquipment);
router.delete('/room-equipment/:roomEquipmentId', authorize(['admin', 'maintenance']), equipmentController.removeRoomEquipment);

module.exports = router;

