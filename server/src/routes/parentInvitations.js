const express = require('express');
const router = express.Router();
const parentInvitationController = require('../controllers/parentInvitationController');
const { authenticate } = require('../middlewares/auth');

// POST /api/parent-invitations — 학생이 자기 학부모용 코드 발급
router.post('/', authenticate, parentInvitationController.issueCode);

module.exports = router;
