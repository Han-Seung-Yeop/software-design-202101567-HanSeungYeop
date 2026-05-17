const mongoose = require('mongoose');
const { analyticsConn } = require('../../config/analyticsDb');

/**
 * 학생 × (학년도 기준) 월 단위 출결 Fact.
 * year/month는 출결 date 그대로의 캘린더 값(학기 판정과 별개).
 */
const schema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },

  present: { type: Number, default: 0 },
  absent: { type: Number, default: 0 },
  late: { type: Number, default: 0 },
  early_leave: { type: Number, default: 0 },
  sick_leave: { type: Number, default: 0 },
  total_days: { type: Number, default: 0 },
  attendance_rate: { type: Number, default: 0 },

  student_name: { type: String },
  grade_year: { type: Number },
  class_num: { type: Number },
  student_num: { type: Number },

  last_aggregated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

schema.index({ student_id: 1, year: 1, month: 1 }, { unique: true });
schema.index({ year: 1, month: 1 });

module.exports = analyticsConn.model(
  'FactStudentAttendanceMonthly',
  schema,
  'fact_student_attendance_monthly'
);
