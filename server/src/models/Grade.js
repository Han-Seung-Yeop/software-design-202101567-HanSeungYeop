const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  subject_name: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
  },
  semester: {
    type: Number,
  },
  score: {
    type: Number,
    required: true,
  },
  total_score: {
    type: Number,
  },
  average: {
    type: Number,
  },
  grade_level: {
    type: String,
  },
  input_date: {
    type: Date,
    default: Date.now,
  },
});

gradeSchema.index({ student_id: 1, subject_name: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
