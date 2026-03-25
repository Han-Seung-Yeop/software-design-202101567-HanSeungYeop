const Grade = require('../models/Grade');

function calculateGradeLevel(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

async function recalculateStudentGrades(studentId, year, semester) {
  const query = { student_id: studentId };
  if (year !== undefined) query.year = year;
  if (semester !== undefined) query.semester = semester;

  const grades = await Grade.find(query);

  if (grades.length === 0) {
    return { total_score: 0, average: 0 };
  }

  const total_score = grades.reduce((sum, g) => sum + g.score, 0);
  const average = total_score / grades.length;

  await Grade.updateMany(query, { $set: { total_score, average } });

  return { total_score, average };
}

module.exports = { calculateGradeLevel, recalculateStudentGrades };
