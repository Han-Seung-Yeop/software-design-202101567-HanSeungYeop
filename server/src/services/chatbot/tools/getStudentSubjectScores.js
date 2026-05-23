const FactStudentSubjectTerm = require('../../../models/analytics/FactStudentSubjectTerm');
const Student = require('../../../models/Student');
const Parent = require('../../../models/Parent');

const definition = {
  name: 'getStudentSubjectScores',
  description: '학생의 과목별 성적 목록을 반환합니다. 여러 학기를 조회하면 추세 파악이 가능합니다.',
  parameters: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        description: '학생 ID',
      },
      year: {
        description: '학년도 필터 (선택, 예: 2026)',
      },
      semester: {
        description: '학기 필터 (선택, 1 또는 2)',
      },
      subject: {
        type: 'string',
        description: '특정 과목만 필터 (선택, 예: "수학")',
      },
    },
    required: ['studentId'],
  },
};

const execute = async ({ studentId, year, semester, subject }, reqUser) => {
  if (!(await canView(reqUser, studentId))) {
    return { error: '해당 학생 데이터에 접근 권한이 없습니다.' };
  }

  const filter = { student_id: studentId };
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject_name = { $regex: subject, $options: 'i' };

  const subjects = await FactStudentSubjectTerm.find(filter)
    .sort({ year: 1, semester: 1, subject_name: 1 });

  if (!subjects.length) {
    return { found: false, message: '해당 조건의 성적 데이터가 없습니다.' };
  }

  return {
    found: true,
    studentName: subjects[0].student_name,
    count: subjects.length,
    subjects: subjects.map((s) => ({
      subject: s.subject_name,
      year: s.year,
      semester: s.semester,
      score: s.score,
      gradeLevel: s.grade_level,
    })),
  };
};

const canView = async (reqUser, studentId) => {
  const { userId, role } = reqUser;
  if (role === 'teacher') {
    const allowed = reqUser.accessFilter?._id?.$in;
    if (!allowed) return true;
    return allowed.some((id) => id.toString() === String(studentId));
  }
  if (role === 'student') {
    const student = await Student.findOne({ user_id: userId });
    return student && student._id.toString() === String(studentId);
  }
  if (role === 'parent') {
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) return false;
    return parent.student_ids.some((sid) => sid.toString() === String(studentId));
  }
  return false;
};

module.exports = { definition, execute };
