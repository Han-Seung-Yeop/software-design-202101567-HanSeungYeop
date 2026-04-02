const Attitude = require('../models/Attitude');
const Teacher = require('../models/Teacher');

const list = async (req, res, next) => {
  try {
    const { student_id, subject_name, rating, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };
    if (student_id) query.student_id = student_id;
    if (subject_name) query.subject_name = { $regex: subject_name, $options: 'i' };
    if (rating) query.rating = rating;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Attitude.countDocuments(query);

    const attitudes = await Attitude.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ date: -1, created_at: -1 });

    return res.status(200).json({
      success: true,
      data: attitudes,
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
    const { student_id, date, subject_name, content, rating } = req.body;

    const teacher = await Teacher.findOne({ user_id: req.user.userId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '교사 정보를 찾을 수 없습니다.',
        error: 'TEACHER_NOT_FOUND',
      });
    }

    if (!student_id || !date || !subject_name || !content || !rating) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const attitude = await Attitude.create({
      student_id,
      teacher_id: teacher._id,
      date: date ? new Date(date) : undefined,
      subject_name,
      content,
      rating,
    });

    return res.status(201).json({
      success: true,
      data: attitude,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, subject_name, content, rating } = req.body;

    const attitude = await Attitude.findById(id);
    if (!attitude) {
      return res.status(404).json({
        success: false,
        message: '태도 기록을 찾을 수 없습니다.',
        error: 'ATTITUDE_NOT_FOUND',
      });
    }

    if (date !== undefined) attitude.date = new Date(date);
    if (subject_name !== undefined) attitude.subject_name = subject_name;
    if (content !== undefined) attitude.content = content;
    if (rating !== undefined) attitude.rating = rating;

    await attitude.save();

    return res.status(200).json({
      success: true,
      data: attitude,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attitude = await Attitude.findById(id);
    if (!attitude) {
      return res.status(404).json({
        success: false,
        message: '태도 기록을 찾을 수 없습니다.',
        error: 'ATTITUDE_NOT_FOUND',
      });
    }

    await attitude.deleteOne();

    return res.status(200).json({
      success: true,
      data: { message: '태도 기록이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove };
