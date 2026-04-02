const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/students
router.get('/', authenticate, accessControl('students', 'read'), studentController.list);

// GET /api/students/:id
router.get('/:id', authenticate, accessControl('students', 'read'), studentController.getById);

// PUT /api/students/:id
router.put('/:id', authenticate, accessControl('students', 'update'), studentController.update);

// PATCH /api/students/:id
router.patch('/:id', authenticate, accessControl('students', 'update'), studentController.update);

module.exports = router;
