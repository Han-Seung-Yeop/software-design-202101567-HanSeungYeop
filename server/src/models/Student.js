const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  grade_year: {
    type: Number,
    required: true,
  },
  class_num: {
    type: Number,
    required: true,
  },
  student_num: {
    type: Number,
    required: true,
  },
  parent_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
    },
  ],
  invited_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  invited_at: {
    type: Date,
    default: Date.now,
  },
  activated_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

studentSchema.index(
  { grade_year: 1, class_num: 1, student_num: 1 },
  { unique: true }
);

module.exports = mongoose.model('Student', studentSchema);
