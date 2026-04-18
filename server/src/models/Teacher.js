const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
  },
  position: {
    type: String,
  },
  grade_year: {
    type: Number,
  },
  class_num: {
    type: Number,
  },
});

module.exports = mongoose.model('Teacher', teacherSchema);
