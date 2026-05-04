const reportDataService = require('../services/reports/reportDataService');
const excelBuilder = require('../services/reports/excelBuilder');
const pdfBuilder = require('../services/reports/pdfBuilder');

const isStudentAllowed = (req, studentId) => {
  const allowed = req.accessFilter?.student_id?.$in;
  if (!allowed) return true;
  return allowed.some((id) => id.toString() === String(studentId));
};

const sendDownload = (res, buffer, filename, mimeType) => {
  const encoded = encodeURIComponent(filename);
  res.setHeader('Content-Type', mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`
  );
  res.setHeader('Content-Length', buffer.length);
  return res.end(buffer);
};

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

const studentLabel = (student) => `${student.name}_${student.grade_year}-${student.class_num}-${student.student_num}`;

const gradeReport = async (req, res, next) => {
  try {
    const { student_id, year, format = 'excel' } = req.query;
    if (!student_id) {
      return res.status(400).json({ success: false, message: 'student_id가 필요합니다.', error: 'MISSING_STUDENT_ID' });
    }
    if (!isStudentAllowed(req, student_id)) {
      return res.status(403).json({ success: false, message: '해당 학생에 대한 접근 권한이 없습니다.', error: 'STUDENT_OUT_OF_SCOPE' });
    }

    const data = await reportDataService.getGradeReport({ studentId: student_id, year });
    if (!data) {
      return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.', error: 'STUDENT_NOT_FOUND' });
    }

    if (format === 'pdf') {
      const buffer = await pdfBuilder.buildGradePdf(data);
      return sendDownload(res, buffer, `성적보고서_${studentLabel(data.student)}.pdf`, PDF_MIME);
    }

    const wb = excelBuilder.buildGradeWorkbook(data);
    const buffer = Buffer.from(await excelBuilder.writeToBuffer(wb));
    return sendDownload(res, buffer, `성적보고서_${studentLabel(data.student)}.xlsx`, EXCEL_MIME);
  } catch (error) {
    next(error);
  }
};

const counselingReport = async (req, res, next) => {
  try {
    const { student_id, from, to, format = 'excel' } = req.query;
    if (!student_id) {
      return res.status(400).json({ success: false, message: 'student_id가 필요합니다.', error: 'MISSING_STUDENT_ID' });
    }
    if (!isStudentAllowed(req, student_id)) {
      return res.status(403).json({ success: false, message: '해당 학생에 대한 접근 권한이 없습니다.', error: 'STUDENT_OUT_OF_SCOPE' });
    }

    const data = await reportDataService.getCounselingReport({ studentId: student_id, from, to });
    if (!data) {
      return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.', error: 'STUDENT_NOT_FOUND' });
    }

    if (format === 'pdf') {
      const buffer = await pdfBuilder.buildCounselingPdf(data);
      return sendDownload(res, buffer, `상담보고서_${studentLabel(data.student)}.pdf`, PDF_MIME);
    }

    const wb = excelBuilder.buildCounselingWorkbook(data);
    const buffer = Buffer.from(await excelBuilder.writeToBuffer(wb));
    return sendDownload(res, buffer, `상담보고서_${studentLabel(data.student)}.xlsx`, EXCEL_MIME);
  } catch (error) {
    next(error);
  }
};

const feedbackReport = async (req, res, next) => {
  try {
    const { student_id, category, format = 'excel' } = req.query;
    if (!student_id) {
      return res.status(400).json({ success: false, message: 'student_id가 필요합니다.', error: 'MISSING_STUDENT_ID' });
    }
    if (!isStudentAllowed(req, student_id)) {
      return res.status(403).json({ success: false, message: '해당 학생에 대한 접근 권한이 없습니다.', error: 'STUDENT_OUT_OF_SCOPE' });
    }

    const data = await reportDataService.getFeedbackReport({ studentId: student_id, category });
    if (!data) {
      return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.', error: 'STUDENT_NOT_FOUND' });
    }

    if (format === 'pdf') {
      const buffer = await pdfBuilder.buildFeedbackPdf(data);
      return sendDownload(res, buffer, `피드백보고서_${studentLabel(data.student)}.pdf`, PDF_MIME);
    }

    const wb = excelBuilder.buildFeedbackWorkbook(data);
    const buffer = Buffer.from(await excelBuilder.writeToBuffer(wb));
    return sendDownload(res, buffer, `피드백보고서_${studentLabel(data.student)}.xlsx`, EXCEL_MIME);
  } catch (error) {
    next(error);
  }
};

module.exports = { gradeReport, counselingReport, feedbackReport };
