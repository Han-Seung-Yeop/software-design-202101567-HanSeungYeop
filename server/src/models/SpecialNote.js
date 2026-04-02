const mongoose = require('mongoose');

const specialNoteSchema = new mongoose.Schema({
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
  year: {
    type: Number,
  },
  semester: {
    type: Number,
  },
  category: {
    type: String,
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SpecialNote', specialNoteSchema, 'special_notes');
