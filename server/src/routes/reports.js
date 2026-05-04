const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middlewares/auth');
const accessControl = require('../middlewares/accessControl');

// PDF 생성은 시간이 좀 걸릴 수 있어 응답 타임아웃을 늘려둠
router.use((req, res, next) => {
  res.setTimeout(60 * 1000);
  next();
});

router.get(
  '/grades',
  authenticate,
  requireRole('teacher'),
  accessControl('grades', 'read'),
  reportController.gradeReport
);

router.get(
  '/counselings',
  authenticate,
  requireRole('teacher'),
  accessControl('counselings', 'read'),
  reportController.counselingReport
);

router.get(
  '/feedbacks',
  authenticate,
  requireRole('teacher'),
  accessControl('feedbacks', 'read'),
  reportController.feedbackReport
);

module.exports = router;
