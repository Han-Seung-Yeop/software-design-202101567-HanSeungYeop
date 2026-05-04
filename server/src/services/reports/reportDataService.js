const Grade = require('../../models/Grade');
const Counseling = require('../../models/Counseling');
const Feedback = require('../../models/Feedback');
const Student = require('../../models/Student');

const getStudentInfo = async (studentId) => {
  const student = await Student.findById(studentId)
    .populate({ path: 'user_id', select: 'name' });
  if (!student) return null;
  return {
    id: student._id,
    name: student.user_id?.name || '학생',
    grade_year: student.grade_year,
    class_num: student.class_num,
    student_num: student.student_num,
  };
};

const getGradeReport = async ({ studentId, year }) => {
  const student = await getStudentInfo(studentId);
  if (!student) return null;

  const query = { student_id: studentId };
  if (year) query.year = Number(year);

  const grades = await Grade.find(query)
    .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
    .sort({ year: 1, semester: 1, subject_name: 1 });

  const rows = grades.map((g) => ({
    year: g.year,
    semester: g.semester,
    subject_name: g.subject_name,
    score: g.score,
    grade_level: g.grade_level,
    teacher_name: g.teacher_id?.user_id?.name || '-',
  }));

  const summaryMap = new Map();
  for (const r of rows) {
    const key = `${r.year}-${r.semester}`;
    const bucket = summaryMap.get(key) || { year: r.year, semester: r.semester, scores: [] };
    bucket.scores.push(r.score);
    summaryMap.set(key, bucket);
  }

  const summary = Array.from(summaryMap.values()).map((b) => ({
    year: b.year,
    semester: b.semester,
    subject_count: b.scores.length,
    total_score: b.scores.reduce((a, b) => a + b, 0),
    average: Number((b.scores.reduce((a, b) => a + b, 0) / b.scores.length).toFixed(2)),
  }));

  return {
    student,
    filter: { year: year ? Number(year) : null },
    rows,
    summary,
    generated_at: new Date(),
  };
};

const getCounselingReport = async ({ studentId, from, to }) => {
  const student = await getStudentInfo(studentId);
  if (!student) return null;

  const query = { student_id: studentId };
  if (from || to) {
    query.counseling_date = {};
    if (from) query.counseling_date.$gte = new Date(from);
    if (to) query.counseling_date.$lte = new Date(to);
  }

  const counselings = await Counseling.find(query)
    .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
    .sort({ counseling_date: -1 });

  const rows = counselings.map((c) => ({
    counseling_date: c.counseling_date,
    teacher_name: c.teacher_id?.user_id?.name || '-',
    main_content: c.main_content,
    next_plan: c.next_plan || '',
    is_shared: c.is_shared,
    shared_with_parent: c.shared_with_parent,
  }));

  return {
    student,
    filter: { from: from || null, to: to || null },
    rows,
    total: rows.length,
    generated_at: new Date(),
  };
};

const getFeedbackReport = async ({ studentId, category }) => {
  const student = await getStudentInfo(studentId);
  if (!student) return null;

  const query = { student_id: studentId };
  if (category) query.category = category;

  const feedbacks = await Feedback.find(query)
    .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
    .sort({ created_at: -1 });

  const rows = feedbacks.map((f) => ({
    created_at: f.created_at,
    category: f.category,
    teacher_name: f.teacher_id?.user_id?.name || '-',
    content: f.content,
    shared_with_parent: f.shared_with_parent,
    shared_with_student: f.shared_with_student,
  }));

  const grouped = rows.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  return {
    student,
    filter: { category: category || null },
    rows,
    grouped,
    total: rows.length,
    generated_at: new Date(),
  };
};

module.exports = {
  getGradeReport,
  getCounselingReport,
  getFeedbackReport,
};
