import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export default function RadarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        성적 데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.map(item => ({
    subject: item.subject_name,
    score: item.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReRadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar
          name="점수"
          dataKey="score"
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.3}
        />
        <Tooltip formatter={(value) => [`${value}점`, '점수']} />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
