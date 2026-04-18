const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  login_id: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['teacher', 'student', 'parent'],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
