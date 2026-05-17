const Grade = require('../../models/Grade');
const Attendance = require('../../models/Attendance');
const Feedback = require('../../models/Feedback');
const Counseling = require('../../models/Counseling');
const aggregator = require('./aggregator');

/**
 * 운영 흐름을 깨지 않도록 훅/스트림에서 발생한 에러를 삼킨다.
 */
async function safeRun(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`[analytics:${label}]`, err.message);
  }
}

// ──────────── 학기/월 키 추출 ────────────

function termOfGrade(doc) {
  if (!doc?.year || !doc?.semester) return null;
  return { year: doc.year, semester: doc.semester };
}

function termOfAttendance(doc) {
  if (!doc?.date) return null;
  return aggregator.classifyTerm(doc.date);
}

function monthOfAttendance(doc) {
  if (!doc?.date) return null;
  const d = new Date(doc.date);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function termOfFeedback(doc) {
  if (!doc?.created_at) return null;
  return aggregator.classifyTerm(doc.created_at);
}

function termOfCounseling(doc) {
  if (!doc?.counseling_date) return null;
  return aggregator.classifyTerm(doc.counseling_date);
}

// ──────────── 재집계 작업 (Change Stream + 훅 공통) ────────────

async function reaggGrade(doc) {
  if (!doc.student_id) return;
  const t = termOfGrade(doc);
  if (!t) return;
  await aggregator.aggregateStudentSubjectTerm(doc.student_id, doc.subject_name, t.year, t.semester);
  await aggregator.aggregateStudentTerm(doc.student_id, t.year, t.semester);
}

async function reaggAttendance(doc) {
  if (!doc.student_id) return;
  const m = monthOfAttendance(doc);
  const t = termOfAttendance(doc);
  if (m) await aggregator.aggregateStudentAttendanceMonth(doc.student_id, m.year, m.month);
  if (t) await aggregator.aggregateStudentTerm(doc.student_id, t.year, t.semester);
}

async function reaggFeedback(doc) {
  if (!doc.student_id) return;
  const t = termOfFeedback(doc);
  if (!t) return;
  await aggregator.aggregateStudentFeedbackTerm(doc.student_id, t.year, t.semester);
  await aggregator.aggregateStudentTerm(doc.student_id, t.year, t.semester);
}

async function reaggCounseling(doc) {
  if (!doc.student_id) return;
  const t = termOfCounseling(doc);
  if (!t) return;
  await aggregator.aggregateStudentTerm(doc.student_id, t.year, t.semester);
}

// ──────────── Change Stream 리스너 ────────────
// delete 이벤트는 fullDocument가 없어 처리 불가 → delete 훅에서 커버.

function startWatcher(Model, label, reagg) {
  const stream = Model.watch([], { fullDocument: 'updateLookup' });
  stream.on('change', (change) => safeRun(`stream:${label}`, async () => {
    if (change.operationType === 'delete') return;
    const doc = change.fullDocument;
    if (!doc) return;
    await reagg(doc);
  }));
  stream.on('error', (err) => {
    console.error(`[stream:${label}] error, restarting in 5s:`, err.message);
    setTimeout(() => startWatcher(Model, label, reagg), 5000);
  });
}

// ──────────── Delete 훅 부착 (① 시연용 즉시 동기화) ────────────
// 모델 파일은 건드리지 않고 컴파일된 모델의 schema에 query hook을 등록.

function attachDeleteHooksFor(Model, reagg) {
  const schema = Model.schema;

  schema.pre('findOneAndDelete', async function () {
    try { this._analyticsDoc = await this.model.findOne(this.getFilter()).lean(); } catch (_) {}
  });
  schema.pre('deleteOne', { document: false, query: true }, async function () {
    try { this._analyticsDoc = await this.model.findOne(this.getFilter()).lean(); } catch (_) {}
  });
  schema.pre('deleteMany', { document: false, query: true }, async function () {
    try { this._analyticsDocs = await this.model.find(this.getFilter()).lean(); } catch (_) {}
  });

  schema.post('findOneAndDelete', async function () {
    if (this._analyticsDoc) await safeRun('hook:delete', () => reagg(this._analyticsDoc));
  });
  schema.post('deleteOne', { document: false, query: true }, async function () {
    if (this._analyticsDoc) await safeRun('hook:delete', () => reagg(this._analyticsDoc));
  });
  schema.post('deleteMany', { document: false, query: true }, async function () {
    for (const doc of this._analyticsDocs || []) {
      await safeRun('hook:deleteMany', () => reagg(doc));
    }
  });
}

function attachDeleteHooks() {
  attachDeleteHooksFor(Grade, reaggGrade);
  attachDeleteHooksFor(Attendance, reaggAttendance);
  attachDeleteHooksFor(Feedback, reaggFeedback);
  attachDeleteHooksFor(Counseling, reaggCounseling);
}

// ──────────── entrypoint ────────────

let started = false;

function startAnalyticsStreams() {
  if (started) return;
  started = true;

  attachDeleteHooks();
  startWatcher(Grade, 'Grade', reaggGrade);
  startWatcher(Attendance, 'Attendance', reaggAttendance);
  startWatcher(Feedback, 'Feedback', reaggFeedback);
  startWatcher(Counseling, 'Counseling', reaggCounseling);

  console.log('[analytics] Change Streams + delete hooks started');
}

module.exports = { startAnalyticsStreams };
