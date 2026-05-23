export default function TermSummaryCards({ termDetail }) {
  if (!termDetail) return null;

  const attendanceRate = termDetail.attendance_rate != null
    ? termDetail.attendance_rate.toFixed(1)
    : null;

  const cards = [
    {
      label: '학기 평균',
      value: termDetail.average != null ? `${termDetail.average.toFixed(1)}점` : '-',
      sub: `최고 ${termDetail.highest_subject || '-'} (${termDetail.highest_score ?? '-'}점)`,
      color: 'indigo',
    },
    {
      label: '출석률',
      value: attendanceRate != null ? `${attendanceRate}%` : '-',
      sub: `결석 ${termDetail.attendance_count?.absent ?? 0}회 · 지각 ${termDetail.attendance_count?.late ?? 0}회`,
      color: 'green',
    },
    {
      label: '피드백 횟수',
      value: `${termDetail.feedback_count ?? 0}건`,
      sub: '교사 작성 피드백',
      color: 'amber',
    },
    {
      label: '상담 횟수',
      value: `${termDetail.counseling_count ?? 0}건`,
      sub: '이 학기 상담 기록',
      color: 'sky',
    },
  ];

  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    sky: 'bg-sky-50 border-sky-100 text-sky-700',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, color }) => (
        <div key={label} className={`rounded-lg border p-4 ${colorMap[color]}`}>
          <p className="text-xs font-medium opacity-70">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs mt-1 opacity-60">{sub}</p>
        </div>
      ))}
    </div>
  );
}
