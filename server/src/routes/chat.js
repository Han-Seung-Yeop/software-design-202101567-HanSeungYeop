const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/auth');
const chatAccess = require('../middlewares/chatAccess');

router.post('/stream', authenticate, chatAccess, chatController.stream);
router.get('/children', authenticate, chatAccess, chatController.getChildren);

module.exports = router;
