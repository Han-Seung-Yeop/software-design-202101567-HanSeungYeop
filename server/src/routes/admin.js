const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireSuperAdmin } = require('../middlewares/superAdmin');

// 모든 admin 라우트는 super_admin 권한 필요
router.use(authenticate, requireSuperAdmin);

// 교사 사전 등록
router.post('/teachers', adminController.createTeacher);

// 교사 전체 조회 (super_admin이 자신의 사전 등록 목록 보기 위함)
router.get('/teachers', adminController.listTeachers);

// 교사 사전 등록 취소 (활성화 전 record만 삭제 가능)
router.delete('/teachers/:id', adminController.removeTeacher);

module.exports = router;
