const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
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
});

module.exports = mongoose.model('Student', studentSchema);
