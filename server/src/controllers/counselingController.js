const Counseling = require('../models/Counseling');
const Teacher = require('../models/Teacher');

const getTeacherId = async (userId) => {
  const teacher = await Teacher.findOne({ user_id: userId });
  return teacher?._id;
};

const list = async (req, res, next) => {
  try {
    const { student_id, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    let query = { ...accessFilter };
    if (student_id) query.student_id = student_id;

    if (req.user.role === 'teacher') {
      const teacherId = await getTeacherId(req.user.userId);
      if (teacherId) {
        query = {
          ...query,
          $or: [
            { teacher_id: teacherId },
            { is_shared: true },
            { shared_with: teacherId },
          ],
        };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Counseling.countDocuments(query);

    const counselings = await Counseling.find(query)
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'shared_with', populate: { path: 'user_id', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ counseling_date: -1 });

    return res.status(200).json({
      success: true,
      data: counselings,
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
    const { student_id, teacher_id, counseling_date, main_content, next_plan, is_shared, shared_with, shared_with_parent } = req.body;

    if (!student_id || !teacher_id || !counseling_date || !main_content) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const counseling = await Counseling.create({
      student_id,
      teacher_id,
      counseling_date: new Date(counseling_date),
      main_content,
      next_plan,
      is_shared: is_shared || false,
      shared_with: shared_with || [],
      shared_with_parent: shared_with_parent || false,
    });

    return res.status(201).json({
      success: true,
      data: counseling,
    });
  } catch (error) {
    next(error);
  }
};

const assertOwner = async (counseling, req, res) => {
  if (req.user.role !== 'teacher') {
    res.status(403).json({ success: false, message: '교사만 수정할 수 있습니다.', error: 'NOT_TEACHER' });
    return false;
  }
  const teacherId = await getTeacherId(req.user.userId);
  if (!teacherId || counseling.teacher_id.toString() !== teacherId.toString()) {
    res.status(403).json({ success: false, message: '본인이 작성한 상담만 수정/공유할 수 있습니다.', error: 'NOT_OWNER' });
    return false;
  }
  return true;
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { counseling_date, main_content, next_plan } = req.body;

    const counseling = await Counseling.findById(id);
    if (!counseling) {
      return res.status(404).json({
        success: false,
        message: '상담 기록을 찾을 수 없습니다.',
        error: 'COUNSELING_NOT_FOUND',
      });
    }

    if (!(await assertOwner(counseling, req, res))) return;

    if (counseling_date !== undefined) counseling.counseling_date = new Date(counseling_date);
    if (main_content !== undefined) counseling.main_content = main_content;
    if (next_plan !== undefined) counseling.next_plan = next_plan;

    await counseling.save();

    return res.status(200).json({
      success: true,
      data: counseling,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const counseling = await Counseling.findById(id);
    if (!counseling) {
      return res.status(404).json({
        success: false,
        message: '상담 기록을 찾을 수 없습니다.',
        error: 'COUNSELING_NOT_FOUND',
      });
    }

    if (!(await assertOwner(counseling, req, res))) return;

    await counseling.deleteOne();

    return res.status(200).json({
      success: true,
      data: { message: '상담 기록이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const accessFilter = req.accessFilter || {};

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '검색어를 입력해주세요.',
        error: 'MISSING_SEARCH_QUERY',
      });
    }

    const query = { ...accessFilter, $text: { $search: q } };
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Counseling.countDocuments(query);

    const counselings = await Counseling.find(query, { score: { $meta: 'textScore' } })
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: counselings,
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

const shareTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_shared, teacher_ids_to_add, teacher_ids_to_remove } = req.body;

    const counseling = await Counseling.findById(id);
    if (!counseling) {
      return res.status(404).json({
        success: false,
        message: '상담 기록을 찾을 수 없습니다.',
        error: 'COUNSELING_NOT_FOUND',
      });
    }

    if (!(await assertOwner(counseling, req, res))) return;

    if (is_shared !== undefined) counseling.is_shared = is_shared;

    if (teacher_ids_to_add && teacher_ids_to_add.length > 0) {
      for (const tid of teacher_ids_to_add) {
        if (!counseling.shared_with.includes(tid)) {
          counseling.shared_with.push(tid);
        }
      }
    }

    if (teacher_ids_to_remove && teacher_ids_to_remove.length > 0) {
      counseling.shared_with = counseling.shared_with.filter(
        (tid) => !teacher_ids_to_remove.includes(tid.toString())
      );
    }

    await counseling.save();

    return res.status(200).json({
      success: true,
      data: counseling,
    });
  } catch (error) {
    next(error);
  }
};

const shareParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shared_with_parent } = req.body;

    const counseling = await Counseling.findById(id);
    if (!counseling) {
      return res.status(404).json({
        success: false,
        message: '상담 기록을 찾을 수 없습니다.',
        error: 'COUNSELING_NOT_FOUND',
      });
    }

    if (!(await assertOwner(counseling, req, res))) return;

    if (shared_with_parent !== undefined) {
      counseling.shared_with_parent = shared_with_parent;
    } else {
      // Toggle if not provided
      counseling.shared_with_parent = !counseling.shared_with_parent;
    }

    await counseling.save();

    return res.status(200).json({
      success: true,
      data: counseling,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove, search, shareTeacher, shareParent };
