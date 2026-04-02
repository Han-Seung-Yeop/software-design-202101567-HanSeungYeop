const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['성적', '행동', '출결', '태도', '기타'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  shared_with_parent: {
    type: Boolean,
    default: false,
  },
  shared_with_student: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
