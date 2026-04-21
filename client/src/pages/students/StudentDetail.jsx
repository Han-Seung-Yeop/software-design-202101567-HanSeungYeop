import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import Table from '../../components/common/Table';
import RadarChart from '../../components/charts/RadarChart';
import { ArrowLeft } from 'lucide-react';

const tabs = [
  { key: 'info', label: '기본정보' },
  { key: 'grades', label: '성적' },
  { key: 'attendances', label: '출결' },
  { key: 'behaviors', label: '행동' },
  { key: 'attitudes', label: '태도' },
  { key: 'special-notes', label: '특기사항' },
  { key: 'feedbacks', label: '피드백' },
  { key: 'counselings', label: '상담' },
];

export default function StudentDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('info');
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tabData, setTabData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        const payload = res.data.data;
        setStudent(payload?.student || payload);
        setSummary(payload?.summary || null);
      } catch (err) {
        toast.error(err.response?.data?.message || '학생 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'info') return;
    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        const endpointMap = {
          grades: '/grades',
          attendances: '/attendances',
          behaviors: '/behaviors',
          attitudes: '/attitudes',
          'special-notes': '/special-notes',
          feedbacks: '/feedbacks',
          counselings: '/counselings',
        };
        const res = await api.get(endpointMap[activeTab], { params: { student_id: id, limit: 50 } });
        const data = res.data.data;
        const key = activeTab.replace('-', '_') + 's';
        setTabData(
          data?.[key] ||
          data?.[activeTab.replace('-', '')] ||
          data?.items ||
          (Array.isArray(data) ? data : [])
        );
      } catch (err) {
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
        setTabData([]);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!student) {
    return <p className="text-center text-gray-500 py-12">학생 정보를 찾을 수 없습니다.</p>;
  }

  const gradeColumns = [
    { key: 'subject_name', label: '과목명' },
    { key: 'score', label: '점수' },
    { key: 'total_score', label: '총점' },
    { key: 'average', label: '평균' },
    { key: 'grade_level', label: '등급' },
    { key: 'input_date', label: '입력일', render: (v) => v?.slice(0, 10) },
  ];

  const teacherNameRender = (_, row) => row.teacher_id?.user_id?.name || '-';

  const attendanceColumns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    { key: 'status', label: '상태' },
    { key: 'reason', label: '사유' },
    { key: 'teacher_id', label: '기록교사', render: teacherNameRender },
  ];

  const behaviorColumns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    { key: 'category', label: '분류' },
    { key: 'content', label: '내용' },
    { key: 'teacher_id', label: '기록교사', render: teacherNameRender },
  ];

  const attitudeColumns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    { key: 'subject_name', label: '과목' },
    { key: 'content', label: '내용' },
    { key: 'rating', label: '평가' },
    { key: 'teacher_id', label: '기록교사', render: teacherNameRender },
  ];

  const specialNoteColumns = [
    { key: 'year', label: '학년도' },
    { key: 'semester', label: '학기' },
    { key: 'category', label: '분류' },
    { key: 'content', label: '내용' },
    { key: 'teacher_id', label: '기록교사', render: teacherNameRender },
  ];

  const feedbackColumns = [
    { key: 'created_at', label: '작성일', render: (v) => v?.slice(0, 10) },
    { key: 'category', label: '분류' },
    { key: 'content', label: '내용' },
    {
      key: 'shared_with_student',
      label: '학생공유',
      render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {v ? '공유' : '미공유'}
        </span>
      ),
    },
    {
      key: 'shared_with_parent',
      label: '학부모공유',
      render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${v ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {v ? '공유' : '미공유'}
        </span>
      ),
    },
  ];

  const counselingColumns = [
    { key: 'counseling_date', label: '상담일', render: (v) => v?.slice(0, 10) },
    { key: 'main_content', label: '주요내용', render: (v) => <span className="truncate max-w-xs block">{v}</span> },
    {
      key: 'is_shared',
      label: '교사공유',
      render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {v ? '공유' : '미공유'}
        </span>
      ),
    },
  ];

  const columnsByTab = {
    grades: gradeColumns,
    attendances: attendanceColumns,
    behaviors: behaviorColumns,
    attitudes: attitudeColumns,
    'special-notes': specialNoteColumns,
    feedbacks: feedbackColumns,
    counselings: counselingColumns,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/students" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">학생 상세 정보</h1>
      </div>

      {/* Student Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-400">이름</p><p className="font-semibold text-gray-800">{student.user_id?.name || '-'}</p></div>
          <div><p className="text-xs text-gray-400">학년</p><p className="font-semibold text-gray-800">{student.grade_year}학년</p></div>
          <div><p className="text-xs text-gray-400">반</p><p className="font-semibold text-gray-800">{student.class_num}반</p></div>
          <div><p className="text-xs text-gray-400">번호</p><p className="font-semibold text-gray-800">{student.student_num}번</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 min-w-24">이름</span>
                  <span className="text-sm text-gray-700">{student.user_id?.name || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 min-w-24">로그인 ID</span>
                  <span className="text-sm text-gray-700">{student.user_id?.login_id || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 min-w-24">학년</span>
                  <span className="text-sm text-gray-700">{student.grade_year}학년</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 min-w-24">반</span>
                  <span className="text-sm text-gray-700">{student.class_num}반</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 min-w-24">번호</span>
                  <span className="text-sm text-gray-700">{student.student_num}번</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 min-w-24">가입일</span>
                  <span className="text-sm text-gray-700">{student.user_id?.created_at?.slice(0, 10) || '-'}</span>
                </div>
              </div>

              {summary && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">요약</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">성적 기록</p>
                      <p className="font-semibold text-gray-800">{summary.gradesCount ?? 0}건</p>
                    </div>
                    {summary.attendanceSummary && Object.entries(summary.attendanceSummary).map(([status, count]) => (
                      <div key={status}>
                        <p className="text-xs text-gray-400">{status}</p>
                        <p className="font-semibold text-gray-800">{count}회</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-6">
              <RadarChart data={tabData} />
              <Table columns={gradeColumns} data={tabData} loading={tabLoading} />
            </div>
          )}

          {activeTab !== 'info' && activeTab !== 'grades' && (
            <Table columns={columnsByTab[activeTab] || []} data={tabData} loading={tabLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
