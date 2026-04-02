const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/attendances/summary/:studentId
router.get(
  '/summary/:studentId',
  authenticate,
  accessControl('attendances', 'read'),
  attendanceController.summary
);

// GET /api/attendances
router.get('/', authenticate, accessControl('attendances', 'read'), attendanceController.list);

// POST /api/attendances
router.post('/', authenticate, accessControl('attendances', 'create'), attendanceController.create);

// PUT /api/attendances/:id
router.put('/:id', authenticate, accessControl('attendances', 'update'), attendanceController.update);

// PATCH /api/attendances/:id
router.patch('/:id', authenticate, accessControl('attendances', 'update'), attendanceController.update);

// DELETE /api/attendances/:id
router.delete('/:id', authenticate, accessControl('attendances', 'delete'), attendanceController.remove);

module.exports = router;
