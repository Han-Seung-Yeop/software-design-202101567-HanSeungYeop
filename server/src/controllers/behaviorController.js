const Behavior = require('../models/Behavior');

const list = async (req, res, next) => {
  try {
    const { student_id, category, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };
    if (student_id) query.student_id = student_id;
    if (category) query.category = { $regex: category, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Behavior.countDocuments(query);

    const behaviors = await Behavior.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ date: -1, created_at: -1 });

    return res.status(200).json({
      success: true,
      data: behaviors,
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
    const { student_id, teacher_id, date, category, content } = req.body;

    if (!student_id || !teacher_id || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const behavior = await Behavior.create({
      student_id,
      teacher_id,
      date: date ? new Date(date) : undefined,
      category,
      content,
    });

    return res.status(201).json({
      success: true,
      data: behavior,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, category, content } = req.body;

    const behavior = await Behavior.findById(id);
    if (!behavior) {
      return res.status(404).json({
        success: false,
        message: '행동 기록을 찾을 수 없습니다.',
        error: 'BEHAVIOR_NOT_FOUND',
      });
    }

    if (date !== undefined) behavior.date = new Date(date);
    if (category !== undefined) behavior.category = category;
    if (content !== undefined) behavior.content = content;

    await behavior.save();

    return res.status(200).json({
      success: true,
      data: behavior,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const behavior = await Behavior.findById(id);
    if (!behavior) {
      return res.status(404).json({
        success: false,
        message: '행동 기록을 찾을 수 없습니다.',
        error: 'BEHAVIOR_NOT_FOUND',
      });
    }

    await behavior.deleteOne();

    return res.status(200).json({
      success: true,
      data: { message: '행동 기록이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove };
