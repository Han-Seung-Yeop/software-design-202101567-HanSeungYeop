const Attendance = require('../models/Attendance');

const list = async (req, res, next) => {
  try {
    const { student_id, start_date, end_date, status, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };
    if (student_id) query.student_id = student_id;
    if (status) query.status = status;
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Attendance.countDocuments(query);

    const attendances = await Attendance.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      data: attendances,
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
    const { student_id, teacher_id, date, status, reason } = req.body;

    if (!student_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const attendance = await Attendance.create({
      student_id,
      teacher_id,
      date: new Date(date),
      status,
      reason,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } });

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, status, reason } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: '출결 정보를 찾을 수 없습니다.',
        error: 'ATTENDANCE_NOT_FOUND',
      });
    }

    if (date !== undefined) attendance.date = new Date(date);
    if (status !== undefined) attendance.status = status;
    if (reason !== undefined) attendance.reason = reason;

    await attendance.save();

    return res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: '출결 정보를 찾을 수 없습니다.',
        error: 'ATTENDANCE_NOT_FOUND',
      });
    }

    await attendance.deleteOne();

    return res.status(200).json({
      success: true,
      data: { message: '출결 정보가 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

const summary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const accessFilter = req.accessFilter || {};

    const statuses = ['출석', '결석', '지각', '조퇴', '결과'];
    const summaryResult = {};

    for (const status of statuses) {
      summaryResult[status] = await Attendance.countDocuments({
        ...accessFilter,
        student_id: studentId,
        status,
      });
    }

    return res.status(200).json({
      success: true,
      data: summaryResult,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove, summary };
