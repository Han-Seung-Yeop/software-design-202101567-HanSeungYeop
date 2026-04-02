const SpecialNote = require('../models/SpecialNote');

const list = async (req, res, next) => {
  try {
    const { student_id, year, semester, category, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    const query = { ...accessFilter };
    if (student_id) query.student_id = student_id;
    if (year) query.year = Number(year);
    if (semester) query.semester = Number(semester);
    if (category) query.category = { $regex: category, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await SpecialNote.countDocuments(query);

    const specialNotes = await SpecialNote.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ year: -1, semester: -1, created_at: -1 });

    return res.status(200).json({
      success: true,
      data: specialNotes,
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
    const { student_id, teacher_id, year, semester, category, content } = req.body;

    if (!student_id || !teacher_id || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const specialNote = await SpecialNote.create({
      student_id,
      teacher_id,
      year,
      semester,
      category,
      content,
    });

    return res.status(201).json({
      success: true,
      data: specialNote,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year, semester, category, content } = req.body;

    const specialNote = await SpecialNote.findById(id);
    if (!specialNote) {
      return res.status(404).json({
        success: false,
        message: '특기사항을 찾을 수 없습니다.',
        error: 'SPECIAL_NOTE_NOT_FOUND',
      });
    }

    if (year !== undefined) specialNote.year = year;
    if (semester !== undefined) specialNote.semester = semester;
    if (category !== undefined) specialNote.category = category;
    if (content !== undefined) specialNote.content = content;

    await specialNote.save();

    return res.status(200).json({
      success: true,
      data: specialNote,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const specialNote = await SpecialNote.findById(id);
    if (!specialNote) {
      return res.status(404).json({
        success: false,
        message: '특기사항을 찾을 수 없습니다.',
        error: 'SPECIAL_NOTE_NOT_FOUND',
      });
    }

    await specialNote.deleteOne();

    return res.status(200).json({
      success: true,
      data: { message: '특기사항이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove };
