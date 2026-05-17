const FactStudentSubjectTerm = require('../models/analytics/FactStudentSubjectTerm');
const FactStudentTerm = require('../models/analytics/FactStudentTerm');
const FactStudentAttendanceMonthly = require('../models/analytics/FactStudentAttendanceMonthly');
const FactStudentFeedbackTerm = require('../models/analytics/FactStudentFeedbackTerm');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const aggregator = require('../services/analytics/aggregator');

/**
 * 권한 체크: 본인이 이 학생 분석을 볼 수 있는가?
 * - teacher: accessFilter에 포함된 학생만 (담당 학급)
 * - student: 본인만
 * - parent: 자녀만
 */
const canViewStudent = async (req, studentId) => {
  const { userId, role } = req.user;
  if (role === 'teacher') {
    // accessControl 미들웨어가 req.accessFilter를 채워줌
    const allowed = req.accessFilter?._id?.$in;
    if (!allowed) return true; // super_admin 등 전체 접근
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

/**
 * GET /api/analytics/students/:id/terms
 * 해당 학생의 모든 학기 종합 Fact 리스트.
 */
const getStudentTerms = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!(await canViewStudent(req, id))) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.', error: 'FORBIDDEN' });
    }
    const terms = await FactStudentTerm.find({ student_id: id }).sort({ year: 1, semester: 1 });
    return res.status(200).json({ success: true, data: terms });
  } catch (error) { next(error); }
};

/**
 * GET /api/analytics/students/:id/terms/:year/:semester
 * 특정 학기의 종합 Fact 1개. 없으면 즉시 집계.
 */
const getStudentTermDetail = async (req, res, next) => {
  try {
    const { id, year, semester } = req.params;
    if (!(await canViewStudent(req, id))) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.', error: 'FORBIDDEN' });
    }
    const y = Number(year);
    const s = Number(semester);

    let term = await FactStudentTerm.findOne({ student_id: id, year: y, semester: s });
    if (!term) {
      // Fact가 아직 없으면 즉시 집계 후 반환
      term = await aggregator.aggregateStudentTerm(id, y, s);
    }
    return res.status(200).json({ success: true, data: term });
  } catch (error) { next(error); }
};

/**
 * GET /api/analytics/students/:id/subjects?year=&semester=
 * 학생의 과목별 Fact. year/semester 필터 옵션.
 */
const getStudentSubjects = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!(await canViewStudent(req, id))) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.', error: 'FORBIDDEN' });
    }
    const { year, semester } = req.query;
    const filter = { student_id: id };
    if (year) filter.year = Number(year);
    if (semester) filter.semester = Number(semester);

    const subjects = await FactStudentSubjectTerm.find(filter).sort({ year: 1, semester: 1, subject_name: 1 });
    return res.status(200).json({ success: true, data: subjects });
  } catch (error) { next(error); }
};

/**
 * GET /api/analytics/students/:id/attendance/monthly?year=
 * 학생의 월별 출결 Fact 리스트. year 필터 옵션.
 */
const getStudentAttendanceMonthly = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!(await canViewStudent(req, id))) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.', error: 'FORBIDDEN' });
    }
    const { year } = req.query;
    const filter = { student_id: id };
    if (year) filter.year = Number(year);

    const months = await FactStudentAttendanceMonthly
      .find(filter)
      .sort({ year: 1, month: 1 });
    return res.status(200).json({ success: true, data: months });
  } catch (error) { next(error); }
};

/**
 * GET /api/analytics/students/:id/feedback?year=&semester=
 * 학생의 학기별 피드백 카테고리 분포.
 */
const getStudentFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!(await canViewStudent(req, id))) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.', error: 'FORBIDDEN' });
    }
    const { year, semester } = req.query;
    const filter = { student_id: id };
    if (year) filter.year = Number(year);
    if (semester) filter.semester = Number(semester);

    const items = await FactStudentFeedbackTerm
      .find(filter)
      .sort({ year: 1, semester: 1 });
    return res.status(200).json({ success: true, data: items });
  } catch (error) { next(error); }
};

/**
 * POST /api/analytics/backfill
 * super_admin/교사가 전체 재집계 트리거.
 */
const triggerBackfill = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: '교사만 가능합니다.', error: 'FORBIDDEN' });
    }
    const start = Date.now();
    await aggregator.backfillAll();
    return res.status(200).json({
      success: true,
      data: { duration_seconds: ((Date.now() - start) / 1000).toFixed(1) },
    });
  } catch (error) { next(error); }
};

module.exports = {
  getStudentTerms,
  getStudentTermDetail,
  getStudentSubjects,
  getStudentAttendanceMonthly,
  getStudentFeedback,
  triggerBackfill,
};
