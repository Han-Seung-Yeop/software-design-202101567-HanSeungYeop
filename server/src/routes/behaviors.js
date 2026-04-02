const express = require('express');
const router = express.Router();
const behaviorController = require('../controllers/behaviorController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/behaviors
router.get('/', authenticate, accessControl('behaviors', 'read'), behaviorController.list);

// POST /api/behaviors
router.post('/', authenticate, accessControl('behaviors', 'create'), behaviorController.create);

// PUT /api/behaviors/:id
router.put('/:id', authenticate, accessControl('behaviors', 'update'), behaviorController.update);

// PATCH /api/behaviors/:id
router.patch('/:id', authenticate, accessControl('behaviors', 'update'), behaviorController.update);

// DELETE /api/behaviors/:id
router.delete('/:id', authenticate, accessControl('behaviors', 'delete'), behaviorController.remove);

module.exports = router;
