const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/grades/radar/:studentId
router.get(
  '/radar/:studentId',
  authenticate,
  accessControl('grades', 'read'),
  gradeController.getRadarData
);

// GET /api/grades
router.get('/', authenticate, accessControl('grades', 'read'), gradeController.list);

// POST /api/grades
router.post('/', authenticate, accessControl('grades', 'create'), gradeController.create);

// PUT /api/grades/:id
router.put('/:id', authenticate, accessControl('grades', 'update'), gradeController.update);

// PATCH /api/grades/:id
router.patch('/:id', authenticate, accessControl('grades', 'update'), gradeController.update);

// DELETE /api/grades/:id
router.delete('/:id', authenticate, accessControl('grades', 'delete'), gradeController.remove);

module.exports = router;
