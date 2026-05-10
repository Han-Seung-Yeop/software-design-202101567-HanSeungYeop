require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');
const Parent = require('../src/models/Parent');
const AccessControl = require('../src/models/AccessControl');

const TEACHER_COLLECTIONS = [
  'grades',
  'attendances',
  'behaviors',
  'attitudes',
  'special_notes',
  'feedbacks',
  'counselings',
];
const ALL_PERMISSIONS = { create: true, read: true, update: true, delete: true };
const READ_ONLY = { create: false, read: true, update: false, delete: false };

const seedAccessControlRules = async () => {
  const rules = [
    // 교사: 담당 학급의 학생 데이터에 모든 작업 가능
    ...TEACHER_COLLECTIONS.map((coll) => ({
      role: 'teacher',
      collection_name: coll,
      permissions: ALL_PERMISSIONS,
      scope: 'class',
    })),
    { role: 'teacher', collection_name: 'students', permissions: { create: true, read: true, update: true, delete: false }, scope: 'class' },
    { role: 'teacher', collection_name: 'teachers', permissions: READ_ONLY, scope: 'all' },
    { role: 'teacher', collection_name: 'parents', permissions: READ_ONLY, scope: 'class' },

    // 학생: 본인 데이터만 읽기
    { role: 'student', collection_name: 'grades', permissions: READ_ONLY, scope: 'own' },
    { role: 'student', collection_name: 'attendances', permissions: READ_ONLY, scope: 'own' },
    { role: 'student', collection_name: 'behaviors', permissions: READ_ONLY, scope: 'own' },
    { role: 'student', collection_name: 'attitudes', permissions: READ_ONLY, scope: 'own' },
    { role: 'student', collection_name: 'special_notes', permissions: READ_ONLY, scope: 'own' },
    { role: 'student', collection_name: 'feedbacks', permissions: READ_ONLY, scope: 'own' },
    { role: 'student', collection_name: 'students', permissions: READ_ONLY, scope: 'own' },

    // 학부모: 자녀 데이터만 읽기 (피드백/상담은 shared_with_parent 추가 필터)
    { role: 'parent', collection_name: 'grades', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'attendances', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'behaviors', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'attitudes', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'special_notes', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'feedbacks', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'counselings', permissions: READ_ONLY, scope: 'own' },
    { role: 'parent', collection_name: 'students', permissions: READ_ONLY, scope: 'own' },
  ];

  let inserted = 0;
  for (const rule of rules) {
    const result = await AccessControl.updateOne(
      { role: rule.role, collection_name: rule.collection_name, user_id: { $exists: false } },
      { $setOnInsert: rule },
      { upsert: true }
    );
    if (result.upsertedCount) inserted++;
  }
  return { total: rules.length, inserted };
};

(async () => {
  try {
    await connectDB();

    // 스키마 변경된 모델들의 인덱스를 Atlas와 동기화
    // (옛 unique 인덱스 제거 + 새 인덱스 생성)
    console.log('Syncing indexes...');
    await Promise.all([
      User.syncIndexes(),
      Teacher.syncIndexes(),
      Student.syncIndexes(),
      Parent.syncIndexes(),
    ]);
    console.log('✅ Indexes synced');

    // AccessControl 기본 규칙 시드
    console.log('Seeding access control rules...');
    const acResult = await seedAccessControlRules();
    console.log(`✅ Access control: ${acResult.inserted}/${acResult.total} new rules inserted`);

    const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
    const name = process.env.SEED_ADMIN_NAME || 'Super Admin';

    if (!email) {
      console.error('❌ SEED_ADMIN_EMAIL is not set in .env');
      process.exit(1);
    }

    const result = await Teacher.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          name,
          department: '교무부',
          position: '교장',
          is_super_admin: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (result.is_super_admin) {
      console.log(`✅ Seeded super_admin: ${email} (id: ${result._id})`);
    } else {
      console.log(`ℹ️  Teacher record already exists for ${email}, skipped`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
})();
