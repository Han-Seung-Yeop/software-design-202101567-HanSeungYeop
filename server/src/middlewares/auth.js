const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.',
        error: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.',
        error: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
      error: 'INVALID_TOKEN',
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        error: 'UNAUTHORIZED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
        error: 'FORBIDDEN',
      });
    }

    next();
  };
};

module.exports = { authenticate, requireRole };
