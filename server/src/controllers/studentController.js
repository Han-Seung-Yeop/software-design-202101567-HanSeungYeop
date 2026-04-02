const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const list = async (req, res, next) => {
  try {
    const { grade_year, class_num, name, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    // Build base query
    const query = { ...accessFilter };

    if (grade_year) query.grade_year = Number(grade_year);
    if (class_num) query.class_num = Number(class_num);

    let studentQuery = Student.find(query).populate('user_id', 'name login_id role');

    // Filter by name after populate (using aggregation alternative: look up users first)
    if (name) {
      // Fetch matching users first
      const matchingUsers = await User.find({ name: { $regex: name, $options: 'i' } }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      query.user_id = { $in: userIds };
      studentQuery = Student.find(query).populate('user_id', 'name login_id role');
    }

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

    const student = await Student.findById(id).populate('user_id', 'name login_id role created_at');
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

module.exports = { list, getById, update };
