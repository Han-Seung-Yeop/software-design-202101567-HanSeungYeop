const mongoose = require('mongoose');

const accessControlSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['teacher', 'student', 'parent'],
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  collection_name: {
    type: String,
    enum: [
      'grades',
      'attendances',
      'behaviors',
      'attitudes',
      'special_notes',
      'feedbacks',
      'counselings',
      'students',
      'teachers',
      'parents',
    ],
    required: true,
  },
  permissions: {
    create: { type: Boolean },
    read: { type: Boolean },
    update: { type: Boolean },
    delete: { type: Boolean },
  },
  scope: {
    type: String,
    enum: ['all', 'own', 'class', 'none'],
  },
  description: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AccessControl', accessControlSchema, 'access_controls');
