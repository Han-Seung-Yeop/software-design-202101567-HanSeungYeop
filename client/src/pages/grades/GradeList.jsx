import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import RadarChart from '../../components/charts/RadarChart';
import GradeForm from './GradeForm';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2 } from 'lucide-react';

export default function GradeList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [grades, setGrades] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGrade, setEditGrade] = useState(null);
  const { page, setPage, limit, reset } = usePagination(20);

  useEffect(() => {
    if (isTeacher) {
      api.get('/students', { params: { limit: 200 } })
        .then(res => {
          const data = res.data.data;
          setStudents(data?.students || data || []);
        })
        .catch(() => {});
    }
  }, [isTeacher]);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (selectedStudentId) params.student_id = selectedStudentId;
      if (year) params.year = year;
      if (semester) params.semester = semester;
      if (subjectName) params.subject_name = subjectName;

      const res = await api.get('/grades', { params });
      const data = res.data.data;
      setGrades(data?.grades || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '성적 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [page, selectedStudentId, year, semester, subjectName]);

  const columns = [
    { key: 'subject_name', label: '과목명' },
    { key: 'score', label: '점수' },
    { key: 'total_score', label: '총점' },
    { key: 'average', label: '평균' },
    { key: 'grade_level', label: '등급' },
    { key: 'created_at', label: '입력일', render: (v) => v?.slice(0, 10) },
    ...(isTeacher ? [{
      key: 'edit',
      label: '수정',
      render: (_, row) => (
        <button
          onClick={() => { setEditGrade(row); setShowForm(true); }}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 size={15} />
        </button>
      ),
    }] : []),
  ];

  const radarData = grades.map(g => ({ subject_name: g.subject_name, score: g.score }));
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '성적 관리' : user?.role === 'parent' ? '자녀 성적' : '내 성적'}</h1>
        {isTeacher && (
          <button
            onClick={() => { setEditGrade(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            성적 입력
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          {isTeacher && (
            <select
              value={selectedStudentId}
              onChange={(e) => { setSelectedStudentId(e.target.value); reset(); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">전체 학생</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.grade_year}-{s.class_num}-{s.student_num})</option>
              ))}
            </select>
          )}
          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(e.target.value); reset(); }}
            placeholder="학년도"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
          />
          <select
            value={semester}
            onChange={(e) => { setSemester(e.target.value); reset(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">전체 학기</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => { setSubjectName(e.target.value); reset(); }}
            placeholder="과목명"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">성적 분포</h2>
          <RadarChart data={radarData} />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={grades} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <GradeForm
          grade={editGrade}
          studentId={!isTeacher ? user?.student_id : undefined}
          onClose={() => { setShowForm(false); setEditGrade(null); }}
          onSuccess={fetchGrades}
        />
      )}
    </div>
  );
}
