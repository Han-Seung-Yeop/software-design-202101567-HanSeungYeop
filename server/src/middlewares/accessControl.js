const AccessControl = require('../models/AccessControl');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');

// 교사의 담당 학급 학생 ID 목록을 가져오는 헬퍼
const getClassStudentFilter = async (userId, collectionName) => {
  const teacher = await Teacher.findOne({ user_id: userId });
  if (!teacher) {
    return null;
  }

  if (teacher.grade_year && teacher.class_num) {
    const classStudents = await Student.find({
      grade_year: teacher.grade_year,
      class_num: teacher.class_num,
    }).select('_id');
    const studentIds = classStudents.map(s => s._id);

    if (collectionName === 'students') {
      return { _id: { $in: studentIds } };
    }
    return { student_id: { $in: studentIds } };
  }

  // 담당 학년/반이 없으면 전체 접근
  return {};
};

const accessControl = (collectionName, action) => {
  return async (req, res, next) => {
    try {
      const { userId, role } = req.user;

      // Find access control rule for this role and collection
      const rule = await AccessControl.findOne({
        role,
        collection_name: collectionName,
      });

      if (!rule) {
        return res.status(403).json({
          success: false,
          message: '접근 권한 설정이 없습니다.',
          error: 'ACCESS_RULE_NOT_FOUND',
        });
      }

      // Check if the action is permitted
      if (rule.permissions && rule.permissions[action] === false) {
        return res.status(403).json({
          success: false,
          message: '해당 작업에 대한 권한이 없습니다.',
          error: 'PERMISSION_DENIED',
        });
      }

      const scope = rule.scope;

      // Handle scope
      if (scope === 'none') {
        return res.status(403).json({
          success: false,
          message: '접근이 제한된 리소스입니다.',
          error: 'ACCESS_DENIED',
        });
      }

      if (scope === 'all') {
        // 담임교사는 'all' scope여도 담당 학급으로 제한
        if (role === 'teacher') {
          const filter = await getClassStudentFilter(userId, collectionName);
          req.accessFilter = filter || {};
        } else {
          req.accessFilter = {};
        }
      } else if (scope === 'own') {
        if (role === 'teacher') {
          const teacher = await Teacher.findOne({ user_id: userId });
          if (!teacher) {
            return res.status(404).json({
              success: false,
              message: '교사 정보를 찾을 수 없습니다.',
              error: 'TEACHER_NOT_FOUND',
            });
          }
          req.accessFilter = { teacher_id: teacher._id };
        } else if (role === 'student') {
          const student = await Student.findOne({ user_id: userId });
          if (!student) {
            return res.status(404).json({
              success: false,
              message: '학생 정보를 찾을 수 없습니다.',
              error: 'STUDENT_NOT_FOUND',
            });
          }
          req.accessFilter = { student_id: student._id };
        } else if (role === 'parent') {
          const parent = await Parent.findOne({ user_id: userId });
          if (!parent) {
            return res.status(404).json({
              success: false,
              message: '학부모 정보를 찾을 수 없습니다.',
              error: 'PARENT_NOT_FOUND',
            });
          }
          req.accessFilter = { student_id: { $in: parent.student_ids } };
        }
      } else if (scope === 'class') {
        if (role === 'teacher') {
          const filter = await getClassStudentFilter(userId, collectionName);
          if (filter === null) {
            return res.status(404).json({
              success: false,
              message: '교사 정보를 찾을 수 없습니다.',
              error: 'TEACHER_NOT_FOUND',
            });
          }
          req.accessFilter = filter;
        } else {
          req.accessFilter = {};
        }
      } else {
        req.accessFilter = {};
      }

      // Additional filters for parent accessing sensitive collections
      if (role === 'parent') {
        if (collectionName === 'feedbacks') {
          req.accessFilter = { ...req.accessFilter, shared_with_parent: true };
        } else if (collectionName === 'counselings') {
          req.accessFilter = { ...req.accessFilter, shared_with_parent: true };
        }
      }

      // Additional filters for student accessing sensitive collections
      if (role === 'student') {
        if (collectionName === 'feedbacks') {
          req.accessFilter = { ...req.accessFilter, shared_with_student: true };
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = accessControl;
