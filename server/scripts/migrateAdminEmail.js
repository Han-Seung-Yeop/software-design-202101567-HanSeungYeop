require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Teacher = require('../src/models/Teacher');

const OLD_EMAIL = 'gkstmdduq7@gmail.com';
const NEW_EMAIL = 'seungyeobhan000@gmail.com';

(async () => {
  try {
    await connectDB();

    const teacher = await Teacher.findOne({ email: OLD_EMAIL });
    if (!teacher) {
      console.log(`ℹ️  Teacher with ${OLD_EMAIL} not found — nothing to migrate`);
    } else {
      await Teacher.updateOne({ email: OLD_EMAIL }, { $set: { email: NEW_EMAIL } });
      console.log(`✅ Teacher email updated: ${OLD_EMAIL} → ${NEW_EMAIL}`);
    }

    const newUser = await User.findOne({ email: NEW_EMAIL });
    const oldUser = await User.findOne({ email: OLD_EMAIL });

    if (newUser) {
      await Teacher.updateOne({ email: NEW_EMAIL }, { $set: { user_id: newUser._id } });
      console.log(`✅ Teacher.user_id linked to existing User (${NEW_EMAIL})`);

      if (oldUser) {
        await User.deleteOne({ email: OLD_EMAIL });
        console.log(`✅ Old User deleted: ${OLD_EMAIL}`);
      }
    } else if (oldUser) {
      await User.updateOne({ email: OLD_EMAIL }, { $set: { email: NEW_EMAIL } });
      console.log(`✅ User email updated: ${OLD_EMAIL} → ${NEW_EMAIL}`);
    } else {
      console.log(`ℹ️  No User found for either email — nothing to migrate`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
})();
