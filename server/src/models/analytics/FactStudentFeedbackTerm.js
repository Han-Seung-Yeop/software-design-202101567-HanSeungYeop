const mongoose = require('mongoose');
const { analyticsConn } = require('../../config/analyticsDb');

/**
 * 학생 × 학기 × 카테고리별 피드백 Fact.
 * 카테고리 enum은 운영 DB Feedback 모델과 동일.
 */
const schema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },

  by_category: {
    성적: { type: Number, default: 0 },
    행동: { type: Number, default: 0 },
    출결: { type: Number, default: 0 },
    태도: { type: Number, default: 0 },
    기타: { type: Number, default: 0 },
  },
  total_count: { type: Number, default: 0 },
  shared_with_parent_count: { type: Number, default: 0 },
  shared_with_student_count: { type: Number, default: 0 },

  student_name: { type: String },
  grade_year: { type: Number },
  class_num: { type: Number },
  student_num: { type: Number },

  last_aggregated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

schema.index({ student_id: 1, year: 1, semester: 1 }, { unique: true });
schema.index({ year: 1, semester: 1, total_count: -1 });

module.exports = analyticsConn.model(
  'FactStudentFeedbackTerm',
  schema,
  'fact_student_feedback_term'
);
