import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../common/Toast';
import RadarChart from '../charts/RadarChart';
import TermSummaryCards from './TermSummaryCards';
import TermTrendChart from './TermTrendChart';

export default function StudentAnalyticsTab({ studentId }) {
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [termDetail, setTermDetail] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // 전체 학기 목록 로드
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await api.get(`/analytics/students/${studentId}/terms`);
        const list = res.data.data || [];
        setTerms(list);
        if (list.length > 0) {
          const last = list[list.length - 1];
          setSelectedTerm({ year: last.year, semester: last.semester });
        }
      } catch {
        toast.error('분석 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, [studentId]);

  // 선택된 학기의 상세 데이터 로드
  useEffect(() => {
    if (!selectedTerm) return;
    const { year, semester } = selectedTerm;

    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const [detailRes, subjectRes] = await Promise.all([
          api.get(`/analytics/students/${studentId}/terms/${year}/${semester}`),
          api.get(`/analytics/students/${studentId}/subjects`, { params: { year, semester } }),
        ]);
        setTermDetail(detailRes.data.data);
        setSubjects(subjectRes.data.data || []);
      } catch {
        toast.error('학기 상세 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [studentId, selectedTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        아직 집계된 분석 데이터가 없습니다.<br />
        성적/출결/피드백을 입력한 뒤 자동으로 생성됩니다.
      </div>
    );
  }

  const radarData = subjects.map((s) => ({
    subject_name: s.subject_name,
    score: s.score ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* 학기 선택 */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">학기 선택</label>
        <select
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={selectedTerm ? `${selectedTerm.year}-${selectedTerm.semester}` : ''}
          onChange={(e) => {
            const [y, s] = e.target.value.split('-');
            setSelectedTerm({ year: Number(y), semester: Number(s) });
          }}
        >
          {terms.map((t) => (
            <option key={`${t.year}-${t.semester}`} value={`${t.year}-${t.semester}`}>
              {t.year}년 {t.semester}학기
            </option>
          ))}
        </select>
      </div>

      {detailLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <TermSummaryCards termDetail={termDetail} />

          {/* 학기별 추이 */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <TermTrendChart terms={terms} />
          </div>

          {/* 과목별 성적 레이더 */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">과목별 성적</p>
            {radarData.length > 0 ? (
              <RadarChart data={radarData} />
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">이 학기 과목 데이터가 없습니다.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
