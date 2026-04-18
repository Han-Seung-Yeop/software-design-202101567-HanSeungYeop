// 샘플 계정 비밀번호를 올바른 bcrypt 해시로 업데이트
// 실행: node scripts/resetPasswords.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accounts = [
  { login_id: 'teacher_kim', password: 'teacher1234' },
  { login_id: 'student_park', password: 'student1234' },
  { login_id: 'parent_park', password: 'parent1234' },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB 연결됨');

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const result = await mongoose.connection.db
      .collection('users')
      .updateOne({ login_id: acc.login_id }, { $set: { password: hash } });

    if (result.matchedCount > 0) {
      console.log(`✅ ${acc.login_id} → 비밀번호: ${acc.password}`);
    } else {
      console.log(`❌ ${acc.login_id} 계정 없음`);
    }
  }

  await mongoose.disconnect();
  console.log('\n완료');
}

run().catch(console.error);
