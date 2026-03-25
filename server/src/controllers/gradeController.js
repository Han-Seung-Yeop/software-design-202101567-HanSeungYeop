const Grade = require('../models/Grade');
const { calculateGradeLevel, recalculateStudentGrades } = require('../utils/gradeCalculator');

const list = async (req, res, next) => {
  try {
    const { student_id, year, semester, subject_name, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };
    if (student_id) query.student_id = student_id;
    if (year) query.year = Number(year);
    if (semester) query.semester = Number(semester);
    if (subject_name) query.subject_name = { $regex: subject_name, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Grade.countDocuments(query);

    const grades = await Grade.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ year: -1, semester: -1, subject_name: 1 });

    return res.status(200).json({
      success: true,
      data: grades,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { student_id, teacher_id, subject_name, year, semester, score } = req.body;

    if (!student_id || !teacher_id || !subject_name || score === undefined) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const grade_level = calculateGradeLevel(score);

    const grade = await Grade.create({
      student_id,
      teacher_id,
      subject_name,
      year,
      semester,
      score,
      grade_level,
    });

    // Recalculate totals
    const { total_score, average } = await recalculateStudentGrades(student_id, year, semester);

    const updatedGrade = await Grade.findById(grade._id)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } });

    return res.status(201).json({
      success: true,
      data: { grade: updatedGrade, total_score, average },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '이미 해당 학생의 같은 과목, 학년, 학기 성적이 존재합니다.',
        error: 'DUPLICATE_GRADE',
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, subject_name, year, semester } = req.body;

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '성적 정보를 찾을 수 없습니다.',
        error: 'GRADE_NOT_FOUND',
      });
    }

    if (score !== undefined) {
      grade.score = score;
      grade.grade_level = calculateGradeLevel(score);
    }
    if (subject_name !== undefined) grade.subject_name = subject_name;
    if (year !== undefined) grade.year = year;
    if (semester !== undefined) grade.semester = semester;

    await grade.save();

    const { total_score, average } = await recalculateStudentGrades(
      grade.student_id,
      grade.year,
      grade.semester
    );

    const updatedGrade = await Grade.findById(id)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } });

    return res.status(200).json({
      success: true,
      data: { grade: updatedGrade, total_score, average },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '성적 정보를 찾을 수 없습니다.',
        error: 'GRADE_NOT_FOUND',
      });
    }

    const { student_id, year, semester } = grade;
    await grade.deleteOne();

    await recalculateStudentGrades(student_id, year, semester);

    return res.status(200).json({
      success: true,
      data: { message: '성적이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

const getRadarData = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { year, semester } = req.query;

    const query = { student_id: studentId };
    if (year) query.year = Number(year);
    if (semester) query.semester = Number(semester);

    const grades = await Grade.find(query).select('subject_name score');

    const radarData = grades.map((g) => ({
      subject_name: g.subject_name,
      score: g.score,
    }));

    return res.status(200).json({
      success: true,
      data: radarData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove, getRadarData };
