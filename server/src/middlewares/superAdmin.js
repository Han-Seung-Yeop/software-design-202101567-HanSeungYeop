const Teacher = require('../models/Teacher');

/**
 * super_admin 전용 라우트 보호 미들웨어.
 * authenticate 미들웨어 다음에 사용해야 함 (req.user 필요).
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        error: 'UNAUTHORIZED',
      });
    }

    const teacher = await Teacher.findOne({
      user_id: req.user.userId,
      is_super_admin: true,
    });

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: 'super_admin 권한이 필요합니다.',
        error: 'FORBIDDEN_SUPER_ADMIN',
      });
    }

    req.superAdminTeacher = teacher;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireSuperAdmin };
