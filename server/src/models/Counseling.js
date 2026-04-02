const mongoose = require('mongoose');

const counselingSchema = new mongoose.Schema({
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
  counseling_date: {
    type: Date,
    required: true,
  },
  main_content: {
    type: String,
    required: true,
  },
  next_plan: {
    type: String,
  },
  is_shared: {
    type: Boolean,
    default: false,
  },
  shared_with: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  ],
  shared_with_parent: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

counselingSchema.index({ main_content: 'text', next_plan: 'text' });

module.exports = mongoose.model('Counseling', counselingSchema);
