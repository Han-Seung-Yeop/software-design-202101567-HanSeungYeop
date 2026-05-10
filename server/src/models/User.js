const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  provider: {
    type: String,
    enum: ['google'],
    default: 'google',
  },
  provider_id: {
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
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ provider: 1, provider_id: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
