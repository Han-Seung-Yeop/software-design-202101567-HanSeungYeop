const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ko-KR');
};

const baseStyles = `
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    color: #1f2937;
    margin: 0;
    padding: 0;
    font-size: 11pt;
  }
  .report {
    width: 100%;
  }
  h1 {
    font-size: 20pt;
    margin: 0 0 4mm 0;
    color: #111827;
  }
  .meta {
    color: #6b7280;
    font-size: 10pt;
    margin-bottom: 6mm;
  }
  .student-info {
    background: #f3f4f6;
    border-left: 4px solid #4f46e5;
    padding: 4mm 5mm;
    margin-bottom: 6mm;
    font-size: 11pt;
  }
  .student-info strong { color: #111827; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6mm;
    font-size: 10pt;
  }
  th {
    background: #4f46e5;
    color: white;
    padding: 2.5mm 3mm;
    text-align: left;
    font-weight: 600;
  }
  td {
    border: 1px solid #e5e7eb;
    padding: 2.5mm 3mm;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f9fafb; }
  .section-title {
    font-size: 13pt;
    font-weight: 600;
    margin: 6mm 0 3mm 0;
    color: #111827;
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 1.5mm;
  }
  .badge {
    display: inline-block;
    padding: 0.5mm 2mm;
    border-radius: 3mm;
    font-size: 9pt;
    background: #eef2ff;
    color: #4338ca;
  }
  .empty {
    color: #9ca3af;
    text-align: center;
    padding: 8mm;
    font-style: italic;
  }
  .footer {
    margin-top: 8mm;
    text-align: right;
    font-size: 9pt;
    color: #9ca3af;
  }
</style>
`;

const studentBlock = (student) => `
  <div class="student-info">
    <strong>${escapeHtml(student.name)}</strong>
    (${student.grade_year}학년 ${student.class_num}반 ${student.student_num}번)
  </div>
`;

const wrapDocument = (title, body, generatedAt) => `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  ${baseStyles}
</head>
<body>
  <div class="report">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">생성일: ${formatDate(generatedAt)}</div>
    ${body}
    <div class="footer">학생 관리 시스템에서 자동 생성된 보고서입니다.</div>
  </div>
</body>
</html>
`;

const renderGradeReport = (data) => {
  const yearLabel = data.filter.year ? `${data.filter.year}학년도` : '전체 기간';

  const rowsHtml = data.rows.length === 0
    ? `<tr><td colspan="6" class="empty">성적 데이터가 없습니다.</td></tr>`
    : data.rows.map((r) => `
        <tr>
          <td>${escapeHtml(r.year)}</td>
          <td>${escapeHtml(r.semester)}</td>
          <td>${escapeHtml(r.subject_name)}</td>
          <td>${escapeHtml(r.score)}</td>
          <td><span class="badge">${escapeHtml(r.grade_level || '-')}</span></td>
          <td>${escapeHtml(r.teacher_name)}</td>
        </tr>
      `).join('');

  const summaryHtml = data.summary.length === 0 ? '' : `
    <div class="section-title">학기별 요약</div>
    <table>
      <thead>
        <tr>
          <th>연도</th><th>학기</th><th>과목 수</th><th>총점</th><th>평균</th>
        </tr>
      </thead>
      <tbody>
        ${data.summary.map((s) => `
          <tr>
            <td>${s.year}</td>
            <td>${s.semester}</td>
            <td>${s.subject_count}</td>
            <td>${s.total_score}</td>
            <td>${s.average}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const body = `
    ${studentBlock(data.student)}
    <div class="section-title">${yearLabel} 과목별 성적</div>
    <table>
      <thead>
        <tr>
          <th>연도</th><th>학기</th><th>과목</th><th>점수</th><th>등급</th><th>담당 교사</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    ${summaryHtml}
  `;

  return wrapDocument('성적 분석 보고서', body, data.generated_at);
};

const renderCounselingReport = (data) => {
  const rangeLabel = data.filter.from || data.filter.to
    ? `${data.filter.from || '처음'} ~ ${data.filter.to || '오늘'}`
    : '전체 기간';

  const rowsHtml = data.rows.length === 0
    ? `<tr><td colspan="5" class="empty">상담 기록이 없습니다.</td></tr>`
    : data.rows.map((r) => `
        <tr>
          <td>${formatDate(r.counseling_date)}</td>
          <td>${escapeHtml(r.teacher_name)}</td>
          <td>${escapeHtml(r.main_content)}</td>
          <td>${escapeHtml(r.next_plan)}</td>
          <td>${r.shared_with_parent ? '<span class="badge">공유</span>' : '비공개'}</td>
        </tr>
      `).join('');

  const body = `
    ${studentBlock(data.student)}
    <div class="section-title">${rangeLabel} · 총 ${data.total}건</div>
    <table>
      <thead>
        <tr>
          <th style="width:18%">상담일</th>
          <th style="width:14%">담당 교사</th>
          <th style="width:32%">주요 내용</th>
          <th style="width:24%">다음 계획</th>
          <th style="width:12%">학부모 공유</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  return wrapDocument('상담 내역 보고서', body, data.generated_at);
};

const renderFeedbackReport = (data) => {
  const groupedHtml = Object.keys(data.grouped).length === 0 ? '' : `
    <div class="section-title">카테고리별 건수</div>
    <p>
      ${Object.entries(data.grouped)
        .map(([k, v]) => `<span class="badge">${escapeHtml(k)} ${v}건</span>`)
        .join(' ')}
    </p>
  `;

  const rowsHtml = data.rows.length === 0
    ? `<tr><td colspan="5" class="empty">피드백이 없습니다.</td></tr>`
    : data.rows.map((r) => `
        <tr>
          <td>${formatDate(r.created_at)}</td>
          <td><span class="badge">${escapeHtml(r.category)}</span></td>
          <td>${escapeHtml(r.teacher_name)}</td>
          <td>${escapeHtml(r.content)}</td>
          <td>${r.shared_with_student ? '공유' : '비공개'}</td>
        </tr>
      `).join('');

  const body = `
    ${studentBlock(data.student)}
    ${groupedHtml}
    <div class="section-title">전체 피드백 (${data.total}건)</div>
    <table>
      <thead>
        <tr>
          <th style="width:14%">작성일</th>
          <th style="width:12%">카테고리</th>
          <th style="width:14%">담당 교사</th>
          <th style="width:48%">내용</th>
          <th style="width:12%">학생 공유</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  return wrapDocument('피드백 요약 보고서', body, data.generated_at);
};

module.exports = {
  renderGradeReport,
  renderCounselingReport,
  renderFeedbackReport,
};
