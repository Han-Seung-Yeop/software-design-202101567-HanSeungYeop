const Student = require('../../../models/Student');

// Gemini에 등록할 tool 스펙
const definition = {
  name: 'findStudent',
  description: '학생 이름으로 학생을 검색합니다. 교사만 사용 가능. 동명이인이 있으면 여러 명을 반환합니다.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '검색할 학생 이름 (예: "김철수")',
      },
      gradeYear: {
        description: '학년 필터 (선택, 예: 3)',
      },
      classNum: {
        description: '반 필터 (선택, 예: 1)',
      },
    },
    required: ['name'],
  },
};

// 실제 실행 함수
const execute = async ({ name, gradeYear, classNum }, reqUser) => {
  if (reqUser.role !== 'teacher') {
    return { error: '교사만 사용 가능한 기능입니다.' };
  }

  // Student.name 필드에서 직접 검색
  const cleanName = name.replace(/\s+/g, '');
  const studentFilter = { name: { $regex: cleanName, $options: 'i' } };
  if (gradeYear) studentFilter.grade_year = Number(gradeYear);
  if (classNum) studentFilter.class_num = Number(classNum);

  // 교사 담당 학급 범위 필터 (accessFilter)
  const allowed = reqUser.accessFilter?._id?.$in;
  if (allowed) studentFilter._id = { $in: allowed };

  const students = await Student.find(studentFilter)
    .select('_id grade_year class_num student_num name');

  if (!students.length) {
    return { found: false, message: `'${name}' 이름의 학생을 찾을 수 없습니다.` };
  }

  return {
    found: true,
    count: students.length,
    students: students.map((s) => ({
      studentId: s._id.toString(),
      name: s.name,
      gradeYear: s.grade_year,
      classNum: s.class_num,
      studentNum: s.student_num,
    })),
  };
};

module.exports = { definition, execute };
