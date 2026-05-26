require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const User = require('../src/models/User');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');
const Parent = require('../src/models/Parent');
const Grade = require('../src/models/Grade');
const Attendance = require('../src/models/Attendance');
const Feedback = require('../src/models/Feedback');
const { calculateGradeLevel } = require('../src/utils/gradeCalculator');

const TOTAL_STUDENTS = 30;
const SUBJECTS = ['국어', '영어', '수학', '사회', '과학', '한국사'];
const ATTENDANCE_BIAS = ['출석', '출석', '출석', '출석', '출석', '출석', '출석', '출석', '결석', '지각'];
const FEEDBACK_CATEGORIES = ['성적', '행동', '출결', '태도', '기타'];
const YEAR = 2026;
const SEMESTER = 1;
const GRADE_YEAR = 2;
const CLASS_NUM = 3;

const randomScore = () => 60 + Math.floor(Math.random() * 41); // 60~100
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedAdditionalTeacher() {
  const email = 'teacher.kim@example.demo';

  // 1. Teacher record (사전 등록)
  const teacher = await Teacher.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        email,
        name: '김선생',
        department: '수학과',
        position: '담임교사',
        grade_year: GRADE_YEAR,
        class_num: CLASS_NUM,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 2. impersonate 시연용 User record 강제 생성 + 연결
  if (!teacher.user_id) {
    const user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          provider: 'google',
          provider_id: `seed_teacher_${teacher._id}`,
          name: '김선생',
          role: 'teacher',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    teacher.user_id = user._id;
    teacher.activated_at = new Date();
    await teacher.save();
  }

  return teacher;
}

async function seedStudents(invitedBy) {
  const students = [];
  for (let i = 1; i <= TOTAL_STUDENTS; i++) {
    const num = String(i).padStart(3, '0');
    const email = `student${num}@example.demo`;
    const name = `학생${i}`;

    const student = await Student.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          name,
          grade_year: GRADE_YEAR,
          class_num: CLASS_NUM,
          student_num: i,
          parent_ids: [],
          invited_by: invitedBy._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // impersonate 시연용 User record 강제 생성 + 연결
    if (!student.user_id) {
      const user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            email,
            provider: 'google',
            provider_id: `seed_student_${student._id}`,
            name,
            role: 'student',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      student.user_id = user._id;
      student.activated_at = new Date();
      await student.save();
    }

    students.push(student);
  }
  return students;
}

async function seedGrades(students, teacher) {
  const EXAM_TYPES = ['중간', '기말'];
  const SEMESTERS = [1, 2];
  for (const student of students) {
    for (const semester of SEMESTERS) {
      for (const exam_type of EXAM_TYPES) {
        for (const subject of SUBJECTS) {
          const score = randomScore();
          await Grade.findOneAndUpdate(
            { student_id: student._id, subject_name: subject, year: YEAR, semester, exam_type },
            {
              $setOnInsert: {
                student_id: student._id,
                teacher_id: teacher._id,
                subject_name: subject,
                year: YEAR,
                semester,
                exam_type,
                score,
                grade_level: calculateGradeLevel(score),
              },
            },
            { upsert: true, setDefaultsOnInsert: true }
          );
        }
      }
    }
  }
}

async function seedAttendance(students, teacher) {
  // 1학기 평일 일부 (3월 ~ 4월 일부) 시뮬레이션 — 학생당 약 20일치
  const startDate = new Date(`${YEAR}-03-02`);
  for (const student of students) {
    for (let d = 0; d < 20; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + d);
      // 주말 건너뜀
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const status = randomPick(ATTENDANCE_BIAS);
      await Attendance.findOneAndUpdate(
        { student_id: student._id, date },
        {
          $setOnInsert: {
            student_id: student._id,
            teacher_id: teacher._id,
            date,
            status,
            reason: status === '결석' ? '병결' : status === '지각' ? '교통' : '',
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }
}

async function seedFeedback(students, teacher) {
  for (const student of students) {
    const category = randomPick(FEEDBACK_CATEGORIES);
    await Feedback.findOneAndUpdate(
      { student_id: student._id, content: `${student.name} 시연용 피드백` },
      {
        $setOnInsert: {
          student_id: student._id,
          teacher_id: teacher._id,
          category,
          content: `${student.name} 시연용 피드백`,
          shared_with_parent: true,
          shared_with_student: true,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedDemoParent(firstStudent) {
  // impersonate 시연용 학부모 — 정식 흐름 우회로 강제 생성
  const email = 'demo.parent@example.demo';

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      provider: 'google',
      provider_id: `seed_demo_parent_${Date.now()}`,
      name: '김부모',
      role: 'parent',
    });
  }

  let parent = await Parent.findOne({ user_id: user._id });
  if (!parent) {
    parent = await Parent.create({
      user_id: user._id,
      email,
      name: '김부모',
      phone: '010-0000-0000',
      student_ids: [firstStudent._id],
    });
  }

  await Student.updateOne(
    { _id: firstStudent._id },
    { $addToSet: { parent_ids: parent._id } }
  );

  return { user, parent };
}

(async () => {
  try {
    await connectDB();
    console.log('Starting demo seed...');

    // 스키마 변경된 모델들의 인덱스를 Atlas와 동기화
    console.log('Syncing indexes...');
    await Promise.all([
      User.syncIndexes(),
      Teacher.syncIndexes(),
      Student.syncIndexes(),
      Parent.syncIndexes(),
      Grade.syncIndexes(),
    ]);
    console.log('✅ Indexes synced');

    const teacher = await seedAdditionalTeacher();
    console.log(`✅ Teacher: ${teacher.email}`);

    const students = await seedStudents(teacher);
    console.log(`✅ Students: ${students.length}명`);

    await seedGrades(students, teacher);
    console.log(`✅ Grades: ${students.length * SUBJECTS.length * 4}건 (1·2학기 × 중간·기말)`);

    await seedAttendance(students, teacher);
    console.log(`✅ Attendance records seeded`);

    await seedFeedback(students, teacher);
    console.log(`✅ Feedback: ${students.length}건`);

    const { parent } = await seedDemoParent(students[0]);
    console.log(`✅ Demo parent linked to ${students[0].name}: ${parent.email}`);

    console.log('🎉 Demo data seeded successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
})();
