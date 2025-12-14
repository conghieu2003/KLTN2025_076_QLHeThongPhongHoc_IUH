const express = require('express');
const router = express.Router();
const roomIssueController = require('../controllers/roomIssue.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Protected routes
router.use(verifyToken);

// Room Issue routes
router.get('/', authorize(['admin', 'teacher', 'maintenance']), roomIssueController.getAllRoomIssues);
router.get('/maintenance-users', authorize(['admin']), roomIssueController.getMaintenanceUsers);
router.get('/:issueId', authorize(['admin', 'teacher', 'maintenance']), roomIssueController.getRoomIssueById);
router.post('/', authorize(['admin', 'teacher']), roomIssueController.createRoomIssue);
router.put('/:issueId', authorize(['admin', 'maintenance']), roomIssueController.updateRoomIssue);
router.post('/:issueId/accept', authorize(['admin', 'maintenance']), roomIssueController.acceptRoomIssue);
router.post('/:issueId/assign', authorize(['admin']), roomIssueController.assignRoomIssue);
router.delete('/:issueId', authorize(['admin']), roomIssueController.deleteRoomIssue);

module.exports = router;

