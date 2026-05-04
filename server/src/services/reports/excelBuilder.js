const ExcelJS = require('exceljs');

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };
const BORDER_THIN = {
  top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

const applyHeaderStyle = (row) => {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_THIN;
  });
  row.height = 24;
};

const applyDataBorder = (sheet, startRow, endRow) => {
  for (let r = startRow; r <= endRow; r++) {
    sheet.getRow(r).eachCell((cell) => {
      cell.border = BORDER_THIN;
      if (!cell.alignment) cell.alignment = { vertical: 'middle' };
    });
  }
};

const writeStudentBlock = (sheet, student) => {
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `학생 정보: ${student.name} (${student.grade_year}학년 ${student.class_num}반 ${student.student_num}번)`;
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 28;
  sheet.addRow([]);
};

const buildGradeWorkbook = (data) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = '학생 관리 시스템';
  wb.created = new Date();

  const sheet = wb.addWorksheet('성적 분석');
  sheet.columns = [
    { width: 8 },
    { width: 8 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
    { width: 14 },
  ];

  writeStudentBlock(sheet, data.student);

  const headerRow = sheet.addRow(['연도', '학기', '과목', '점수', '등급', '담당 교사']);
  applyHeaderStyle(headerRow);

  const dataStart = sheet.rowCount + 1;
  data.rows.forEach((r) => {
    sheet.addRow([r.year, r.semester, r.subject_name, r.score, r.grade_level, r.teacher_name]);
  });
  applyDataBorder(sheet, dataStart, sheet.rowCount);

  if (data.summary.length > 0) {
    sheet.addRow([]);
    const summaryHeader = sheet.addRow(['연도', '학기', '과목 수', '총점', '평균', '']);
    applyHeaderStyle(summaryHeader);

    const summaryStart = sheet.rowCount + 1;
    data.summary.forEach((s) => {
      sheet.addRow([s.year, s.semester, s.subject_count, s.total_score, s.average, '']);
    });
    applyDataBorder(sheet, summaryStart, sheet.rowCount);
  }

  return wb;
};

const buildCounselingWorkbook = (data) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = '학생 관리 시스템';
  wb.created = new Date();

  const sheet = wb.addWorksheet('상담 내역');
  sheet.columns = [
    { width: 14 },
    { width: 12 },
    { width: 50 },
    { width: 40 },
    { width: 12 },
  ];

  writeStudentBlock(sheet, data.student);

  const headerRow = sheet.addRow(['상담일', '담당 교사', '주요 내용', '다음 계획', '학부모 공유']);
  applyHeaderStyle(headerRow);

  const dataStart = sheet.rowCount + 1;
  data.rows.forEach((r) => {
    sheet.addRow([
      r.counseling_date ? new Date(r.counseling_date).toISOString().slice(0, 10) : '',
      r.teacher_name,
      r.main_content,
      r.next_plan,
      r.shared_with_parent ? '공유' : '비공개',
    ]);
  });
  applyDataBorder(sheet, dataStart, sheet.rowCount);

  for (let r = dataStart; r <= sheet.rowCount; r++) {
    sheet.getRow(r).alignment = { vertical: 'top', wrapText: true };
  }

  return wb;
};

const buildFeedbackWorkbook = (data) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = '학생 관리 시스템';
  wb.created = new Date();

  const sheet = wb.addWorksheet('피드백 요약');
  sheet.columns = [
    { width: 14 },
    { width: 10 },
    { width: 12 },
    { width: 60 },
    { width: 12 },
  ];

  writeStudentBlock(sheet, data.student);

  if (Object.keys(data.grouped).length > 0) {
    sheet.mergeCells(`A${sheet.rowCount + 1}:E${sheet.rowCount + 1}`);
    const groupedRow = sheet.addRow([
      `카테고리별 건수: ${Object.entries(data.grouped).map(([k, v]) => `${k}(${v})`).join(', ')}`,
    ]);
    groupedRow.font = { italic: true, color: { argb: 'FF6B7280' } };
    sheet.addRow([]);
  }

  const headerRow = sheet.addRow(['작성일', '카테고리', '담당 교사', '내용', '학생 공유']);
  applyHeaderStyle(headerRow);

  const dataStart = sheet.rowCount + 1;
  data.rows.forEach((r) => {
    sheet.addRow([
      r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      r.category,
      r.teacher_name,
      r.content,
      r.shared_with_student ? '공유' : '비공개',
    ]);
  });
  applyDataBorder(sheet, dataStart, sheet.rowCount);

  for (let r = dataStart; r <= sheet.rowCount; r++) {
    sheet.getRow(r).alignment = { vertical: 'top', wrapText: true };
  }

  return wb;
};

const writeToBuffer = async (workbook) => workbook.xlsx.writeBuffer();

module.exports = {
  buildGradeWorkbook,
  buildCounselingWorkbook,
  buildFeedbackWorkbook,
  writeToBuffer,
};
