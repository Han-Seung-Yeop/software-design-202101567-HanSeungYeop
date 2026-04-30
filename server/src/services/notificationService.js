const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

const getStudentRecipients = async (studentId, { includeStudent = true, includeParents = true } = {}) => {
  const student = await Student.findById(studentId).select('user_id parent_ids');
  if (!student) return [];

  const recipients = [];

  if (includeStudent && student.user_id) {
    recipients.push({ user_id: student.user_id, role: 'student' });
  }

  if (includeParents && student.parent_ids && student.parent_ids.length > 0) {
    const parents = await Parent.find({ _id: { $in: student.parent_ids } }).select('user_id');
    for (const parent of parents) {
      if (parent.user_id) {
        recipients.push({ user_id: parent.user_id, role: 'parent' });
      }
    }
  }

  return recipients;
};

const getTeacherUserIds = async (teacherIds) => {
  if (!teacherIds || teacherIds.length === 0) return [];
  const teachers = await Teacher.find({ _id: { $in: teacherIds } }).select('user_id');
  return teachers
    .filter((t) => t.user_id)
    .map((t) => ({ user_id: t.user_id, role: 'teacher' }));
};

const getTeacherUserId = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).select('user_id');
  return teacher?.user_id || null;
};

const getStudentName = async (studentId) => {
  const student = await Student.findById(studentId).populate({ path: 'user_id', select: 'name' });
  return student?.user_id?.name || '학생';
};

const buildNotifications = (recipients, payload) =>
  recipients.map((r) => ({
    recipient_id: r.user_id,
    recipient_role: r.role,
    ...payload,
  }));

const safeInsert = async (docs) => {
  if (!docs || docs.length === 0) return;
  try {
    await Notification.insertMany(docs, { ordered: false });
  } catch (error) {
    console.error('[notificationService] insert failed:', error.message);
  }
};

const notifyGradeChanged = async ({ grade, actorUserId, isUpdate = false }) => {
  try {
    const recipients = await getStudentRecipients(grade.student_id);
    if (recipients.length === 0) return;

    const studentName = await getStudentName(grade.student_id);
    const type = isUpdate ? 'GRADE_UPDATED' : 'GRADE_CREATED';
    const title = isUpdate ? '성적이 수정되었습니다' : '성적이 등록되었습니다';
    const message = `${studentName} 학생의 ${grade.year}학년도 ${grade.semester}학기 ${grade.subject_name} 성적(${grade.score}점)이 ${isUpdate ? '수정' : '등록'}되었습니다.`;

    const docs = buildNotifications(recipients, {
      type,
      title,
      message,
      link: `/grades/${grade._id}`,
      ref_collection: 'Grade',
      ref_id: grade._id,
      actor_id: actorUserId,
    });

    await safeInsert(docs);
  } catch (error) {
    console.error('[notificationService] notifyGradeChanged failed:', error.message);
  }
};

const notifyFeedbackShared = async ({ feedback, actorUserId, sharedToParent, sharedToStudent }) => {
  try {
    if (!sharedToParent && !sharedToStudent) return;

    const recipients = await getStudentRecipients(feedback.student_id, {
      includeStudent: sharedToStudent,
      includeParents: sharedToParent,
    });
    if (recipients.length === 0) return;

    const studentName = await getStudentName(feedback.student_id);
    const message = `${studentName} 학생에 대한 [${feedback.category}] 피드백이 공유되었습니다.`;

    const docs = buildNotifications(recipients, {
      type: 'FEEDBACK_SHARED',
      title: '새 피드백이 공유되었습니다',
      message,
      link: `/feedbacks/${feedback._id}`,
      ref_collection: 'Feedback',
      ref_id: feedback._id,
      actor_id: actorUserId,
    });

    await safeInsert(docs);
  } catch (error) {
    console.error('[notificationService] notifyFeedbackShared failed:', error.message);
  }
};

const notifyCounselingCreated = async ({ counseling, actorUserId }) => {
  try {
    const recipients = [];

    if (counseling.shared_with_parent) {
      const parentRecipients = await getStudentRecipients(counseling.student_id, {
        includeStudent: false,
        includeParents: true,
      });
      recipients.push(...parentRecipients);
    }

    if (counseling.is_shared && counseling.shared_with && counseling.shared_with.length > 0) {
      const teacherRecipients = await getTeacherUserIds(counseling.shared_with);
      recipients.push(...teacherRecipients);
    }

    if (recipients.length === 0) return;

    const studentName = await getStudentName(counseling.student_id);
    const message = `${studentName} 학생의 상담 기록이 공유되었습니다.`;

    const docs = buildNotifications(recipients, {
      type: 'COUNSELING_CREATED',
      title: '상담 기록이 공유되었습니다',
      message,
      link: `/counselings/${counseling._id}`,
      ref_collection: 'Counseling',
      ref_id: counseling._id,
      actor_id: actorUserId,
    });

    await safeInsert(docs);
  } catch (error) {
    console.error('[notificationService] notifyCounselingCreated failed:', error.message);
  }
};

const notifyCounselingShared = async ({ counseling, newTeacherIds = [], sharedToParentNew = false, actorUserId }) => {
  try {
    const recipients = [];

    if (newTeacherIds.length > 0) {
      const teacherRecipients = await getTeacherUserIds(newTeacherIds);
      recipients.push(...teacherRecipients);
    }

    if (sharedToParentNew) {
      const parentRecipients = await getStudentRecipients(counseling.student_id, {
        includeStudent: false,
        includeParents: true,
      });
      recipients.push(...parentRecipients);
    }

    if (recipients.length === 0) return;

    const studentName = await getStudentName(counseling.student_id);
    const message = `${studentName} 학생의 상담 기록이 공유되었습니다.`;

    const docs = buildNotifications(recipients, {
      type: 'COUNSELING_SHARED',
      title: '상담 기록이 공유되었습니다',
      message,
      link: `/counselings/${counseling._id}`,
      ref_collection: 'Counseling',
      ref_id: counseling._id,
      actor_id: actorUserId,
    });

    await safeInsert(docs);
  } catch (error) {
    console.error('[notificationService] notifyCounselingShared failed:', error.message);
  }
};

module.exports = {
  notifyGradeChanged,
  notifyFeedbackShared,
  notifyCounselingCreated,
  notifyCounselingShared,
  getTeacherUserId,
};
