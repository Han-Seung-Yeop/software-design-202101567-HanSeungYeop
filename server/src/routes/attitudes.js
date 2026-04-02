const express = require('express');
const router = express.Router();
const attitudeController = require('../controllers/attitudeController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/attitudes
router.get('/', authenticate, accessControl('attitudes', 'read'), attitudeController.list);

// POST /api/attitudes
router.post('/', authenticate, accessControl('attitudes', 'create'), attitudeController.create);

// PUT /api/attitudes/:id
router.put('/:id', authenticate, accessControl('attitudes', 'update'), attitudeController.update);

// PATCH /api/attitudes/:id
router.patch('/:id', authenticate, accessControl('attitudes', 'update'), attitudeController.update);

// DELETE /api/attitudes/:id
router.delete('/:id', authenticate, accessControl('attitudes', 'delete'), attitudeController.remove);

module.exports = router;
