const Student = require('../models/Student');
const Parent = require('../models/Parent');
const User = require('../models/User');
const ParentInvitation = require('../models/ParentInvitation');
const inviteService = require('../services/parentInviteService');
const authController = require('./authController');

/**
 * 학생 본인이 학부모 연결 코드 발급.
 * 24시간 유효, 1회용. 기존 미사용 코드는 무효화.
 */
const issueCode = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: '학생만 학부모 연결 코드를 발급할 수 있습니다.',
        error: 'STUDENT_ONLY',
      });
    }

    const student = await Student.findOne({ user_id: req.user.userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '학생 정보를 찾을 수 없습니다.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    const invitation = await inviteService.issueInvitationForStudent(student._id);
    return res.status(201).json({
      success: true,
      data: {
        code: invitation.code,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * OAuth 로그인 후 role이 비어있는 사용자가 자녀 코드를 입력해서 Parent로 활성화.
 */
const linkParent = async (req, res, next) => {
  try {
    const { code, name } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '코드를 입력해주세요.',
        error: 'MISSING_CODE',
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
        error: 'USER_NOT_FOUND',
      });
    }

    if (user.role) {
      return res.status(400).json({
        success: false,
        message: '이미 다른 역할로 활성화된 계정입니다.',
        error: 'ROLE_ALREADY_ASSIGNED',
      });
    }

    const result = await inviteService.validateInvitation(code);
    if (!result.ok) {
      const messages = {
        NOT_FOUND: '유효하지 않은 코드입니다.',
        ALREADY_USED: '이미 사용된 코드입니다.',
        EXPIRED: '만료된 코드입니다. 자녀에게 새 코드를 요청해주세요.',
      };
      return res.status(400).json({
        success: false,
        message: messages[result.reason] || '코드 확인 실패',
        error: result.reason,
      });
    }

    const invitation = result.invitation;
    const student = await Student.findById(invitation.student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '코드와 연결된 학생을 찾을 수 없습니다.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    // 학생 1명당 최대 2명의 학부모 제한
    const MAX_PARENTS_PER_STUDENT = 2;
    if ((student.parent_ids?.length || 0) >= MAX_PARENTS_PER_STUDENT) {
      return res.status(400).json({
        success: false,
        message: `학생 1명당 최대 ${MAX_PARENTS_PER_STUDENT}명의 학부모까지만 연결 가능합니다.`,
        error: 'MAX_PARENTS_REACHED',
      });
    }

    // Parent record 생성
    const parent = await Parent.create({
      user_id: user._id,
      email: user.email,
      name: (name && name.trim()) ? name.trim() : user.name,
      student_ids: [student._id],
    });

    // Student.parent_ids 업데이트
    await Student.updateOne(
      { _id: student._id },
      { $addToSet: { parent_ids: parent._id } }
    );

    // User.role 설정
    user.role = 'parent';
    await user.save();

    // 코드 사용 처리 (1회용)
    invitation.used_at = new Date();
    invitation.used_by_user_id = user._id;
    await invitation.save();

    // 새 토큰 발급 (role 포함)
    const accessToken = authController.generateAccessToken(user._id, 'parent');
    const refreshToken = authController.generateRefreshToken(user._id, 'parent');

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        student: {
          name: student.name,
          grade_year: student.grade_year,
          class_num: student.class_num,
          student_num: student.student_num,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { issueCode, linkParent };
