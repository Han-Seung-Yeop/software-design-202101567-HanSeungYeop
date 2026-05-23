const FactStudentTerm = require('../../../models/analytics/FactStudentTerm');
const Student = require('../../../models/Student');
const Parent = require('../../../models/Parent');

const definition = {
  name: 'getStudentTermGradeSummary',
  description: '학생의 특정 학기 종합 성적 요약을 반환합니다 (평균, 최고/최저 과목, 등급 등). year/semester 중 하나라도 없으면 가장 최근 학기를 조회합니다.',
  parameters: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        description: '학생 ID (findStudent로 먼저 조회)',
      },
      year: {
        description: '학년도 (예: 2026)',
      },
      semester: {
        description: '학기 (1 또는 2)',
      },
    },
    required: ['studentId'],
  },
};

const execute = async ({ studentId, year, semester }, reqUser) => {
  if (!(await canView(reqUser, studentId))) {
    return { error: '해당 학생 데이터에 접근 권한이 없습니다.' };
  }

  const y = year ? Number(year) : null;
  const s = semester ? Number(semester) : null;
  let filter = { student_id: studentId };
  if (y) filter.year = y;
  if (s) filter.semester = s;

  let term;
  if (y && s) {
    term = await FactStudentTerm.findOne(filter);
  } else {
    // 가장 최근 학기
    term = await FactStudentTerm.findOne(filter).sort({ year: -1, semester: -1 });
  }

  if (!term) {
    return { found: false, message: '해당 학기 성적 데이터가 없습니다.' };
  }

  return {
    found: true,
    studentName: term.student_name,
    gradeYear: term.grade_year,
    classNum: term.class_num,
    year: term.year,
    semester: term.semester,
    average: term.average,
    totalScore: term.total_score,
    subjectCount: term.subject_count,
    highestSubject: term.highest_subject,
    highestScore: term.highest_score,
    lowestSubject: term.lowest_subject,
    lowestScore: term.lowest_score,
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
