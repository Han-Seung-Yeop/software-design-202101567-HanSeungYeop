// 교사 접근 제어 scope를 'all' → 'class'로 수정
// 실행: node scripts/fixAccessControlScope.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB 연결됨');

  const result = await mongoose.connection.db.collection('access_controls').updateMany(
    { role: 'teacher', collection_name: { $nin: ['teachers', 'parents'] } },
    { $set: { scope: 'class' } }
  );

  console.log(`${result.modifiedCount}개 규칙의 scope를 'class'로 변경 완료`);

  await mongoose.disconnect();
  console.log('완료');
}

run().catch(console.error);
