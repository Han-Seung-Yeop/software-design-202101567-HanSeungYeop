import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function TermTrendChart({ terms }) {
  if (!terms || terms.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        학기 데이터가 없습니다.
      </div>
    );
  }

  const data = terms.map((t) => ({
    name: `${t.year}-${t.semester}학기`,
    평균: t.average != null ? parseFloat(t.average.toFixed(1)) : null,
    출석률: t.attendance_rate != null ? parseFloat(t.attendance_rate.toFixed(1)) : null,
  }));

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">학기별 추이</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <ReferenceLine y={70} stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: '70점', fontSize: 10, fill: '#9ca3af' }} />
          <Line type="monotone" dataKey="평균" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
          <Line type="monotone" dataKey="출석률" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2">
        <span className="text-xs text-gray-500 flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-indigo-600"></span>성적 평균</span>
        <span className="text-xs text-gray-500 flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-green-500 border-dashed"></span>출석률(%)</span>
      </div>
    </div>
  );
}
