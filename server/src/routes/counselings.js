const express = require('express');
const router = express.Router();
const counselingController = require('../controllers/counselingController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// GET /api/counselings/search
router.get('/search', authenticate, accessControl('counselings', 'read'), counselingController.search);

// GET /api/counselings
router.get('/', authenticate, accessControl('counselings', 'read'), counselingController.list);

// POST /api/counselings
router.post('/', authenticate, accessControl('counselings', 'create'), counselingController.create);

// PATCH /api/counselings/:id/share
router.patch('/:id/share', authenticate, accessControl('counselings', 'update'), counselingController.shareTeacher);

// PATCH /api/counselings/:id/share-parent
router.patch('/:id/share-parent', authenticate, accessControl('counselings', 'update'), counselingController.shareParent);

// PUT /api/counselings/:id
router.put('/:id', authenticate, accessControl('counselings', 'update'), counselingController.update);

// PATCH /api/counselings/:id
router.patch('/:id', authenticate, accessControl('counselings', 'update'), counselingController.update);

// DELETE /api/counselings/:id
router.delete('/:id', authenticate, accessControl('counselings', 'delete'), counselingController.remove);

module.exports = router;
