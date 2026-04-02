const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/feedbacks
router.get('/', authenticate, accessControl('feedbacks', 'read'), feedbackController.list);

// POST /api/feedbacks
router.post('/', authenticate, accessControl('feedbacks', 'create'), feedbackController.create);

// PATCH /api/feedbacks/:id/share
router.patch('/:id/share', authenticate, accessControl('feedbacks', 'update'), feedbackController.shareToggle);

// PUT /api/feedbacks/:id
router.put('/:id', authenticate, accessControl('feedbacks', 'update'), feedbackController.update);

// PATCH /api/feedbacks/:id
router.patch('/:id', authenticate, accessControl('feedbacks', 'update'), feedbackController.update);

// DELETE /api/feedbacks/:id
router.delete('/:id', authenticate, accessControl('feedbacks', 'delete'), feedbackController.remove);

module.exports = router;
