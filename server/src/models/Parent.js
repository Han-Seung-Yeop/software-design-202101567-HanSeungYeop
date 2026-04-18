const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  student_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
  ],
});

module.exports = mongoose.model('Parent', parentSchema);
