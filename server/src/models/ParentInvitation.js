const mongoose = require('mongoose');

const parentInvitationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  used_at: {
    type: Date,
    default: null,
  },
  used_by_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// TTL: 만료 시간이 지난 문서는 MongoDB가 자동 삭제
parentInvitationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ParentInvitation', parentInvitationSchema);
