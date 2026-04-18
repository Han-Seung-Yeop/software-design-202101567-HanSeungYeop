const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('login_id').notEmpty().withMessage('로그인 아이디를 입력해주세요.'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 6자 이상이어야 합니다.'),
    body('name').notEmpty().withMessage('이름을 입력해주세요.'),
    body('role').isIn(['teacher', 'student', 'parent']).withMessage('유효한 역할을 선택해주세요.'),
  ],
  authController.register
);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

module.exports = router;
