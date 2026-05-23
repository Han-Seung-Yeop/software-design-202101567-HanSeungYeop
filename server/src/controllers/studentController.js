const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const Teacher = require('../models/Teacher');

const list = async (req, res, next) => {
  try {
    const { grade_year, class_num, name, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };

    if (grade_year) query.grade_year = Number(grade_year);
    if (class_num) query.class_num = Number(class_num);
    if (name) query.name = { $regex: name, $options: 'i' };

    const studentQuery = Student.find(query).populate('user_id', 'name email role');

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Student.countDocuments(query);

    const students = await studentQuery
      .skip(skip)
      .limit(Number(limit))
      .sort({ grade_year: 1, class_num: 1, student_num: 1 });

    return res.status(200).json({
      success: true,
      data: students,
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

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate('user_id', 'name email role created_at');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '학생 정보를 찾을 수 없습니다.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    // Grades count
    const gradesCount = await Grade.countDocuments({ student_id: student._id });

    // Attendance summary
    const attendanceStatuses = ['출석', '결석', '지각', '조퇴', '결과'];
    const attendanceSummary = {};
    for (const status of attendanceStatuses) {
      attendanceSummary[status] = await Attendance.countDocuments({
        student_id: student._id,
        status,
      });
    }

    // Recent feedbacks (last 5)
    const recentFeedbacks = await Feedback.find({ student_id: student._id })
      .sort({ created_at: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        student,
        summary: {
          gradesCount,
          attendanceSummary,
          recentFeedbacks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { grade_year, class_num, student_num } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '학생 정보를 찾을 수 없습니다.',
        error: 'STUDENT_NOT_FOUND',
      });
    }

    if (grade_year !== undefined) student.grade_year = grade_year;
    if (class_num !== undefined) student.class_num = class_num;
    if (student_num !== undefined) student.student_num = student_num;

    await student.save();

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 교사가 학생을 사전 등록.
 * Student record만 생성 (user_id=null) → 그 email로 OAuth 로그인 시 활성화됨.
 */
const create = async (req, res, next) => {
  try {
    const { email, name, grade_year, class_num, student_num } = req.body;

    if (!email || !name || !grade_year || !class_num || !student_num) {
      return res.status(400).json({
        success: false,
        message: '이메일, 이름, 학년, 반, 번호는 필수입니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 이메일 중복 체크
    const existingByEmail = await Student.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        message: '이미 등록된 이메일입니다.',
        error: 'DUPLICATE_STUDENT_EMAIL',
      });
    }

    // 학년/반/번호 중복 체크 (compound unique)
    const existingByPosition = await Student.findOne({
      grade_year: Number(grade_year),
      class_num: Number(class_num),
      student_num: Number(student_num),
    });
    if (existingByPosition) {
      return res.status(409).json({
        success: false,
        message: '같은 학년/반/번호의 학생이 이미 있습니다.',
        error: 'DUPLICATE_STUDENT_POSITION',
      });
    }

    const teacher = await Teacher.findOne({ user_id: req.user.userId });

    const student = await Student.create({
      email: normalizedEmail,
      name,
      grade_year: Number(grade_year),
      class_num: Number(class_num),
      student_num: Number(student_num),
      parent_ids: [],
      invited_by: teacher?._id,
    });

    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '이미 등록된 학생입니다.',
        error: 'DUPLICATE_STUDENT',
      });
    }
    next(error);
  }
};

module.exports = { list, getById, update, create };
