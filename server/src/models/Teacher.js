const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
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
  department: {
    type: String,
    default: '미지정',
  },
  position: {
    type: String,
    default: '',
  },
  grade_year: {
    type: Number,
  },
  class_num: {
    type: Number,
  },
  is_super_admin: {
    type: Boolean,
    default: false,
  },
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

module.exports = mongoose.model('Teacher', teacherSchema);
