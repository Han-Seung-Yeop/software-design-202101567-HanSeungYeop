const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
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

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다.',
        error: 'VALIDATION_ERROR',
        details: errors.array(),
      });
    }

    const { login_id, password, name, role, department, position, grade_year, class_num, student_num, phone, child_name, child_grade_year, child_class_num, child_num } = req.body;

    // Check if login_id already exists
    const existingUser = await User.findOne({ login_id });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 로그인 아이디입니다.',
        error: 'DUPLICATE_LOGIN_ID',
      });
    }

    // For parent role, resolve child student BEFORE creating any records
    let linkedStudent = null;
    if (role === 'parent') {
      const anyChildField = child_name || child_grade_year || child_class_num || child_num;
      if (anyChildField) {
        if (!child_name || !child_grade_year || !child_class_num || !child_num) {
          return res.status(400).json({
            success: false,
            message: '자녀 정보를 모두 입력해주세요. (이름, 학년, 반, 번호)',
            error: 'INCOMPLETE_CHILD_INFO',
          });
        }
        const candidate = await Student.findOne({
          grade_year: Number(child_grade_year),
          class_num: Number(child_class_num),
          student_num: Number(child_num),
        }).populate('user_id', 'name');
        if (!candidate || candidate.user_id?.name !== child_name) {
          return res.status(404).json({
            success: false,
            message: '입력하신 자녀 정보와 일치하는 학생을 찾을 수 없습니다.',
            error: 'CHILD_NOT_FOUND',
          });
        }
        linkedStudent = candidate;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      login_id,
      password: hashedPassword,
      name,
      role,
    });

    let profile = null;

    if (role === 'teacher') {
      profile = await Teacher.create({
        user_id: user._id,
        department: department || '미지정',
        position: position || '',
        grade_year: grade_year || undefined,
        class_num: class_num || undefined,
      });
    } else if (role === 'student') {
      profile = await Student.create({
        user_id: user._id,
        grade_year: grade_year || 1,
        class_num: class_num || 1,
        student_num: student_num || 1,
        parent_ids: [],
      });
    } else if (role === 'parent') {
      profile = await Parent.create({
        user_id: user._id,
        phone: phone || '',
        student_ids: linkedStudent ? [linkedStudent._id] : [],
      });

      if (linkedStudent) {
        if (!linkedStudent.parent_ids.includes(profile._id)) {
          linkedStudent.parent_ids.push(profile._id);
          await linkedStudent.save();
        }
      }
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      data: { user: userResponse, profile },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      return res.status(400).json({
        success: false,
        message: '로그인 아이디와 비밀번호를 입력해주세요.',
        error: 'MISSING_CREDENTIALS',
      });
    }

    const user = await User.findOne({ login_id });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    let profile = null;
    if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user_id: user._id });
    } else if (user.role === 'student') {
      profile = await Student.findOne({ user_id: user._id });
    } else if (user.role === 'parent') {
      profile = await Parent.findOne({ user_id: user._id });
    }

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
        },
        profile,
      },
    });
  } catch (error) {
    next(error);
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

    return res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
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

    return res.status(200).json({
      success: true,
      data: { user, profile },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, me };
