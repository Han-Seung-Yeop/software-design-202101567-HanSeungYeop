const mongoose = require('mongoose');
const { analyticsConn } = require('../../config/analyticsDb');

/**
 * 학생 × 과목 × 학기 단위 Fact.
 * Grade 데이터의 비정규화된 분석용 사본.
 */
const schema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  subject_name: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },

  // 집계 결과
  score: { type: Number, required: true },
  grade_level: { type: String },

  // 학생 정보 비정규화 (조회 빠르게)
  student_name: { type: String },
  grade_year: { type: Number },
  class_num: { type: Number },
  student_num: { type: Number },

  last_aggregated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

schema.index({ student_id: 1, subject_name: 1, year: 1, semester: 1 }, { unique: true });
schema.index({ year: 1, semester: 1, subject_name: 1, score: -1 });

module.exports = analyticsConn.model(
  'FactStudentSubjectTerm',
  schema,
  'fact_student_subject_term'
);
