const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient_role: {
    type: String,
    enum: ['teacher', 'student', 'parent'],
    required: true,
  },
  type: {
    type: String,
    enum: [
      'GRADE_CREATED',
      'GRADE_UPDATED',
      'FEEDBACK_SHARED',
      'COUNSELING_CREATED',
      'COUNSELING_SHARED',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  ref_collection: {
    type: String,
    enum: ['Grade', 'Feedback', 'Counseling'],
    required: true,
  },
  ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  read_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ ref_collection: 1, ref_id: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
