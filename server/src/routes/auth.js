const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const parentInvitationController = require('../controllers/parentInvitationController');
const { authenticate } = require('../middlewares/auth');
const { requireSuperAdmin } = require('../middlewares/superAdmin');
const { parentLinkLimiter, oauthLimiter } = require('../middlewares/rateLimit');
const User = require('../models/User');

// Google OAuth 시작
router.get(
  '/google',
  oauthLimiter,
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false,
    prompt: 'select_account',
  })
);

// Google OAuth 콜백
router.get(
  '/google/callback',
  oauthLimiter,
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth/error?reason=auth_failed`,
  }),
  authController.oauthCallback
);

// 토큰 갱신
router.post('/refresh', authController.refresh);

// 학부모 자녀 연결 코드 입력 (OAuth 후 role 미설정 사용자만)
// brute force 방지: 1분에 5번까지
router.post('/parent-link', parentLinkLimiter, authenticate, parentInvitationController.linkParent);

// 본인 정보
router.get('/me', authenticate, authController.me);

// 로그아웃
router.post('/logout', authController.logout);

// === Impersonate (dev only) ===========================================
// 개발 환경에서만 등록되는 라우트.
// 운영 환경 (NODE_ENV=production)에서는 라우트 자체가 등록되지 않음.
if (
  process.env.NODE_ENV === 'development' &&
  process.env.ALLOW_IMPERSONATE === 'true'
) {
  // 변신 가능한 사용자 목록
  router.get(
    '/impersonate/users',
    authenticate,
    requireSuperAdmin,
    async (req, res, next) => {
      try {
        const users = await User.find({ role: { $exists: true, $ne: null } })
          .select('_id name email role')
          .sort({ role: 1, name: 1 });
        return res.status(200).json({ success: true, data: users });
      } catch (error) {
        next(error);
      }
    }
  );

  // 변신: 대상 사용자의 토큰 발급
  router.post(
    '/impersonate',
    authenticate,
    requireSuperAdmin,
    async (req, res, next) => {
      try {
        const { user_id } = req.body;
        if (!user_id) {
          return res.status(400).json({
            success: false,
            message: 'user_id가 필요합니다.',
            error: 'MISSING_USER_ID',
          });
        }

        const target = await User.findById(user_id);
        if (!target) {
          return res.status(404).json({
            success: false,
            message: '대상 사용자를 찾을 수 없습니다.',
            error: 'USER_NOT_FOUND',
          });
        }

        const accessToken = authController.generateAccessToken(target._id, target.role);
        return res.status(200).json({
          success: true,
          data: {
            accessToken,
            impersonating: {
              user_id: target._id,
              role: target.role,
              name: target.name,
              email: target.email,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // eslint-disable-next-line no-console
  console.log('⚠️  Impersonate routes enabled (DEV ONLY)');
}

module.exports = router;
