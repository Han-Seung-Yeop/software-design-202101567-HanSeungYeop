const Feedback = require('../models/Feedback');

const list = async (req, res, next) => {
  try {
    const { student_id, category, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };
    if (student_id) query.student_id = student_id;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Feedback.countDocuments(query);

    const feedbacks = await Feedback.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      data: feedbacks,
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
    const { student_id, teacher_id, category, content, shared_with_parent, shared_with_student } = req.body;

    if (!student_id || !teacher_id || !category || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const feedback = await Feedback.create({
      student_id,
      teacher_id,
      category,
      content,
      shared_with_parent: shared_with_parent || false,
      shared_with_student: shared_with_student || false,
    });

    return res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, content, shared_with_parent, shared_with_student } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '피드백을 찾을 수 없습니다.',
        error: 'FEEDBACK_NOT_FOUND',
      });
    }

    if (category !== undefined) feedback.category = category;
    if (content !== undefined) feedback.content = content;
    if (shared_with_parent !== undefined) feedback.shared_with_parent = shared_with_parent;
    if (shared_with_student !== undefined) feedback.shared_with_student = shared_with_student;

    await feedback.save();

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '피드백을 찾을 수 없습니다.',
        error: 'FEEDBACK_NOT_FOUND',
      });
    }

    await feedback.deleteOne();

    return res.status(200).json({
      success: true,
      data: { message: '피드백이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

const shareToggle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shared_with_parent, shared_with_student } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '피드백을 찾을 수 없습니다.',
        error: 'FEEDBACK_NOT_FOUND',
      });
    }

    if (shared_with_parent !== undefined) {
      feedback.shared_with_parent = shared_with_parent;
    }
    if (shared_with_student !== undefined) {
      feedback.shared_with_student = shared_with_student;
    }

    await feedback.save();

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove, shareToggle };
