const FactStudentTerm = require('../../../models/analytics/FactStudentTerm');

const definition = {
  name: 'getClassGradeDistribution',
  description: '특정 학급의 학기별 성적 분포 (평균, 최고/최저, 학생별 성적 목록)를 반환합니다. 교사만 사용 가능.',
  parameters: {
    type: 'object',
    properties: {
      gradeYear: {
        description: '학년 (예: 3)',
      },
      classNum: {
        description: '반 번호 (예: 1)',
      },
      year: {
        description: '학년도 (예: 2026)',
      },
      semester: {
        description: '학기 (1 또는 2)',
      },
    },
    required: ['gradeYear', 'classNum', 'year', 'semester'],
  },
};

const execute = async ({ gradeYear, classNum, year, semester }, reqUser) => {
  if (reqUser.role !== 'teacher') {
    return { error: '교사만 사용 가능한 기능입니다.' };
  }

  const gy = Number(gradeYear);
  const cn = Number(classNum);
  const y  = Number(year);
  const s  = Number(semester);

  const students = await FactStudentTerm.find({
    grade_year: gy,
    class_num: cn,
    year: y,
    semester: s,
  }).sort({ average: -1 });

  if (!students.length) {
    return { found: false, message: `${gy}학년 ${cn}반 ${y}년 ${s}학기 데이터가 없습니다.` };
  }

  const averages = students.map((s) => s.average).filter((a) => a > 0);
  const classAvg = averages.length
    ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10
    : 0;

  return {
    found: true,
    gradeYear,
    classNum,
    year,
    semester,
    totalStudents: students.length,
    classAverage: classAvg,
    highest: { name: students[0].student_name, average: students[0].average },
    lowest: { name: students[students.length - 1].student_name, average: students[students.length - 1].average },
    students: students.map((s) => ({
      name: s.student_name,
      studentNum: s.student_num,
      average: s.average,
      highestSubject: s.highest_subject,
      lowestSubject: s.lowest_subject,
    })),
  };
};

module.exports = { definition, execute };
