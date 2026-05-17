const Grade = require('../../models/Grade');
const Attendance = require('../../models/Attendance');
const Feedback = require('../../models/Feedback');
const Counseling = require('../../models/Counseling');
const Student = require('../../models/Student');
const FactStudentSubjectTerm = require('../../models/analytics/FactStudentSubjectTerm');
const FactStudentTerm = require('../../models/analytics/FactStudentTerm');
const FactStudentAttendanceMonthly = require('../../models/analytics/FactStudentAttendanceMonthly');
const FactStudentFeedbackTerm = require('../../models/analytics/FactStudentFeedbackTerm');

/**
 * 출결의 date 필드로부터 학년도/학기 판정.
 * 1학기: 3월~8월
 * 2학기: 9월~다음해 2월
 */
function classifyTerm(date) {
  const d = new Date(date);
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 8) return { year: d.getFullYear(), semester: 1 };
  if (m >= 9 && m <= 12) return { year: d.getFullYear(), semester: 2 };
  return { year: d.getFullYear() - 1, semester: 2 };
}

/**
 * 학생 × 과목 × 학기 단위 Fact 갱신 (idempotent).
 */
async function aggregateStudentSubjectTerm(student_id, subject_name, year, semester) {
  const grades = await Grade.find({ student_id, subject_name, year, semester });
  if (!grades.length) {
    await FactStudentSubjectTerm.deleteOne({ student_id, subject_name, year, semester });
    return null;
  }
  // 중간/기말 여러 건이 있으면 평균
  const avgScore = Number((grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(2));
  const student = await Student.findById(student_id).select('name grade_year class_num student_num');
  return FactStudentSubjectTerm.findOneAndUpdate(
    { student_id, subject_name, year, semester },
    {
      $set: {
        score: avgScore,
        grade_level: grades[0].grade_level,
        student_name: student?.name,
        grade_year: student?.grade_year,
        class_num: student?.class_num,
        student_num: student?.student_num,
        last_aggregated_at: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * 학생 × 학기 종합 Fact 갱신.
 */
async function aggregateStudentTerm(student_id, year, semester) {
  const student = await Student.findById(student_id).select('name grade_year class_num student_num');

  // 1. 성적 집계 — 과목별 평균 후 종합
  const grades = await Grade.find({ student_id, year, semester });
  const subjectMap = {};
  for (const g of grades) {
    if (!subjectMap[g.subject_name]) subjectMap[g.subject_name] = [];
    subjectMap[g.subject_name].push(g.score);
  }
  const subjectAvgs = Object.entries(subjectMap).map(([subject_name, scores]) => ({
    subject_name,
    score: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));
  const subject_count = subjectAvgs.length;
  const total_score = Number(subjectAvgs.reduce((s, g) => s + g.score, 0).toFixed(2));
  const average = subject_count ? Number((total_score / subject_count).toFixed(2)) : 0;

  let highest = null, lowest = null;
  for (const g of subjectAvgs) {
    if (!highest || g.score > highest.score) highest = g;
    if (!lowest || g.score < lowest.score) lowest = g;
  }

  // 2. 출결 집계 (학기 범위)
  const termStart = semester === 1 ? new Date(`${year}-03-01`) : new Date(`${year}-09-01`);
  const termEnd = semester === 1 ? new Date(`${year}-08-31T23:59:59`) : new Date(`${year + 1}-02-28T23:59:59`);

  const attendances = await Attendance.find({
    student_id,
    date: { $gte: termStart, $lte: termEnd },
  });

  const counts = { present: 0, absent: 0, late: 0, early_leave: 0, sick_leave: 0 };
  for (const a of attendances) {
    if (a.status === '출석') counts.present++;
    else if (a.status === '결석') counts.absent++;
    else if (a.status === '지각') counts.late++;
    else if (a.status === '조퇴') counts.early_leave++;
    else if (a.status === '결과') counts.sick_leave++;
  }
  const attendance_total = attendances.length;
  const attendance_rate = attendance_total
    ? Number(((counts.present / attendance_total) * 100).toFixed(2))
    : 0;

  // 3. 피드백/상담 카운트 (학기 범위)
  const feedback_count = await Feedback.countDocuments({
    student_id,
    created_at: { $gte: termStart, $lte: termEnd },
  });
  const counseling_count = await Counseling.countDocuments({
    student_id,
    counseling_date: { $gte: termStart, $lte: termEnd },
  });

  return FactStudentTerm.findOneAndUpdate(
    { student_id, year, semester },
    {
      $set: {
        total_score,
        average,
        subject_count,
        highest_subject: highest?.subject_name,
        lowest_subject: lowest?.subject_name,
        highest_score: highest?.score,
        lowest_score: lowest?.score,
        attendance_count: counts,
        attendance_total,
        attendance_rate,
        feedback_count,
        counseling_count,
        student_name: student?.name,
        grade_year: student?.grade_year,
        class_num: student?.class_num,
        student_num: student?.student_num,
        last_aggregated_at: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * 학생 × 학년×월 출결 Fact 갱신.
 * 해당 월에 출결 기록이 없으면 기존 Fact 삭제.
 */
async function aggregateStudentAttendanceMonth(student_id, year, month) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1); // 다음 달 1일 (배타)

  const attendances = await Attendance.find({
    student_id,
    date: { $gte: monthStart, $lt: monthEnd },
  });

  if (attendances.length === 0) {
    await FactStudentAttendanceMonthly.deleteOne({ student_id, year, month });
    return null;
  }

  const counts = { present: 0, absent: 0, late: 0, early_leave: 0, sick_leave: 0 };
  for (const a of attendances) {
    if (a.status === '출석') counts.present++;
    else if (a.status === '결석') counts.absent++;
    else if (a.status === '지각') counts.late++;
    else if (a.status === '조퇴') counts.early_leave++;
    else if (a.status === '결과') counts.sick_leave++;
  }
  const total_days = attendances.length;
  const attendance_rate = Number(((counts.present / total_days) * 100).toFixed(2));

  const student = await Student.findById(student_id).select('name grade_year class_num student_num');

  return FactStudentAttendanceMonthly.findOneAndUpdate(
    { student_id, year, month },
    {
      $set: {
        ...counts,
        total_days,
        attendance_rate,
        student_name: student?.name,
        grade_year: student?.grade_year,
        class_num: student?.class_num,
        student_num: student?.student_num,
        last_aggregated_at: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * 학생 × 학기 피드백 Fact 갱신 (카테고리 분해).
 * 해당 학기에 피드백이 없으면 기존 Fact 삭제.
 */
async function aggregateStudentFeedbackTerm(student_id, year, semester) {
  const termStart = semester === 1 ? new Date(`${year}-03-01`) : new Date(`${year}-09-01`);
  const termEnd = semester === 1 ? new Date(`${year}-08-31T23:59:59`) : new Date(`${year + 1}-02-28T23:59:59`);

  const feedbacks = await Feedback.find({
    student_id,
    created_at: { $gte: termStart, $lte: termEnd },
  });

  if (feedbacks.length === 0) {
    await FactStudentFeedbackTerm.deleteOne({ student_id, year, semester });
    return null;
  }

  const by_category = { 성적: 0, 행동: 0, 출결: 0, 태도: 0, 기타: 0 };
  let shared_with_parent_count = 0;
  let shared_with_student_count = 0;
  for (const f of feedbacks) {
    if (by_category[f.category] !== undefined) by_category[f.category]++;
    if (f.shared_with_parent) shared_with_parent_count++;
    if (f.shared_with_student) shared_with_student_count++;
  }

  const student = await Student.findById(student_id).select('name grade_year class_num student_num');

  return FactStudentFeedbackTerm.findOneAndUpdate(
    { student_id, year, semester },
    {
      $set: {
        by_category,
        total_count: feedbacks.length,
        shared_with_parent_count,
        shared_with_student_count,
        student_name: student?.name,
        grade_year: student?.grade_year,
        class_num: student?.class_num,
        student_num: student?.student_num,
        last_aggregated_at: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * 한 학생의 모든 시기에 대해 일괄 재집계.
 * 성적/출결/피드백/상담 어디든 데이터가 있는 모든 키를 모아서 처리.
 */
async function aggregateAllForStudent(student_id) {
  // 1) 성적 기반 (학기 키 + 과목 키)
  const gradeKeys = await Grade.aggregate([
    { $match: { student_id } },
    { $group: { _id: { year: '$year', semester: '$semester' } } },
  ]);
  const termKeySet = new Set();
  for (const { _id: key } of gradeKeys) {
    termKeySet.add(`${key.year}-${key.semester}`);
    const subjectKeys = await Grade.aggregate([
      { $match: { student_id, year: key.year, semester: key.semester } },
      { $group: { _id: '$subject_name' } },
    ]);
    for (const { _id: subject_name } of subjectKeys) {
      await aggregateStudentSubjectTerm(student_id, subject_name, key.year, key.semester);
    }
  }

  // 2) 출결 기반 (월 키 + 학기 키)
  const attendanceMonthKeys = await Attendance.aggregate([
    { $match: { student_id } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
      },
    },
  ]);
  for (const { _id: key } of attendanceMonthKeys) {
    await aggregateStudentAttendanceMonth(student_id, key.year, key.month);
    const term = classifyTerm(new Date(key.year, key.month - 1, 15));
    termKeySet.add(`${term.year}-${term.semester}`);
  }

  // 3) 피드백/상담 학기 키 수집
  const feedbackTerms = await Feedback.aggregate([
    { $match: { student_id } },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
        },
      },
    },
  ]);
  for (const { _id: key } of feedbackTerms) {
    const term = classifyTerm(new Date(key.year, key.month - 1, 15));
    termKeySet.add(`${term.year}-${term.semester}`);
  }
  const counselingTerms = await Counseling.aggregate([
    { $match: { student_id } },
    {
      $group: {
        _id: {
          year: { $year: '$counseling_date' },
          month: { $month: '$counseling_date' },
        },
      },
    },
  ]);
  for (const { _id: key } of counselingTerms) {
    const term = classifyTerm(new Date(key.year, key.month - 1, 15));
    termKeySet.add(`${term.year}-${term.semester}`);
  }

  // 4) 모든 학기 키에 대해 종합 + 피드백 Fact 재집계
  for (const tk of termKeySet) {
    const [yStr, sStr] = tk.split('-');
    const year = Number(yStr);
    const semester = Number(sStr);
    await aggregateStudentTerm(student_id, year, semester);
    await aggregateStudentFeedbackTerm(student_id, year, semester);
  }
}

/**
 * 전체 학생 백필.
 */
async function backfillAll() {
  const students = await Student.find().select('_id');
  console.log(`[backfill] ${students.length} students`);
  for (const s of students) {
    await aggregateAllForStudent(s._id);
  }
}

module.exports = {
  classifyTerm,
  aggregateStudentSubjectTerm,
  aggregateStudentTerm,
  aggregateStudentAttendanceMonth,
  aggregateStudentFeedbackTerm,
  aggregateAllForStudent,
  backfillAll,
};
