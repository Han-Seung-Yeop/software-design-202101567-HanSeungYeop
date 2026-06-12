const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');

/**
 * 챗봇 전용 권한 미들웨어.
 * authenticate 이후 실행. req.user에 name과 역할별 컨텍스트를 추가.
 *
 * - teacher:  accessFilter._id.$in (담당 학급 학생 ID 목록)
 * - student:  studentId (본인 student._id)
 * - parent:   children [{ studentId, name }] 목록
 */
const chatAccess = async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    const user = await User.findById(userId).select('name');
    if (!user) {
      return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.', error: 'USER_NOT_FOUND' });
    }
    req.user.name = user.name;

    if (role === 'teacher') {
      const teacher = await Teacher.findOne({ user_id: userId });
      if (teacher && teacher.grade_year && teacher.class_num) {
        const classStudents = await Student.find({
          grade_year: teacher.grade_year,
          class_num: teacher.class_num,
        }).select('_id');
        req.user.accessFilter = { _id: { $in: classStudents.map((s) => s._id) } };
      } else {
        req.user.accessFilter = {};
      }
    }

    if (role === 'student') {
      const student = await Student.findOne({ user_id: userId }).select('_id');
      if (student) req.user.studentId = student._id.toString();
    }

    if (role === 'parent') {
      const parent = await Parent.findOne({ user_id: userId }).select('student_ids');
      if (parent && parent.student_ids.length) {
        const children = await Student.find({ _id: { $in: parent.student_ids } })
          .select('_id name');
        req.user.children = children.map((c) => ({
          studentId: c._id.toString(),
          name: c.name || '자녀',
        }));
      } else {
        req.user.children = [];
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = chatAccess;
