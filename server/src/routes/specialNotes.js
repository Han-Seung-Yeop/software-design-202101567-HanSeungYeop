const express = require('express');
const router = express.Router();
const specialNoteController = require('../controllers/specialNoteController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/special-notes
router.get('/', authenticate, accessControl('special_notes', 'read'), specialNoteController.list);

// POST /api/special-notes
router.post('/', authenticate, accessControl('special_notes', 'create'), specialNoteController.create);

// PUT /api/special-notes/:id
router.put('/:id', authenticate, accessControl('special_notes', 'update'), specialNoteController.update);

// PATCH /api/special-notes/:id
router.patch('/:id', authenticate, accessControl('special_notes', 'update'), specialNoteController.update);

// DELETE /api/special-notes/:id
router.delete('/:id', authenticate, accessControl('special_notes', 'delete'), specialNoteController.remove);

module.exports = router;
