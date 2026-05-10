const Teacher = require('../models/Teacher');

/**
 * super_admin이 새 교사를 사전 등록.
 * 미들웨어로 requireSuperAdmin 통과 후 호출됨.
 */
const createTeacher = async (req, res, next) => {
  try {
    const { email, name, department, position, grade_year, class_num } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: '이메일과 이름은 필수입니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await Teacher.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: '이미 등록된 이메일입니다.',
        error: 'DUPLICATE_TEACHER_EMAIL',
      });
    }

    const teacher = await Teacher.create({
      email: normalizedEmail,
      name,
      department: department || '미지정',
      position: position || '',
      grade_year: grade_year || undefined,
      class_num: class_num || undefined,
      is_super_admin: false,
      invited_by: req.superAdminTeacher._id,
    });

    return res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

const listTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find()
      .populate({ path: 'user_id', select: 'name email role is_active' })
      .sort({ is_super_admin: -1, invited_at: -1 });
    return res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

const removeTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '교사를 찾을 수 없습니다.',
        error: 'TEACHER_NOT_FOUND',
      });
    }
    if (teacher.is_super_admin) {
      return res.status(400).json({
        success: false,
        message: 'super_admin은 삭제할 수 없습니다.',
        error: 'CANNOT_DELETE_SUPER_ADMIN',
      });
    }
    if (teacher.user_id) {
      return res.status(400).json({
        success: false,
        message: '이미 활성화된 교사는 삭제할 수 없습니다. (사전 등록 상태에서만 가능)',
        error: 'CANNOT_DELETE_ACTIVE_TEACHER',
      });
    }
    await teacher.deleteOne();
    return res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTeacher, listTeachers, removeTeacher };
