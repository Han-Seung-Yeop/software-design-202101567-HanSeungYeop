const mongoose = require('mongoose');
const { analyticsConn } = require('../../config/analyticsDb');

/**
 * 학생 × 학기 종합 Fact.
 * 성적 + 출결 + 피드백 + 상담 카운트를 하나로 묶음.
 */
const schema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },

  // 성적 집계
  total_score: { type: Number, default: 0 },
  average: { type: Number, default: 0 },
  subject_count: { type: Number, default: 0 },
  highest_subject: { type: String },
  lowest_subject: { type: String },
  highest_score: { type: Number },
  lowest_score: { type: Number },

  // 출결 집계 (학기 단위 합계)
  attendance_count: {
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    late: { type: Number, default: 0 },
    early_leave: { type: Number, default: 0 },
    sick_leave: { type: Number, default: 0 },
  },
  attendance_total: { type: Number, default: 0 },
  attendance_rate: { type: Number, default: 0 },

  // 피드백/상담 카운트
  feedback_count: { type: Number, default: 0 },
  counseling_count: { type: Number, default: 0 },

  // 학생 정보 비정규화
  student_name: { type: String },
  grade_year: { type: Number },
  class_num: { type: Number },
  student_num: { type: Number },

  last_aggregated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

schema.index({ student_id: 1, year: 1, semester: 1 }, { unique: true });
schema.index({ year: 1, semester: 1, average: -1 });

module.exports = analyticsConn.model(
  'FactStudentTerm',
  schema,
  'fact_student_term'
);
