import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function MonthlyAttendanceChart({ monthlyData }) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        출결 데이터가 없습니다.
      </div>
    );
  }

  const data = monthlyData.map((m) => ({
    name: MONTH_LABELS[m.month - 1],
    출석: m.present,
    결석: m.absent,
    지각: m.late,
    조퇴: m.early_leave,
    병결: m.sick_leave,
  }));

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">월별 출결 패턴</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="출석" stackId="a" fill="#4f46e5" />
          <Bar dataKey="결석" stackId="a" fill="#ef4444" />
          <Bar dataKey="지각" stackId="a" fill="#f59e0b" />
          <Bar dataKey="조퇴" stackId="a" fill="#8b5cf6" />
          <Bar dataKey="병결" stackId="a" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
