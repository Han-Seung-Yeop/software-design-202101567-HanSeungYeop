const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// 학생 단위 권한은 students 컬렉션 read 권한 기준 (accessFilter 활용)
router.get(
  '/students/:id/terms',
  authenticate,
  accessControl('students', 'read'),
  analyticsController.getStudentTerms
);

router.get(
  '/students/:id/terms/:year/:semester',
  authenticate,
  accessControl('students', 'read'),
  analyticsController.getStudentTermDetail
);

router.get(
  '/students/:id/subjects',
  authenticate,
  accessControl('students', 'read'),
  analyticsController.getStudentSubjects
);

router.get(
  '/students/:id/attendance/monthly',
  authenticate,
  accessControl('students', 'read'),
  analyticsController.getStudentAttendanceMonthly
);

router.get(
  '/students/:id/feedback',
  authenticate,
  accessControl('students', 'read'),
  analyticsController.getStudentFeedback
);

// 전체 백필 트리거 (교사만)
router.post('/backfill', authenticate, analyticsController.triggerBackfill);

module.exports = router;
