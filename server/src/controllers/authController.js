const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const buildRedirect = (path, params = {}) => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  const qs = new URLSearchParams(params).toString();
  return `${base}${path}${qs ? `?${qs}` : ''}`;
};

/**
 * Google OAuth 콜백 핸들러.
 * Passport가 req.user에 OAuth 프로필을 주입한 상태로 호출됨.
 *
 * 매칭 우선순위:
 * 1. provider+provider_id로 이미 활성화된 User → 정상 로그인
 * 2. Teacher 사전 등록(email 매칭, user_id 없음) → 교사 활성화
 * 3. Student 사전 등록(email 매칭, user_id 없음) → 학생 활성화
 * 4. 매칭 없음 → User만 임시 생성, 학부모 코드 입력 페이지로 redirect
 */
const oauthCallback = async (req, res, next) => {
  try {
    const { provider, provider_id, email, email_verified, name } = req.user || {};

    if (!email) {
      return res.redirect(buildRedirect('/oauth/error', { reason: 'email_required' }));
    }
    if (!email_verified) {
      return res.redirect(buildRedirect('/oauth/error', { reason: 'email_not_verified' }));
    }

    // 1. 이미 활성화된 User?
    let user = await User.findOne({ provider, provider_id });
    if (user) {
      const at = generateAccessToken(user._id, user.role);
      const rt = generateRefreshToken(user._id, user.role);
      return res.redirect(buildRedirect('/oauth/success', { at, rt, next: 'dashboard' }));
    }

    // 2. Teacher 사전 등록 매칭?
    const teacher = await Teacher.findOne({ email, user_id: null });
    if (teacher) {
      user = await User.create({
        email,
        provider,
        provider_id,
        name,
        role: 'teacher',
      });
      teacher.user_id = user._id;
      teacher.activated_at = new Date();
      await teacher.save();
      const at = generateAccessToken(user._id, 'teacher');
      const rt = generateRefreshToken(user._id, 'teacher');
      return res.redirect(buildRedirect('/oauth/success', { at, rt, next: 'dashboard' }));
    }

    // 3. Student 사전 등록 매칭?
    const student = await Student.findOne({ email, user_id: null });
    if (student) {
      user = await User.create({
        email,
        provider,
        provider_id,
        name,
        role: 'student',
      });
      student.user_id = user._id;
      student.activated_at = new Date();
      await student.save();
      const at = generateAccessToken(user._id, 'student');
      const rt = generateRefreshToken(user._id, 'student');
      return res.redirect(buildRedirect('/oauth/success', { at, rt, next: 'dashboard' }));
    }

    // 4. 매칭 없음 → 학부모 가능성, 코드 입력 페이지로
    user = await User.create({
      email,
      provider,
      provider_id,
      name,
      role: undefined,
    });
    const at = generateAccessToken(user._id, null);
    const rt = generateRefreshToken(user._id, null);
    return res.redirect(buildRedirect('/oauth/parent-link', { at, rt }));
  } catch (error) {
    console.error('[oauthCallback] error:', error);
    return res.redirect(buildRedirect('/oauth/error', { reason: 'server_error' }));
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '리프레시 토큰이 필요합니다.',
        error: 'MISSING_REFRESH_TOKEN',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않거나 만료된 리프레시 토큰입니다.',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
        error: 'USER_NOT_FOUND',
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    return res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
        error: 'USER_NOT_FOUND',
      });
    }

    let profile = null;
    if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user_id: user._id });
    } else if (user.role === 'student') {
      profile = await Student.findOne({ user_id: user._id }).populate('parent_ids');
    } else if (user.role === 'parent') {
      profile = await Parent.findOne({ user_id: user._id }).populate({
        path: 'student_ids',
        populate: { path: 'user_id', select: 'name' },
      });
    }

    return res.status(200).json({ success: true, data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  // 자체 JWT 방식이라 서버 측 세션은 없음.
  // 클라이언트가 localStorage의 토큰을 삭제하면 끝.
  return res.status(200).json({ success: true });
};

module.exports = {
  oauthCallback,
  refresh,
  me,
  logout,
  generateAccessToken,
  generateRefreshToken,
};
