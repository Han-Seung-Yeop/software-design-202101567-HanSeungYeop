const rateLimit = require('express-rate-limit');

// 학부모 코드 입력 — brute force 방어 (1분에 5번)
const parentLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '너무 많은 시도입니다. 1분 후 다시 시도해주세요.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

// OAuth 콜백 — 1분에 30번 (정상 트래픽 여유 + abuse 차단)
const oauthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'OAuth 시도가 너무 많습니다.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

// 전체 API — DDoS 완화 (15분에 1000번)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = { parentLinkLimiter, oauthLimiter, generalLimiter };
